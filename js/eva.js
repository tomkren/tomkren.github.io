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

function gp (opts, communicator) {

  var operatorsDist = mkDist(opts.operators);

  for (var run = 1; run <= opts.numRuns; run++) {

    communicator.runBegin(run);

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
    sendGenInfo(opts, run, gen, evaledPop, communicator);

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
        
        var children = _.take( operator.operate(parents), 
                               opts.popSize-pop.length  );
        _.each(children, function (child) {
          pop.push(child);  
        });
      }

      gen ++;
      evaledPop = evalPop(pop, opts);  
      sendGenInfo(opts, run, gen, evaledPop, communicator);
    }

  }

  return {};//evaledPop;
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


function sendGenInfo (opts, run, gen, evaledPop, communicator) {

  var popDist = evaledPop.popDist;
  
  communicator.sendStats({
    run:       run,
    gen:       gen,
    terminate: evaledPop.terminate,
    bestVal:   popDist.bestVal(),
    avgVal:    popDist.avgVal(),
    worstVal:  popDist.worstVal()
  });

  var logOpts = opts.logOpts; 
  var somethingWritten = false;
  var valPrecision = logOpts.valPrecision;

  if (gen === 0) {
    communicator.log('\nRUN '+run+'\n');
  }

  function showVal (title, prop) {
    if (logOpts[prop]) {
      somethingWritten = true;
      return '  '+title+' '+ 
      popDist[prop]().toFixed(valPrecision); 
    } 
    return '';
  }

  var best  = showVal('BEST' , 'bestVal' );
  var avg   = showVal('AVG'  , 'avgVal'  );
  var worst = showVal('WORST', 'worstVal');

  var msg = 
    'GEN ' + prefill(gen,3) + 
    (somethingWritten ? '  :' : '') +
    best + avg + worst;

  if (logOpts.bestIndiv || evaledPop.terminate) {
    msg += '\n\n'+ formatBreak(80,
      evaledPop.best.indiv.term.code('lc'),2);
  }

  communicator.log(msg);
}


