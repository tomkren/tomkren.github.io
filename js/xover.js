


// TODO NEXT : pořádně otestovat AE !!!!!!!!!!!!!!!!!!
//           : ---------||------ toBetaNF !!
//           : dodelat unSKI
//           : spojit unSKI a toBetaNF, a následně otestovat že se to "nuluje" s AE.


var S = wu.autoCurry(function(f,g,x){return f(x)(g(x))}); 
var K = wu.autoCurry(function(x,y){return x});
var I = function(x){return x};

$(function () {

  t1 = parse('f :a->b->c g :a->b x :a . f x (g x) ');
  t2 = parse('x:a  y:b . x');
  t3 = AE(t2);
  t4 = AE(t1);
  t5 = parse('x:a y:a z:a.(u:a v:a w:a.u) x y z');
  t6 = AE(t5);
  t7 = toBetaNF( unSKI(t6).ret );
  t8 = toBetaNF( unSKI(t4).ret );
  t9 = toEtaNF( t5 );
});


function subs (m,x,n) {
  switch(m.c){
    case VAL : return m;
    case VAR : return m.x === x ? n : m;
    case APP : return mkApp( subs(m.m,x,n) , subs(m.n,x,n) );
    case LAM : 
      assert( m.x !== x , 'toBetaNF.subs : "shadowing"' );
      //assert( m.x notin FV(n) )
      return mkLam_( m.x , subs(m.m,x,n) , m.t );
    default  : throw 'toBetaNF.subs : default in switch';
  }
}




function mkReduce (reduction) {
  return function (term) {

    if (reduction.initTerm !== undefined) {
      reduction.initTerm(term);
    }

    function r (term) {
      if (reduction.isReducable(term)) {
        return {
          ret: reduction.mkReduct(term),
          reduced: true
        };
      }
      switch (term.c) {
        case VAL :
        case VAR : return {ret:term,reduced:false}; 
        case APP :
          var mRes = r(term.m);
          var nRes = r(term.n);
          return {
            ret    : mkApp( mRes.ret, nRes.ret ),
            reduced: mRes.reduced || nRes.reduced
          };
        case LAM :
          var res = r(term.m);
          return {
            ret    : mkLam_(term.x,res.ret,term.t),
            reduced: res.reduced
          };
        default : throw 'reduce.r : default in switch'; 
      }    
      throw 'reduce.r : should be unreachable';
    }

    return r(term);
  }
}


var new_etaReduce = mkReduce({
  initTerm : function (term) {
    if (term.FV === undefined) {
      writeFVinfo(term);
    }  
  },
  isReducable : function (term) {
    return  isLam(term)           &&
            isApp(term.m)         &&
            isVar(term.m.n)       &&
            term.x === term.m.n.x &&
            !_.contains(term.m.m.FV,term.x);
  },
  mkReduct : function (term) {
    return term.m.m;
  }
});

var new_betaReduce = mkReduce({
  isReducable : function (term) {
    return  isApp(term) && isLam(term.m);},
  mkReduct : function (term) {
    return subs(term.m.m,term.m.x,term.n);}
});



function toNF (reduction, term) {
  var res;
  do {
    res = reduction(term);
    term = res.ret;
  } while (res.reduced);
  return term;  
}

function toBetaNF (term) {
  return toNF(new_betaReduce,term);
}

function toEtaNF (term) {
  return toNF(new_etaReduce,term);
}

function unSKI (term,i){
  if (i === undefined) {i=0;}
  switch (term.c) {
    case VAL : 
      switch (term.x) {
        case 'I' : return mkTerm_I(i,term.t); 
        case 'K' : return mkTerm_K(i,term.t);
        case 'S' : return mkTerm_S(i,term.t);
        default  : return {ret:term,i:i} ;
      }
    case VAR : return {ret:term,i:i};
    case APP : 
      var mRes = unSKI(term.m,i);
      var nRes = unSKI(term.n,mRes.i); 
      return {ret:mkApp( mRes.ret , nRes.ret ), i: nRes.i };
    case LAM : 
      var res = unSKI(term.m,i); 
      return {ret:mkLam_( term.x , res.ret , term.t ),i:res.i};
    default  : throw 'unSKI : default in switch';
  }  
}

function mkTerm_I (i, typ) {
  assert(isArr(typ),'mkTerm_I: typ must be arrow.');
  assert(_.isEqual(typ.a,typ.b),
    'mkTerm_I: typ must be of the form "a->a".');
  var x = mkVar('_'+i, typ.a);
  return {
    ret: mkLam(x,x),
    i:   i+1
  };
}

function mkTerm_K (i, typ) {
  assert(isArr(typ)  ,'mkTerm_K: typ must be arrow.');
  assert(isArr(typ.b),'mkTerm_K: typ.b must be arrow.');
  assert(_.isEqual(typ.a,typ.b.b),
    'mkTerm_K: typ must be of the form "a->b->a".');
  var x = mkVar('_'+i,     typ.a);
  var y = mkVar('_'+(i+1), typ.b.a);
  return {
    ret: mkLam(x,mkLam(y,x)),
    i:   i+2
  };
}

function mkTerm_S (i, typ) {
  // (a->(b->c))  ->  ( (a->b) -> (a->c) )
  assert( isArr(typ)     && 
          isArr(typ.a)   && 
          isArr(typ.b)   && 
          isArr(typ.a.b) && 
          isArr(typ.b.a) && 
          isArr(typ.b.b) , 
          'mkTerm_S : spatne osipkovany typ '+code(typ) );
  var a = typ.a.a;
  var b = typ.a.b.a;
  var c = typ.a.b.b;
  assert( _.isEqual(a,typ.b.a.a) &&
          _.isEqual(a,typ.b.b.a) &&
          _.isEqual(b,typ.b.a.b) &&
          _.isEqual(c,typ.b.b.b) , 
          'mkTerm_S : neco nepasuje' );
  var f    = mkVar('_'+i    ,typ.a);
  var g    = mkVar('_'+(i+1),typ.b.a);
  var x    = mkVar('_'+(i+2),typ.b.b.a);
  var body = mkApp( mkApp(f,x) , mkApp(g,x) );
  return {
    ret: mkLam(f,mkLam(g,mkLam(x,body))),
    i:   i+3
  };
}

