var ACO = (function () {

  var defaultAntOpts = {
    rho          : 0.15 ,
    alpha        : 1.2  ,
    beta         : 1.2  ,
    antsPerRound : 100  ,
    numRounds    : 10   ,
  };

  var initBest = {
    path   : null,
    fitVal : 0
  };

  function aco( problem ){

    var best = initBest;
    var tau  = problem.initTau;

    for(var i = 0 ; i < problem.opts.numRounds ; i++){
      var stepResult = step( problem.from, tau , problem );
      tau  = stepResult.tau;
      best = updateBest(best,stepResult.best); 
    }

    return best;
  }

  function step( from , tau , problem ){

    var succsFun = problem.succsFun;
    var heur     = problem.heur;
    var isGoal   = problem.isGoal;
    var fitness  = problem.fitness;
    var opts     = problem.opts;

    var antPaths = [];

    for( var i = 0; i < opts.antsPerRound; i++ ){
      var path = mkPath( from , tau , succsFun , heur , isGoal , opts );
      if(path !== null ){
        antPaths.push(path);
      }
    }

    return updateTau( tau , antPaths , fitness , opts );
  }

  function updateTau( oldTau , antPaths , fitness , opts ){

    var newTau = {};

    var i,j;

    for( i in oldTau ){
      if( newTau[i] === undefined ){ newTau[i] = {}; }
      for( j in oldTau ){
        newTau[i][j] = oldTau[i][j] * (1-opts.rho); 
      }
    }

    var best = initBest;

    for( var k = 0 ; k < antPaths.length ; k++ ){
      var path    = antPaths[k];
      var fitVal  = fitness(path);

      best = updateBest(best,{path:path,fitVal:fitVal});

      var pathLen = antPaths[k].length;
      for( var s = 0 ; s < pathLen-1 ; s ++ ){

        i = antPaths[k][s];
        j = antPaths[k][s+1];

        newTau[i][j] += fitVal ;
      }

    }

    return {
      tau  : newTau, 
      best : best
    };
  }

  function mkPath_new (antProblem, tau) {
    return mkPath(
      antProblem.from, 
      tau, 
      antProblem.succsFun, 
      antProblem.heur,
      antProblem.isGoal,
      antProblem.opts
    );
  }

  function mkPath( from , tau , succsFun , heur , isGoal , opts ){
    var next = from;
    var path = [];

    while( !isGoal(path) && next !== null ){
      path.push(next);
      var next = selectSucc( next , path , tau , succsFun , heur , opts );  
    }

    return isGoal(path) ? path : null ;
  }

  function selectSucc( from , path , tau , succsFun , heur , opts ){

    var ss = succsFun(from,path);

    if( ss.length === 0 ){ return null; }

    var ps = [];

    var pSum = 0;
    var i;

    for( i = 0 ; i < ss.length ; i++ ){
      var to = ss[i];
      var probab = Math.pow( tau[from][to], opts.alpha) 
                 * Math.pow( heur(from,to), opts.beta);
      ps.push( probab );
      pSum += probab;
    }

    var ball = Math.random() * pSum;
    var nowSum = 0;

    for( i = 0 ; i < ps.length ; i++ ){
      nowSum += ps[i];
      if( ball < nowSum ){
        break;
      }
    }

    return ss[i]; //[ss[i],i,ball,ps,ss,pSum];
  }




  function mkSolver (antProblem) {

    // -- SOLVER interface ----------------

    function initRunKnowledge (opts) {
      return antProblem.initTau;
    }

    var Operators = {
      generatePop : {
        in: 0,
        operate: function (_parents, runKnowledge, opts) {
          var pop = [];
          for (var i = 0; i<opts.popSize; i++) {
            pop.push( mkPath_new(antProblem, runKnowledge) );
          }
          return pop;        
        }  
      }
    };

    function generatePop (opts, runKnowledge) {
      return Operators.generatePop.operate([], runKnowledge, opts);
    }


    function updateRunKnowledge (runKnowledge, evaledPop, opts) {
      //TODO !!!
      
      var antOpts = antProblem.opts;
      var rho     = antOpts.rho; 

      var oldTau = runKnowledge;
      var newTau = {};


      var i,j;

      // vypařování
      for (i in oldTau) {
        if (newTau[i] === undefined) {newTau[i] = {};}
        for (j in oldTau) {
          newTau[i][j] = oldTau[i][j] * (1-rho); 
        }
      }

      // postříkání
      _.each( evaledPop.popDist.distArr() , function (p) {
        var path   = p[0].term;
        var fitVal = p[1];

        var pathLen = path.length;

        for (var s = 0; s < pathLen-1; s++) {

          i = path[s];
          j = path[s+1];
                                   // TODO : (!!!)
          newTau[i][j] += fitVal ; // nemelo by se to delit?
                                   // neměl bych i opačnou pocákat? 
                                   // (ale zas pro nesymetrické ulohy neni tak zřejmý)
        }

      });

      return newTau;
    }

    var evalPopOpts = {
      mkIndivArr: function (pop)  {
        return _.map(pop, function (path) {
          return {term:path};
        }); 
      },
      mkIndivFitness: function (opts) {
        return function (indiv) {
          return opts.fitness(indiv.term);
        }
      } 
    };

    function sendGenInfo (opts, run, gen, evaledPop, runKnowledge, communicator) {
      //TODO !!!

      var popDist  = evaledPop.popDist;
      var bestTerm = evaledPop.best.indiv.term;

      communicator.sendStats({
        run:        run,
        gen:        gen,
        terminate:  evaledPop.terminate,
        best:       popDist.bestVal(),
        avg:        popDist.avgVal(),
        worst:      popDist.worstVal(),
        bestSize:   0,//termSize(bestTerm, sizeMode),
        avgSize:    0,//avgTermSize,
        maxSize:    0,//maxTermSize,
        minSize:    0,//minTermSize,
        best_jsStr: JSON.stringify( bestTerm ),
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
          JSON.stringify( bestTerm ), 2);
      }

      communicator.log(msg);


    }

    var ctx = mkCtx({});

    return {
      initRunKnowledge: initRunKnowledge,
      updateRunKnowledge: updateRunKnowledge,
      generatePop: generatePop,
      sendGenInfo: sendGenInfo,
      evalPopOpts: evalPopOpts,
      ctx: ctx,

      Operators: Operators,

      antProblem: antProblem,
      testRun: function() {
        return aco(antProblem);
      }
    };

  }

  return {
    mkSolver : mkSolver,
    defaultAntOpts: defaultAntOpts,
    Operators: {
      generateAll: undefined, // TODO ....
    },
  };

})();
