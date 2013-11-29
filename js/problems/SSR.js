opts = (function(){

  var basicOpts = {
    numRuns: 50,
    numGens: 51,
    popSize: 500,
    
    strategy : Strategy.rampedHalfAndHalf,
    //strategy : Strategy.geom075, 
    saveBest : true,
    operators : [
      [xover1      , 0.9],
      [copyOperator, 0.1]
    ]
  };

  var targetFun = function (x) {
    return x*x*x*x + x*x*x + x*x + x ;
  };

  var typ = mkTyp([int,int]);
  var ctx = mkCtx({
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
  });

  var xs  = _.range(-1,1,0.1);
  var len = xs.length;
  var ys  = _.map(xs, targetFun);

  var fitness  = function (f) {
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

  var xs2 = _.range(-3,3,0.1);
  var ys2  = _.map(xs2, targetFun);
  var xys2 = _.zip(xs2,ys2);

  var graphHeight = 200;
  var phenotype = {
    height: graphHeight, 
    init: function ($el) { // $el : container for phenotype
      var $pre = $('<pre>');
      var $graph = $('<div>').css({
        "width":"100%",
        "height": graphHeight + "px"
      });

      $el.append($graph);//,$pre);
      
      return {
        $graph:$graph,
        $pre:$pre
      };          // returns (sub)query for update function
    },
    update: function (el, indivFun, indiv) {
      
      var data = _.map(xs2, function(x){
        return [x,indivFun(x)];
      });
      $.plot(el.$graph, [{data:xys2,color:'red'}, {data:data,color:'green'}], {});
      //el.$pre.html(indiv);
    }
  };

  var statsOpts = {
    drawStep: 1,
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
  };

  var logOpts = {
    bestIndiv: false,
    bestVal:   true,
    avgVal:    true,
    worstVal:  false,
    valPrecision: 4,
    startTab: 'results'
  };

  return _.extend({
    typ: typ,
    ctx: ctx,
    fitness: fitness,
    phenotype: phenotype,
    statsOpts: statsOpts,
    logOpts: logOpts,
  }, basicOpts);

})();
