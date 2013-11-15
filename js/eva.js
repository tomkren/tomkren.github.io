$(function(){
  //var 
  res = gp(GPOpts1);
});

var int = mkAtm('int');

var GPOpts1 = {
  fitness : function(indiv){
    var fitVal = 1/(1+Math.abs(indiv(42)-23)); 
    return {
      fitVal: fitVal,
      terminate: false
    };
  },
  typ     : mkTyp([int,int]),
  ctx     : mkCtx({
    'plus' : [ [int,int,int]
           , function(x,y){return x+y;} ],
    'minus': [ [int,int,int]
           , function(x,y){return x+y;} ],
    'mul'  : [ [int,int,int]
           , function(x,y){return x*y;} ],
    'rdiv' : [ [int,int,int] 
           , function(x,y){return y===0 ? 1 : x/y ;} ],          
    'sin'  : [ [int,int]
           , Math.sin ], 
    'cos'  : [ [int,int]
           , Math.cos ],
    'exp'  : [ [int,int]
           , Math.exp ],
    'rlog' : [ [int,int]
           , function(x){return x===0 ? 0 : Math.log(x) ;} ]
  }),
  strategy : Strategy.rampedHalfAndHalf, 
  saveBest : true,
  popSize  : 500,
  numGens  : 51,
  probabs  : {
    crossover    : 0.0, //0.9,
    reproduction : 1.0, //0.1,
    mutation     : 0.0
  }
};


function gp (opts) {

  var gen = 0;
  var pop = prove({
    n          : opts.popSize,
    typ        : opts.typ,
    ctx        : opts.ctx,
    strategy   : opts.strategy,
    resultMode : 'both',
    unique     : true,
    logit      : false 
  });

  pop = _.map(_.zip(pop[0],pop[1]),function(p){
    return {term:p[0], js:p[1]};
  });

  var evalResult = evalPop(pop,opts);

 /*
  while (gen < opts.numGens && !evalResult.terminate) {
    pop = [];

    if (opts.saveBest) {
      pop.push(evalResult.best);
    }

    //while (pop.length < opts.popSize) {...}

    gen ++ ;
  }
 */

  return evalResult;

}


function evalPop (pop, opts) {

  var terminate = false;
  var best = {fitVal: 0};

  var popDist = mkDist(_.map(pop,function(indiv){
    
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

  return {
    popDist:   popDist,
    terminate: terminate,
    best:      best
  };

}






