opts = {
  numRuns: 50,
  numGens: 51,
  popSize: 500,
  
  strategy : Strategy.rampedHalfAndHalf,
  //strategy : Strategy.geom075, 
  saveBest : true,
  operators : [
    [xover1      , 0.9],
    [copyOperator, 0.1]
  ],
  statsOpts: {
    drawStep: 2,
    graphs: {
      fitness: {
        yMax: 1.0,
        vars: {
          best:  { color: 'green', avg: true, minmax: true }, 
          avg:   { color: 'blue',  avg: true, minmax: true },
          worst: { color: 'red',   avg: true, minmax: true }
        }
      },
      size: {
        vars: {
          bestSize: { color: 'green', avg:true },
          avgSize:  { color: 'blue' , avg:true },
          maxSize:  { color: 'red'  , avg:true },
          minSize:  { color: 'gray' , avg:true }
        }
      }
    }
  },
  logOpts: {
    bestIndiv: false,
    bestVal:   true,
    avgVal:    true,
    worstVal:  false,
    valPrecision: 4,
    startTab: 'stats'
  },
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
           , function(x){return x===0 ? 0 : Math.log(x) ;} ]
  }),
  fitness: function () {
    var xs  = _.range(-1,1,0.1);
    var ys  = _.map(xs, function (x) {
      return x*x*x*x + x*x*x + x*x + x ;
    });
    var len = xs.length;
    return function (f) {
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
    };
  }()
};
