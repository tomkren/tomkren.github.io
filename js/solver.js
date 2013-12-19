
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

    var operatorsDist = mkDist(opts.operators);

    for (var run = 1; run <= opts.numRuns; run++) {

      communicator.runBegin(run);

      var pop = opts.generatePop(opts);

      var gen = 0;
      var evaledPop = opts.evalPop(pop, opts);
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
        evaledPop = opts.evalPop(pop, opts);  
        sendGenInfo(opts, run, gen, evaledPop, communicator);
      }

    }

  }

  function sendGenInfo (opts, run, gen, evaledPop, communicator) {

    var popDist  = evaledPop.popDist;
    var bestTerm = evaledPop.best.indiv.term;
    var sizeMode = {countAPPs:false,countLAMs:false};

    var popArr      = popDist.distArr();
    var sumTermSize = 0;
    var largest     = {fitVal: 0};
    var smallest    = {fitVal: -Number.MAX_VALUE};
    for (var i = 0; i < popArr.length; i++) {
      var indivTerm = popArr[i][0].term;
      var size      = termSize(indivTerm, sizeMode); 
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
      best:       popDist.bestVal(),
      avg:        popDist.avgVal(),
      worst:      popDist.worstVal(),
      bestSize:   termSize(bestTerm, sizeMode),
      avgSize:    avgTermSize,
      maxSize:    maxTermSize,
      minSize:    minTermSize,
      best_jsStr: evaledPop.best.indiv.js.toString()
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

