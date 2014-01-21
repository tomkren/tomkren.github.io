/*    \_ __ __ ___   _____| | ( )_ __   __ _ 
  / /\/ '__/ _` \ \ / / _ \ | | | '_ \ / _` |
 / /  | | | (_| |\ V /  __/ | | | | | | (_| |
 \/   |_|  \__,_| \_/ \___|_|_|_|_| |_|\__, |
           _                           |___/ 
 ___  __ _| | ___  ___ _ __ ___   __ _ _ __  
/ __|/ _` | |/ _ \/ __| '_ ` _ \ / _` | '_ \ 
\__ \ (_| | |  __/\__ \ | | | | | (_| | | | |
|___/\__,_|_|\___||___/_| |_| |_|\__,_|_| |*/

opts = {
  name: 'TSP',

  numRuns: 50,
  numGens: 201,
  popSize: 10,

  saveBest : true,
  
  statsOpts: StatsOpts.default,
  logOpts  : LogOpts.default,

  init: function () {
    
    var data = TSPutils.tsp225; //Ulysses22; //16; //.EU4,

    this.solver = ACO.mkSolver(
      TSPutils.mkTspProblem({
        Q: data.optVal,//6792.12,
        initTauVal: 1,
        from: '1', // 'Praha'
        data: data, 
        //dists: TSPutils.EU4_dists,
      }, ACO.defaultAntOpts)
    );

    this.fitness   = this.solver.antProblem.fitness;
    this.operators = [[this.solver.Operators.generatePop, 1.0]];


    var maxEdges = 500;

    //TODO: drawStyledEdges v TSPutils udělany prasacky jak sviň, předělat !
    // tady to odešle spíš než objekt pole a tam se to už je vytiskne, dvaktrat se to zbytečně třídí
    this.preprocessRK = function (tauGraph) {

      var arr = [];

      for (var i in tauGraph) {
        for (var j in tauGraph[i]) {
          arr.push({i:i, j:j, tau:tauGraph[i][j]});
        }
      }

      arr = _.sortBy(arr, function (o) {
        return o.tau;
      });

      maxEdges = maxEdges || arr.length;
      var from = arr.length - maxEdges;
      from = from >=0 ? from : 0;

      var ret = {};

      for (var k = from; k<arr.length; k++) {
        var o = arr[k];
        if (ret[o.i] === undefined) {
          ret[o.i] = {};
        }
        ret[o.i][o.j] = o.tau;
      }

      log(ret);

      return ret;
    };

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

        TSPutils.draw($('#TSP_canvas1'), data , {
          drawOptimal: true,
          drawPath: indivFun
        });

        TSPutils.draw($('#TSP_canvas2'), data , {
          tauGraph: runKnowledge
        });

      },  
    };
  },

}
