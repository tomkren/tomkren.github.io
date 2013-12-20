var int = mkAtm('int');

var GP = {
  mkSolver : function (GPopts) {

    function initRunKnowledge (opts) {
      return null;
    }

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

    return {
      initRunKnowledge: initRunKnowledge,
      generatePop: generatePop,
      evalPopOpts: evalPopOpts,
      ctx: GPopts.ctx
    };
  },
};


