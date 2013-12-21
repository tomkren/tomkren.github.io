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

    var commOpts = {
      size : function (term) {
        return termSize(term, {countAPPs:false,countLAMs:false} );
      },
      indivStr : function (indiv) {
        return indiv.js.toString();
      }
    };

    function initRunKnowledge (opts) {
      return null;
    }

    function updateRunKnowledge (runKnowledge, evaledPop, opts) {
      return runKnowledge;
    }

    return {
      initRunKnowledge: initRunKnowledge,
      updateRunKnowledge: updateRunKnowledge,
      generatePop: generatePop,
      evalPopOpts: evalPopOpts,
      commOpts: commOpts,
      ctx: GPopts.ctx
    };
  },
};


