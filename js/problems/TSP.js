
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

  saveBest : true,
  operators : [],

  statsOpts: StatsOpts.default,
  logOpts  : LogOpts.default,

  init: function () {
    
    var data = TSPutils.Ulysses16; //.EU4,

    this.solver = Ants.mkSolver(
      TSPutils.mkTspProblem({
        Q: 30,
        initTauVal: 1,
        from: '1', // 'Praha'
        data: data, 
        //dists: TSPutils.EU4_dists,
      }, Ants.defaultAntOpts)
    );

    this.fitness   = this.solver.antProblem.fitness;
    this.operators = [[this.solver.Operators.generatePop, 1.0]];

    var h = 320;

    this.phenotype = {
      height: h,
      init: function ($el){
        var $panel = $('<div id="__TSPpanel">');
        $el.append($panel);

        var w = $(window).width(); 
        var w_small = (w-15)/2; 
                
        //$panel.html(w_small);
        
 
        $panel.html(
          '<table style="margin-bottom: 3px;"><tr>'+
          '<td><canvas id="TSP_canvas1" width="'+w_small+'" height="'+h+'"></canvas>'+
          '<td><canvas id="TSP_canvas2" width="'+w_small+'" height="'+h+'"></canvas>'+
          '</table>'
        );



        $('#__TSPpanel td').css({border: '1px dotted gray'});
        
        

        return $panel;
      },
      update: function (el, indivFun, indiv, runKnowledge) {

        //log(indivFun);
        //log(runKnowledge);

        TSPutils.draw($('#TSP_canvas1'), data , {
          drawOptimal: true,
          drawPath: indivFun
          //drawPath: ['Praha', 'Londýn', 'Berlín', 'Paříž'],
        });

        TSPutils.draw($('#TSP_canvas2'), data , {
          tauGraph: runKnowledge
        });

      },  
    };
  },

}
