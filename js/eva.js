var int = mkAtm('int');

function startGPworker (optsStr, msgHandler) {
  msgHandler = msgHandler || log;
  var worker = new Worker('js/worker.js');
  worker.addEventListener('message', function(e) {
    msgHandler( JSON.parse(e.data) );
  }, false);
  worker.postMessage( JSON.stringify({optsStr: optsStr}) ); 
  return worker; 
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
  sendStats(opts, gen, evaledPop, logFun);

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
    sendStats(opts, gen, evaledPop, logFun);
  }

  var time = (new Date().getTime()) - startTime;
  logFun('\ntime: '+ Math.round(time/1000) +' s' );

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


function sendStats (opts, gen, evaledPop, logFun) {
    var popDist = evaledPop.popDist; 
    var msg = 
      'GEN ' + prefill(gen,3) + '  :' +
      '  BEST '+ popDist.bestVal().toFixed(4) +  
      '  AVG '+ popDist.avgVal().toFixed(4) +
      '  WORST '+ popDist.worstVal().toFixed(4);
    if (opts.logOpts.logBestIndiv) {
      msg += '\n\n'+ formatBreak(80,
        evaledPop.best.indiv.term.code('lc'),2);
    }
    logFun(msg);
}

