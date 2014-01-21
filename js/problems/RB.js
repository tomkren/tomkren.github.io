  /* \ ___  __ _| /\   /\___  ___| |_ ___  _ __ 
 / \/// _ \/ _` | \ \ / / _ \/ __| __/ _ \| '__|
/ _  \  __/ (_| | |\ V /  __/ (__| || (_) | |   
\/ \_/\___|\__,_|_| \_/ \___|\___|\__\___/|_|   
   ___                 _                          _        
  / __\ ___ _ __   ___| |__  _ __ ___   __ _ _ __| | _____ 
 /__\/// _ \ '_ \ / __| '_ \| '_ ` _ \ / _` | '__| |/ / __|
/ \/  \  __/ | | | (__| | | | | | | | | (_| | |  |   <\__ \
\_____/\___|_| |_|\___|_| |_|_| |_| |_|\__,_|_|  |_|\_\__*/


opts = {
  name: 'RB',

  minimization : true,

  numRuns: 10,
  numGens: 100,
  popSize: 30,

  saveBest  : true,

  logOpts  : LogOpts.default,

  init: function () {
    
    var benchmark = Real.Sphere; //Real.Rosenbrock;

    this.solver = PSO.mkSolver({
      n:     3,
      omega: 0.5,
      phi_p: 0.5,
      phi_g: 0.5,
      b_lo:  benchmark.interval[0],
      b_up:  benchmark.interval[1]
    });

    this.fitness   = benchmark.f;
    this.operators = [[this.solver.Operators.movePopOperator, 1.0]];

    var h = 20;

    this.phenotype = {
      height: h,
      init: function ($el){
        var $panel = $('<div>');
        $el.append($panel);
        return $panel;
      },
      update: function (el, indivFun, indiv, runKnowledge) {

        el.html( runKnowledge.globalBest.fitVal );

      },  
    };
  },

  statsOpts: {
    drawStep: 1,
    graphs: {
      fitness: {
        //yMax: 1.0,
        vars: {
          best:  { color: 'green', avg: true, minmax: true }, 
          avg:   { color: 'blue',  avg: true, minmax: true },
          worst: { color: 'red',   avg: true, minmax: true }
        }
      }
    }
  },

}











