var int = mkAtm('int');

var GP = (function(){

  function generatePop (opts) {
    return prove({
      n          : opts.popSize,
      typ        : opts.typ,
      ctx        : opts.ctx,
      strategy   : opts.strategy,
      resultMode : 'terms',
      unique     : true,
      logit      : false 
    });
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

    var evaledPop = {
      popDist:   popDist,
      terminate: terminate,
      best:      best
    };

    return evaledPop;

  }

  return {
    generatePop: generatePop,
    evalPop: evalPop
  };
})();