function FV (term){
  switch (term.c) {
    case VAL : return [];
    case VAR : return [term.x];
    case APP : return _.union( FV(term.m) , FV(term.n) );
    case LAM : return _.without( FV(term.m) , term.x );
    default  : throw 'FV : default in switch';
  }
};

function writeFVinfo (term) {
  var FV;
  switch (term.c) {
    case VAL : FV = []; break;
    case VAR : FV = [term.x]; break;
    case APP : 
      writeFVinfo(term.m);
      writeFVinfo(term.n);
      FV = _.union(term.m.FV, term.n.FV);
      break;
    case LAM :
      writeFVinfo(term.m);
      FV = _.without(term.m.FV, term.x);
      break;
    default : throw 'writeFVinfo: default in switch';
  }
  term.FV = FV;
}

function AE (term) {
  switch (term.c) {
    case VAL : 
    case VAR : return term;
    case APP : return mkApp( AE(term.m) , AE(term.n) );
    case LAM :
       
      if (isVar(term.m) && term.m.x === term.x) {
        return mkVal('I',term.t);
      }
         
      var mFV = FV(term.m);
        
      if (!_.contains(mFV,term.x)) {
        // K : B -> (A -> B)
        return mkApp( mkVal('K', mkArr( term.t.b , term.t ) ) ,  AE(term.m) );
      } else {
        
        if (isLam(term.m)) {
          return AE( mkLam_(term.x, AE(term.m), term.t) ); 
        }

        if (isApp(term.m)) {

          var xTyp = term.t.a;

          var lam1 = AE(mkLam(term.x,xTyp,term.m.m));
          var lam2 = AE(mkLam(term.x,xTyp,term.m.n));

          //S : (A->B->C) -> (A->B) -> a -> c
          //S f g x = f x (g x)
          var sTyp = mkTyp([ lam1.t , lam2.t , term.t ]);
          
          return mkApp( mkApp( mkVal('S',sTyp), lam1 ) , lam2 );
        }

        throw 'AE : this place in code should be unreachable';        
      }
    default : throw 'AE : default in switch';
  }
}





function isWayToLeaf (way) {
  return way.isLeaf;
}

function allWays (term, mode) {

    var isAtTreeMode = !mode || mode !== 'sexprTree';

    var allWays_ = function( term , wayToTerm ){
      switch(term.c){
        case VAR : return [{way : wayToTerm, t: term.t, isLeaf: true}];
        case VAL : return [{way : wayToTerm, t: term.t, isLeaf: true}];
        case APP : 
          if( isAtTreeMode ){
            var mWays = allWays_( term.m , wayToTerm.concat(['m']) );
            var nWays = allWays_( term.n , wayToTerm.concat(['n']) );
            return [{way : wayToTerm, t: term.t, isLeaf: false}].concat(mWays).concat(nWays);    
          } else { //sexprTreeMode
            var ret = [];
            var accWay = wayToTerm;
            while( isApp(term) ){
                ret = allWays_( term.n , accWay.concat(['n']) ).concat(ret);
                accWay = accWay.concat(['m']);
                term = term.m;
            }
            return [{way : wayToTerm, t: term.t, isLeaf: false}].concat( ret );            
          }
        case LAM : 
          var mWayz = allWays_( term.m , wayToTerm.concat(['m']) );
          return [{way : wayToTerm, t: term.t, isLeaf: false}].concat(mWayz);
        case UNF : throw 'allPoses : UNF in switch'
        default  : throw 'allPoses : default in switch '
      }
    };
    
    return allWays_(term,[]);
}



function subterm (term, wayToSubterm) {
  for( var i=0 ; i<wayToSubterm.way.length ; i++ ){
    term = term[wayToSubterm.way[i]];
  }
  return term;
}

function changeSubterm (term, way, newSubterm) {

  assert( _.isEqual(way.t,newSubterm.t) , 'changeSubterm : way typ and newSubterm typ do not match.' );

  var w = way.way;
  var zipper = mkZipperFromTerm(term);
  var go = {  
    m : goM,
    n : goN
  };

  for( var i = 0 ; i < w.length ; i++ ){
    zipper = go[w[i]](zipper);
  }

  var oldSubterm = zipper.act ;

  assert( _.isEqual(way.t,oldSubterm.t) , 'changeSubterm : way typ and oldSubterm typ do not match.' );

  zipper = mkZipper({act : newSubterm} , zipper);
  zipper = gotoTop(zipper);

  return {
    newTerm     : zipper.act ,
    oldSubterm  : oldSubterm
  };

}


//S( K(  S(  S(K(p) , S( K(ap42) , S(K(K),I)  )  )) )  , S(K(K),I)    )

//var S = function(f,g){
//  return function(x){
//    return f(x)(g(x));
//    //_partial(_.partial(f,x),_.partial(g,x)); //taky blbě pač _.partial(f_1arg,42) je fce co čekí na ()
//  };
//};
//
//var K = function(x){
//  return function(y){
//    return x;
//  };
//};
//
//var I = function(x){
//  return x;
//};

//var cur2 = function(f){
//  return function(x){
//    return function(y){
//      return f(x,y);
//    };
//  };
//};


