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
    'sin'  : [ [int,int]
           , Math.sin ] 
  }),
  strategy: Strategy.rampedHalfAndHalf, 
  popSize : 500,
  numGens : 51,
  probabs : {
    crossover    : 0.9,
    reproduction : 0.1,
    mutation     : 0.0
  }
};


function gp(opts){

  var gen = 0;
  var pop = prove({
    n          : opts.popSize,
    typ        : opts.typ,
    ctx        : opts.ctx,
    strategy   : opts.strategy,
    resultMode : 'funs',
    unique     : true,
    logit      : false 
  });

  var terminate = false;
  var best = {fitVal: 0};

  var popDist = mkDist(_.map(pop,function(indiv){
    
    var fitResult = opts.fitness(indiv);
    fitResult.indiv = indiv;

    if (_.isNumber(fitResult)) {
      fitResult = {
        fitVal: fitResult,
        terminate: false
      };
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









