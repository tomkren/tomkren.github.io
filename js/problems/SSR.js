/*_\(_)_ __ ___  _ __ | | ___    ___ _   _ _ __ ___ | |__   ___ | (_) ___ 
\ \ | | '_ ` _ \| '_ \| |/ _ \  / __| | | | '_ ` _ \| '_ \ / _ \| | |/ __|
_\ \| | | | | | | |_) | |  __/  \__ \ |_| | | | | | | |_) | (_) | | | (__ 
\__/|_|_| |_| |_| .__/|_|\___|  |___/\__, |_| |_| |_|_.__/ \___/|_|_|\___|
                |_|               _  |___/                                
 _ __ ___  __ _ _ __ ___  ___ ___(_) ___  _ __  
| '__/ _ \/ _` | '__/ _ \/ __/ __| |/ _ \| '_ \ 
| | |  __/ (_| | | |  __/\__ \__ \ | (_) | | | |
|_|  \___|\__, |_|  \___||___/___/_|\___/|_| |_|
          |__*/ 

opts = {
  name: 'SSR',
  
  numRuns: 50,
  numGens: 51,
  popSize: 500,
 
  solver: GP.mkSolver({
    strategy : Strategy.geom075, // .rampedHalfAndHalf or .geom075 
    typ: mkTyp([int,int]),
    ctx: mkCtx({
      'plus' : [ [int,int,int]
             , function(x,y){return x+y;} ],
      'minus': [ [int,int,int]
             , function(x,y){return x-y;} ],
      'mul'  : [ [int,int,int]
             , function(x,y){return x*y;} ],
      'rdiv' : [ [int,int,int]
             , function(x,y){return y===0 ? 1 : x/y ;} ],
      'sin'  : [ [int,int]
             , Math.sin ],
      'cos'  : [ [int,int]
             , Math.cos ],
      'exp'  : [ [int,int]
             , Math.exp ],
      'rlog' : [ [int,int]
             , function(x){return x===0 ? 0 : Math.log(Math.abs(x)) ;} ]
    }),      
  }),

  saveBest : true,
  operators : [
    [xover1      , 0.9],
    [copyOperator, 0.1]
  ],

  statsOpts: StatsOpts.default,
  logOpts  : LogOpts.default,

  fitness: function (f) {
    var xs  = this.xs;
    var ys  = this.ys;
    var len = this.len;
    var terminate = true;
    var sumErr = 0;
    var i, err;
    for (i=0; i<len; i++) {
      err = Math.abs( f(xs[i]) - ys[i] );
      sumErr += err;
      if (isNaN(err))  {return {fitVal:0, terminate: false};}
      if (err >= 0.01) {terminate = false;}
    }
    return {
      fitVal: 1 / (1+sumErr),
      terminate: terminate
    };
  },

  init: function () {
  
    var targetFun = function (x) {return x*x*x*x + x*x*x + x*x + x ;} ;
    
    this.xs   = _.range(-1,1,0.1);
    this.len  = this.xs.length;
    this.ys   = _.map(this.xs, targetFun);
    
    var xs2  = _.range(-3,3,0.1);
    var ys2  = _.map(xs2, targetFun);
    var xys2 = _.zip(xs2,ys2);
    var phenotypeHeight = 200;  // 200px height

    this.phenotype = {
      height: phenotypeHeight, 
      init: function ($el) { 
        var $graph = $('<div>').css({
          "width":"100%",
          "height": phenotypeHeight + "px"
        });

        $el.append($graph);
        
        return {
          $graph:$graph,
        };     
      },
      update: function (el, indivFun, indiv, runKnowledge) {
        var data = _.map(xs2, function(x){
          return [x,indivFun(x)];
        });
        $.plot(el.$graph, [
          {data:xys2, color:'red'  }, 
          {data:data, color:'green'}
        ], {});
      }

    };
  },


}

