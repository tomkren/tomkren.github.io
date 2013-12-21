
/* -- 'opts.solver' interface --
opts.solver = {
  initRunKnowledge : function (opts)               {..},
  generatePop      : function (opts, runKnowledge) {..},
  evalPopOpts      : {      
    mkIndivArr: ...,  
    mkIndivFitness: ...
  },
  sendGenInfo        : function (opts, run, gen, evaledPop, runKnowledge, communicator)
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

      var evaledPop    = evalPop(pop); //solver.evalPop(pop, opts);
      runKnowledge     = solver.updateRunKnowledge(runKnowledge, evaledPop, opts);

      solver.sendGenInfo(opts, run, gen, evaledPop, runKnowledge, communicator);
      
      while (gen < opts.numGens-1 && !evaledPop.terminate) {
        pop = [];
        
        // preserve best individual (TODO generalize to elitism) 
        if (opts.saveBest) {
          pop.push( evaledPop.best.indiv.term );
        }

        // fill the new pop
        while (pop.length < opts.popSize) {
          var operator = operatorsDist.get();
            
          var parents  = [];
          for (var i=0; i<operator.in; i++) {
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

        solver.sendGenInfo(opts, run, gen, evaledPop, runKnowledge, communicator);
      }

    }

  }

  function mkEvalPop (opts) {

    var evalPopOpts = opts.solver.evalPopOpts;
    
    return function (pop) {
      return evalPop_core( evalPopOpts.mkIndivArr(pop), 
                           evalPopOpts.mkIndivFitness(opts) );
    }
  }

  function evalPop_core (indivArr, indivFitness) {

    var terminate = false;
    var best      = {fitVal: 0};
    var popDist   = mkDist(_.map(indivArr, function (indiv) {
      
      var fitResult = indivFitness(indiv);

      if (_.isNumber(fitResult)) {
        fitResult = {
          fitVal: fitResult,
          terminate: false
        };
      }

      fitResult.indiv = indiv; 

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
    startWorker: startWorker,
    run: run
  };

})();

