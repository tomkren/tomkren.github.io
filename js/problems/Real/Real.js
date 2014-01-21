var Real = (function () {


  function repFun (x) {
    return function (n) {
      return Utils.replicate(n, x);
    };
  }

  var Sphere = {
    f : function (xs) {
      return sum(_.map(xs, function(x){return x*x;}));
    },
    interval : [-5.12, 5.12],
    optimum  : repFun(0) 
  };

  var Rosenbrock = {
    f : function (xs) {
      var ret = 0;
      for (var i=0; i<xs.length-1; i++) {
        var x = xs[i];
        var a = xs[i+1] - x*x; 
        var b = (x-1)*(x-1);
        ret  += 100*a*a + b*b;  
      }
      return ret;
    },
    interval : [-2.048,2.048],
    optimum  : repFun(1)
  };

  return {
    Sphere: Sphere,
    Rosenbrock: Rosenbrock,
  };

})();