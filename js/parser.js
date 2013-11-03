var LC_GRAMMAR = 
"                                                               \n\
s      = sp0 e:expr sp0 {return e}                              \n\
typ    = x:t_prim sp0 '->' sp0 y:typ {return [x,y]} / t_prim    \n\
atm    = var                                                    \n\
t_prim = atm / '(' t:typ ')' { return t; }                      \n\
expr   =  lam / app / paren / var                               \n\
paren  = '(' e:expr ')' {return e}                              \n\
app    = x:appX xs:appXS {return [x].concat(xs)}                \n\
appX   = lam / paren / var                                      \n\
appXS  = ( sp1 x:appX {return x} )+                             \n\
lam = &lamH xs:lamH m:expr {return {head : xs, body : m};}      \n\
lamH = '\\\\'? sp0 x:typedVar xs:(sp1 y:typedVar {return y})*   \n\
       sp0 '.' sp0 {return [x].concat(xs)}                      \n\
typedVar = x:var sp0 ty:(':' sp0 t:typ {return t}) {            \n\
  return [x,ty];                                                \n\
}                                                               \n\
var = x:[a-z]+ {return x.join('')}                              \n\
sp  = [ \\n\\t]                                                 \n\
sp1 = sp+                                                       \n\
sp0 = sp*                                                       \n\
";


var parse = function () {

  var parser = PEG.buildParser(LC_GRAMMAR);

  function compileErr (msg) {
    return {c:'COMPILE_ERR', msg:msg, ko:true};
  }

  function compile (parseRes,ctx,vars) {

    var i,acc;

    // VAR or VAL
    if (_.isString(parseRes)) {
      if (ctx[parseRes]) {
        return mkVal(parseRes,ctx[parseRes].t)
      } else if (vars[parseRes]) {
        return mkVar(parseRes,vars[parseRes]);
      } else {
        return compileErr('undefined variable '+parseRes);
      }
    // LAM
    } else if (parseRes.head !== undefined) {

      var newVars = _.clone(vars);

      for (i=0; i<parseRes.head.length; i++) {
        var v = parseRes.head[i];
        var name = v[0];
        var typ  = mkTyp(v[1]);
        newVars[name] = typ;
      }

      acc = compile(parseRes.body, ctx, newVars);
      if (acc.ko) {return acc;}

      for (i=parseRes.head.length-1; i>=0; i--) {
        var name = parseRes.head[i][0];
        var typ  = newVars[name]; 
        acc = mkLam(name,typ,acc);
      }

      return acc;
    // APP
    } else if (_.isArray(parseRes)) {

      acc = compile(parseRes[0], ctx, vars);
      if (acc.ko) {return acc;}

      for (i=1; i<parseRes.length; i++) {

        var arg = compile(parseRes[i], ctx, vars);
        if (arg.ko) {return arg;}

        if (!isArr(acc.t)) {
          return compileErr(
            'Type of "' + code(acc,'lc') + '" must be function ' +
            'type, but it is "'+ code(acc.t) + '".' );
        }

        if (!_.isEqual(acc.t.a,arg.t)) {
          return compileErr(
            'Input type of "' + code(acc,'lc') +
            '" and type of "'  + code(arg,'lc') + 
            '" must be the same, but they are "'+
            code(acc.t.a) + '" and "' + code(arg.t) + '".' );
        }

        acc = mkApp(acc,arg);
      }
      return acc;
    }

    throw 'parse:compile : this place should be unreachable.';
  }  

  return function (str,ctx) {
    if (ctx === undefined) {
      ctx = mkCtx({});
    }
    
    return compile(parser.parse(str),ctx,{});
  }

}();