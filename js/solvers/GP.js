var int = mkAtm('int');

var GP = {
  mkSolver : function (GPopts) {

    function generatePop (opts, runKnowledge) {
      return prove({
        n          : opts.popSize,
        typ        : GPopts.typ,
        ctx        : GPopts.ctx,
        strategy   : GPopts.strategy,
        resultMode : 'terms',
        unique     : true,
        logit      : false 
      });
    }

    var evalPopOpts = {
      mkIndivArr: function (pop) {
        var popJS = evalTerms(pop, GPopts.ctx);
        return _.map(_.zip(pop,popJS), function (p) {
          return {term:p[0], js:p[1]};
        });        
      },
      mkIndivFitness: function (opts) {
        return function (indiv) {
          return opts.fitness(indiv.js);
        }
      } 
    };

    function initRunKnowledge (opts) {
      return null;
    }

    function updateRunKnowledge (runKnowledge, evaledPop, opts) {
      return runKnowledge;
    }


    function sendGenInfo (opts, run, gen, evaledPop, runKnowledge, communicator) {

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
        best_jsStr: evaledPop.best.indiv.js.toString(),
        runKnowledge: runKnowledge
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
      initRunKnowledge: initRunKnowledge,
      updateRunKnowledge: updateRunKnowledge,
      sendGenInfo: sendGenInfo,
      generatePop: generatePop,
      evalPopOpts: evalPopOpts,
      ctx: GPopts.ctx
    };
  },
};


