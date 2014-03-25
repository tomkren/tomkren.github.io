
/* -- 'opts.solver' interface --
opts.solver = {
  initRunKnowledge : function (opts)               {..},
  generatePop      : function (opts, runKnowledge) {..},
  evalPopOpts      : {      
    mkIndivArr     : ...,  
    mkIndivFitness : ...
  },
  commOpts : {
      size     : fun (term)  ...,
      indivStr : fun (indiv) ...
  },
  updateRunKnowledge : function (runKnowledge, evaledPop, opts) {..returns runKnowledge..}
  ctx                : <CTX>
} */

var Solver = (function () {

  function startWorker (optsStr, msgHandler) {
    msgHandler = msgHandler || log;
    var worker = new Worker('js/worker.js');
    worker.addEventListener('message', function(e) {
      msgHandler( JSON.parse(e.data) );
    }, false);
    worker.postMessage( JSON.stringify({optsStr: optsStr}) ); 
    return worker; 
  }

  function run (opts, communicator) {

    var solver  = opts.solver;
    var evalPop = mkEvalPop(opts);

    var operatorsDist = mkDist(opts.operators);

    for (var run = 1; run <= opts.numRuns; run++) {

      var gen = 0;
      communicator.runBegin(run);

      var runKnowledge = solver.initRunKnowledge(opts);
      var pop          = solver.generatePop(opts, runKnowledge);

      var evaledPop    = evalPop(pop);
      runKnowledge     = solver.updateRunKnowledge(runKnowledge, evaledPop, opts);

      sendGenInfo(opts, run, gen, evaledPop, runKnowledge, communicator, solver);
      
      while (gen < opts.numGens-1 && !evaledPop.terminate) {
        pop = [];
        
        // preserve best individual (TODO generalize to elitism) 
        if (opts.saveBest) {
          pop.push( evaledPop.best.indiv.term );
        }

        // fill the new pop
        while (pop.length < opts.popSize) {
          var operator = operatorsDist.get();
            
          var parents    = [];
          var numParents = _.isFunction(operator.in) ? operator.in(opts) : operator.in ;
          for (var i=0; i<numParents; i++) {
            parents.push( evaledPop.popDist.get().term );
          }
          
          var operatorChilds = operator.operate(parents, runKnowledge, opts);
          var maxNumChildren = opts.popSize - pop.length;
          var children = _.take( operatorChilds, maxNumChildren );
          _.each(children, function (ch) {pop.push(ch)} );
        }

        gen ++;

        evaledPop    = evalPop(pop); //solver.evalPop(pop, opts);
        runKnowledge = solver.updateRunKnowledge(runKnowledge, evaledPop, opts);

        sendGenInfo(opts, run, gen, evaledPop, runKnowledge, communicator, solver);
      }

    }

  }

  function mkEvalPop (opts) {

    var evalPopOpts = opts.solver.evalPopOpts;
    
    return function (pop) {
      return evalPop_core( evalPopOpts.mkIndivArr(pop), 
                           evalPopOpts.mkIndivFitness(opts),
                           evalPopOpts.onEvalIndivUpdate,
                           opts.minimization );
    }
  }

  function evalPop_core (indivArr, indivFitness, onEvalIndivUpdate, minimization) {

    var terminate = false;
    var best      = {fitVal: (minimization ? Number.MAX_VALUE : 0) }  ;
    var popDist   = mkDist(_.map(indivArr, function (indiv) {
      
      var fitResult = indivFitness(indiv);

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

      if (onEvalIndivUpdate) {
        indiv = onEvalIndivUpdate(indiv, fitResult.fitVal);
      }

      fitResult.indiv = indiv;

      best = updateBest(best, fitResult, minimization);

      return [indiv,fitResult.fitVal];
    }));

    //log(best);
    //log(popDist.bestVal(true) );
    //log('---');

    var evaledPop = {
      popDist:   popDist,
      terminate: terminate,
      best:      best
    };

    return evaledPop;

  }

  function sendGenInfo (opts, run, gen, evaledPop, runKnowledge, communicator, solver) {

    var popDist   = evaledPop.popDist;
    var bestIndiv = evaledPop.best.indiv;
    var bestTerm  = bestIndiv.term;

    var popArr      = popDist.distArr();
    var sumTermSize = 0;
    var largest     = {fitVal: 0};
    var smallest    = {fitVal: -Number.MAX_VALUE};
    for (var i = 0; i < popArr.length; i++) {
      var indivTerm = popArr[i][0].term;
      var size      = solver.commOpts.size(indivTerm); //    <-----------
      sumTermSize  += size;
      largest       = updateBest(largest,  {term: indivTerm, fitVal:  size});
      smallest      = updateBest(smallest, {term: indivTerm, fitVal: -size});
    }
    var avgTermSize = sumTermSize / popArr.length;
    var maxTermSize = largest.fitVal;
    var minTermSize = -smallest.fitVal;

    communicator.sendStats({
      run:        run,
      gen:        gen,
      terminate:  evaledPop.terminate,
      best:       opts.minimization ? popDist.worstVal() : popDist.bestVal(),
      avg:        popDist.avgVal(),
      worst:      opts.minimization ? popDist.bestVal() : popDist.worstVal(),
      bestSize:   solver.commOpts.size(bestTerm),  //    <-----------
      avgSize:    avgTermSize,
      maxSize:    maxTermSize,
      minSize:    minTermSize,
      best_jsStr: solver.commOpts.indivStr(bestIndiv), //    <-----------
      best_json:  JSON.stringify(bestIndiv),
      runKnowledge: opts.preprocessRK ?  opts.preprocessRK(runKnowledge) : runKnowledge
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
        bestTerm.code('lc'),2);
    }

    communicator.log(msg);
  }


  return {
    startWorker: startWorker,
    run: run
  };

})();

