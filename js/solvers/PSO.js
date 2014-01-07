var PSO = (function () {

  function mkSolver (PSOopts) {

    PSOopts = _.extend({
      n:     1,
      omega: 1,
      phi_p: 1,
      phi_g: 1,
      b_lo:  [-1],
      b_up:  [ 1]
    }, PSOopts);

    function mkParticle () {
      var n = PSOopts.n;

      var x = [];
      var v = [];

      for (var i = 0; i < n; i++) {
        var lo    = PSOopts.b_lo[i];
        var up    = PSOopts.b_up[i];
        var delta = up - lo;
        
        assert(lo <= up, 'PSO.mkSolver.mkParticle : lo must be <= up'); 

        x.push( Utils.uniformRand(lo, up) );
        v.push( Utils.uniformRand(-delta, delta) );
      }

      // TODO: potřeba promyslet jesli se při vytvoření 
      //       korektně updatuje .p a .p_fitVal

      return {x:x, v:v, p:x};
    }

    function moveParticle (particle, g) {
      
      var x = particle.x;
      var v = particle.v;
      var p = particle.p;

      var n     = PSOopts.n;
      var omega = PSOopts.omega; 
      var phi_p = PSOopts.phi_p;
      var phi_g = PSOopts.phi_g;
      var r_p   = Utils.uniformRand(0,1);
      var r_g   = Utils.uniformRand(0,1);
      
      var v_new = [];
      var x_new = [];

      for (var i = 0; i < n; i++) {
        v_new[i] = omega*v[i] + phi_p*r_p*(p[i] - x[i])
                              + phi_g*r_g*(g[i] - x[i]);
        x_new[i] = x[i] + v_new[i];
      }


      // Problém1: originálně se p updatuje už při pohybu částice,
      //           nám by se líp hodilo kdyby se updatovalo až při
      //           vyhodnocení
      // Problém2: U nás je přímočarý updatovat g vždy na konci generace,
      //           zatímco v origo arlgoritumu se to dělá po každym posunnu


      return {x:x_new, v:v_new, p:p, p_fitVal:particle.p_fitVal}; 
                                      // p zatim necháváme, jeho update se
                                      // vykoná až ve chvíli kdy budeme pro tuto 
                                      // pohnutou částici počítat fitness
    }

    function movePop (pop, g) {
      return _.map(pop, function (particle) {
        return moveParticle(particle, g);
      });
    }

    var Operators = {
      generatePop : {
        in : function (opts) {
          return opts.popSize;
        },
        operate: function (parents, runKnowledge, opts) {
          return movePop(parents, runKnowledge.globalBest.x);        
        }  
      }
    };

    function initRunKnowledge (opts) {

      return {
        globalBest: {
          x: null,
          fitVal: 0
        }
      };
    }

    function generatePop (opts, _runKnowledge) {
      var popSize = opts.popSize;
      var pop = [];
      
      for (var i = 0; i < popSize; i++) {
        pop.push( mkParticle() );
      }

      return pop;
    }

    var evalPopOpts = {
      mkIndivArr: function (pop)  {
        return _.map(pop, function (particle) {
          return {term:particle};
        }); 
      },
      mkIndivFitness: function (opts) {
        return function (indiv) {
          return opts.fitness(indiv.term.x);
        }
      },
      onEvalIndivUpdate: function (indiv, fitVal) {

        if (indiv.term.p_fitVal < fitVal) {
      
          var indiv_new = _.clone(indiv);
          indiv_new.term.p = indiv.term.x;
          indiv_new.term.p_fitVal = fitVal; 
          return indiv_new;

        } else {
          return indiv;  
        }
      } 
    };

    function updateRunKnowledge (runKnowledge, evaledPop, _opts) {
      if (evaledPop.best.fitVal > runKnowledge.globalBest.fitVal) {
        return {
          globalBest: {
            x:      evaledPop.best.indiv.term.x,
            fitVal: evaledPop.best.fitVal 
          }
        };
      } else {
        return runKnowledge;  
      }
    }

    var commOpts = {
      size : function (term) {
        return term.x.length;
      },
      indivStr : function (indiv) {
        return JSON.stringify( indiv.term.x );
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

      Operators: Operators
    };
  }

  return {
    mkSolver : mkSolver
  };

})();

