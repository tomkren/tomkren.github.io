
 /*88888b .d8888. d8888b. 
 `~~88~~' 88'  YP 88  `8D 
    88    `8bo.   88oodD' 
    88      `Y8b. 88~~~   
    88    db   8D 88      
    YP    `8888Y' */

opts = {
  name: 'TSP',

  numRuns: 50,
  numGens: 51,
  popSize: 500,

  solver: Ants.mkSolver(
    Ants.TSP.mkProblem({
      Q: 1000,
      initTauVal: 1,
      from: 'Praha',
      dists: {
        'Praha,Londýn'  : 1034 ,
        'Praha,Berlín'  : 280  ,
        'Berlín,Londýn' : 929  ,
        'Berlín,Paříž'  : 876  ,
        'Paříž,Praha'   : 885  ,
        'Paříž,Londýn'  : 340
      },
    }, Ants.defaultAntOpts)
  ),
 
  saveBest : true,
  operators : [],

  statsOpts: StatsOpts.default,
  logOpts  : LogOpts.default,

  init: function () {
    this.fitness = this.solver.antProblem.fitness;
    this.phenotype = {
      height: 100,
      init: function ($el){},
      update: function (el, indivFun, indiv) {},  
    };
  },

}
