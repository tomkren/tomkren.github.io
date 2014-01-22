var ACO = (function () {

  var defaultAntOpts = {
    rho          : 0.15 ,
    alpha        : 1.2  ,
    beta         : 1.2   
  };

  function selectSucc (from, path, tau, succsFun, heur, antOpts) {

    var ss = succsFun(from,path);

    if (ss.length === 0) {return null;}

    var ps = [];

    var pSum = 0;
    var i;

    for( i = 0 ; i < ss.length ; i++ ){
      var to = ss[i];
      var probab = Math.pow( tau[from][to], antOpts.alpha) 
                 * Math.pow( heur(from,to), antOpts.beta);
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

    return ss[i]; 
  }

  function mkPath (antProblem, tau) {

    var succsFun = antProblem.succsFun;     
    var heur     = antProblem.heur; 
    var antOpts  = antProblem.opts;   

    var isGoal = antProblem.isGoal;   
    var next   = antProblem.from;
    var path   = [];

    while( !isGoal(path) && next !== null ){
      path.push(next);
      var next = selectSucc(next, path, tau, succsFun, heur, antOpts);  
    }

    return isGoal(path) ? path : null ;
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
            pop.push( mkPath(antProblem, runKnowledge) );
          }
          return pop;        
        }  
      }
    };

    function generatePop (opts, runKnowledge) {
      return Operators.generatePop.operate([], runKnowledge, opts);
    }


    function update_AS (runKnowledge, evaledPop) {
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

    function updateRunKnowledge (runKnowledge, evaledPop, opts) {
      switch (antProblem.method) {
        case 'AS'   : return update_AS(runKnowledge, evaledPop); 
        case 'MMAS' : throw 'TODO';
        default     : throw 'ACO.updateRunKnowledge : unsupported method';
      } 
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

    var commOpts = {
      size : function (term) {
        return term.length;
      },
      indivStr : function (indiv) {
        return JSON.stringify( indiv.term );
      }
    };

    var ctx = mkCtx({});

    return {
      initRunKnowledge: initRunKnowledge,
      updateRunKnowledge: updateRunKnowledge,
      generatePop: generatePop,
      evalPopOpts: evalPopOpts,
      commOpts: commOpts,
      ctx: ctx,

      Operators: Operators,

      antProblem: antProblem
    };

  }

  return {
    mkSolver : mkSolver,
    defaultAntOpts: defaultAntOpts
  };

})();
