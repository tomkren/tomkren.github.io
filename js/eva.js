$(function(){
  //var 
  //res1 = gp(GPOpts1);
  //res2 = gp(GPOpts1);



});

function runGP (optsStr, msgHandler) {
  msgHandler = msgHandler || log;
  var worker = new Worker('js/worker.js');
  worker.addEventListener('message', function(e) {
    msgHandler( JSON.parse(e.data) );
  }, false);
  worker.postMessage( JSON.stringify({optsStr: optsStr}) );  
}

var int = mkAtm('int');

var SSR_str = "{\
  fitness: (function () {\
    var xs  = _.range(-1,1,0.1);\
    var ys  = _.map(xs, function (x) {return x*x*x*x + x*x*x + x*x + x ;});\
    var len = xs.length;\
    return function (f) {\
      var terminate = true;\
      var sumErr = 0;\
      var i, err;\
      for (i=0; i<len; i++) {\
        err = Math.abs( f(xs[i]) - ys[i] );\
        sumErr += err;\
        if (isNaN(err))  {return {fitVal:0, terminate: false};}\
        if (err >= 0.01) {terminate = false;}\
      }\
      return {\
        fitVal: 1 / (1+sumErr),\
        terminate: terminate\
      };\
    };\
  }()),\
  typ: mkTyp([int,int]),\
  ctx: mkCtx({\
    'plus' : [ [int,int,int]\
           , function(x,y){return x+y;} ],\
    'minus': [ [int,int,int]\
           , function(x,y){return x-y;} ],\
    'mul'  : [ [int,int,int]\
           , function(x,y){return x*y;} ],\
    'rdiv' : [ [int,int,int]\
           , function(x,y){return y===0 ? 1 : x/y ;} ],\
    'sin'  : [ [int,int]\
           , Math.sin ],\
    'cos'  : [ [int,int]\
           , Math.cos ],\
    'exp'  : [ [int,int]\
           , Math.exp ],\
    'rlog' : [ [int,int]\
           , function(x){return x===0 ? 0 : Math.log(x) ;} ]\
  }),\
  strategy : Strategy.rampedHalfAndHalf,\
  saveBest : true,\
  popSize  : 500,\
  numGens  : 51,\
  operators : [\
    [xover1      , 0.9],\
    [copyOperator, 0.1]\
  ]\
}";


function sendStats (gen, evaledPop, logFun) {
    var popDist = evaledPop.popDist; 
    var msg = 
      'GEN ' + gen + '  :' +
      '  BEST '+ popDist.bestVal().toFixed(4) +  
      '  AVG '+ popDist.avgVal().toFixed(4) +
      '  WORST '+ popDist.worstVal().toFixed(4) +'\n\n'+
      break80(evaledPop.best.indiv.term.code('lc'),2)+'\n';
    logFun(msg);
}

function gp (opts, logFun) {

  var startTime = new Date().getTime();

  var operatorsDist = mkDist(opts.operators);

  var pop = prove({
    n          : opts.popSize,
    typ        : opts.typ,
    ctx        : opts.ctx,
    strategy   : opts.strategy,
    resultMode : 'terms',
    unique     : true,
    logit      : false 
  });

  var gen = 0;
  var evaledPop = evalPop(pop, opts);
  sendStats(gen, evaledPop, logFun);

  while (gen < opts.numGens-1 && !evaledPop.terminate) {
    pop = [];
        
    if (opts.saveBest) {
      pop.push(evaledPop.best.indiv.term);
    }

    while (pop.length < opts.popSize) {
      var operator = operatorsDist.get();
        
      var parents  = [];
      for (var i=0; i<operator.in; i++) {
        parents.push( evaledPop.popDist.get().term );
      }
      
      var children = _.take( operator.operate(parents) , opts.popSize-pop.length);
      _.each(children, function (child) {
        pop.push(child);  
      });
    }

    gen ++;
    evaledPop = evalPop(pop, opts);  
    sendStats(gen, evaledPop, logFun);
  }

  var time = (new Date().getTime()) - startTime;
  logFun('time: '+ Math.round(time/1000) +' s' );

  return evaledPop;
}


function evalPop (pop, opts) {

  var popJS     = evalTerms(pop, opts.ctx);
  var popWithJS = _.map(_.zip(pop,popJS), function (p) {
    return {term:p[0], js:p[1]};
  });

  var terminate = false;
  var best = {fitVal: 0};

  var popDist = mkDist(_.map(popWithJS, function (indiv) {
    
    var fitResult = opts.fitness(indiv.js);
    fitResult.indiv = indiv;

    if (_.isNumber(fitResult)) {
      fitResult = {
        fitVal: fitResult,
        terminate: false
      };
    }

    if (isNaN(fitResult.fitVal)) {
      log('Fitness value is NaN, converted to 0.');
      fitResult.fitVal = 0;
    }

    if (fitResult.terminate) {
      terminate = true;
    }

    best = updateBest(best, fitResult);

    return [indiv,fitResult.fitVal];
  }));

  var ret = {
    popDist:   popDist,
    terminate: terminate,
    best:      best
  };

  return ret;

}






