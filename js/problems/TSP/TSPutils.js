
var TSPutils = (function () {

  // "old"

  function mkTspProblem (tspOpts, antOpts) { //(tsp, from, Q, initTauVal) {

    var tsp;

    if (tspOpts.data) {
      tsp = mkDistGraph(tspOpts.data);
    } else if (tspOpts.dists) {
      tsp = mkTSPInstance(tspOpts.dists);  
    } else {
      throw 'TSPutils.mkTspProblem: ERR - no data supplied';
    }

    return {
      from     : tspOpts.from,
      fitness  : mkTSPFitness(tsp, tspOpts.Q),
      heur     : mkTspHeur(tsp),
      succsFun : mkTspSuccs(tsp),
      initTau  : initTau(tsp, tspOpts.initTauVal),
      isGoal   : mkTspIsGoal(tsp),
      opts     : antOpts,

      tsp: tsp
    }
  }

  function initTau (obj, val) {
    var tau = {};
    var i,j;
    for (i in obj) {
      if (tau[i] === undefined) {tau[i] = {};}
      for (j in obj[i]) {
        tau[i][j] = val; 
      }
    }
    return tau;
  }


  function mkTSPInstance (dists) {

    var graph = {};

    for (var prop in dists) {    
      var ps = prop.split(',');

      var i = ps[0];
      var j = ps[1];

      if (graph[i] === undefined) {
        graph[i] = {};      
      }
      graph[i][j] = dists[prop];

      if (graph[j] === undefined) {
        graph[j] = {};      
      }

      if (graph[j][i] === undefined) {
        graph[j][i] = graph[i][j];  
      }

    }

    return graph;
  }

  function mkTSPFitness (tsp, Q) {
    return function(path){
      var sum = 0;
      for (var s = 0; s < path.length-1; s++) {
        var i = path[s];
        var j = path[s+1];
        sum += tsp[i][j];
      }

      sum += tsp[ path[path.length-1] ][ path[0] ];

      return Q / sum;
    };
  }

  function mkTspHeur (tsp) {
    return function(i,j) {
      if (tsp[i][j] === undefined) {return 0;}
      return 1 / tsp[i][j]; 
    }
  }

  function mkTspSuccs (tsp) {

    return function (from, path) {
      var ret = [];

      for (var to in tsp[from]) {

        var obsahuje = false;
        for (var s = 0; s < path.length; s++) {
          if (path[s] === to) {
            obsahuje = true;
          }
        }

        if (!obsahuje) {
          ret.push(to);
        }

      }

      return ret;
    };
  }

  function mkTspIsGoal (tsp) {
    var size = _.size(tsp);
    return function (path) {
      return path.length === size;
    }
  }


  // "new"

  function euDist (pos1, pos2) {
    var dx = pos1[0] - pos2[0]; 
    var dy = pos1[1] - pos2[1];
    return Math.sqrt(dx*dx + dy*dy);
  }



  function mkDistGraph (data) {

    var coords = data.coords;
    assert(_.isObject(coords), 'TSPutils.mkGraph: unsupported data format');

    //function dist (pos1, pos2) {
    //  var dx = pos1[0] - pos2[0]; 
    //  var dy = pos1[1] - pos2[1];
    //  return Math.sqrt(dx*dx + dy*dy);
    //}

    var graph = {};

    var keys = _.keys(coords);
    var len  = keys.length;

    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];

        if (graph[I] === undefined) {graph[I] = {};}
        if (graph[J] === undefined) {graph[J] = {};}

        var d = euDist(coords[I], coords[J]);

        graph[I][J] = d;
        graph[J][I] = d;
      }
    }

    return graph;
  }

  function drawStyledEdges (ctx, coords, pxPos, graph) {
    var keys = _.keys(coords);
    var len  = keys.length;

    var max = -Number.MAX_VALUE;
    var min =  Number.MAX_VALUE;
    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];
        var x = graph[I][J];
        if (x < min) {min = x;}
        if (x > max) {max = x;}
      }
    }

    var alpha = 1 / (max-min);
    var beta  = - alpha * min;

    function normalize (x) {
      if (max === min) {return 0.5;}
      return alpha*x + beta;
    }

    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];


        var x = Math.round( 250 * ( 1-normalize(graph[I][J]) ) ) ;


        drawEdge(ctx, pxPos(coords[I]), pxPos(coords[J]), 'rgb('+x+','+x+','+x+')' );        
      }
    }
  }

  function drawNode (ctx, pos) {
    var nodeRadius = 2;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], nodeRadius,0,Math.PI*2);
    ctx.fill();
  }

  function drawEdge (ctx, pos1, pos2, color, lineWidth) {
    ctx.strokeStyle = color || 'black';
    ctx.lineWidth   = lineWidth || 1;
    ctx.lineCap = 'round';
    ctx.beginPath();  
    ctx.moveTo(pos1[0], pos1[1]);
    ctx.lineTo(pos2[0], pos2[1]);
    ctx.stroke();
  }

  function plus (pos1,pos2) {
    return [pos1[0]+pos2[0], pos1[1]+pos2[1]];
  }

  function krat (alpha, pos) {
    return [alpha*pos[0], alpha*pos[1]];
  }

  function draw ($el, data, drawOpts) {

    drawOpts = _.extend({
      drawPath:    false,
      drawOptimal: false,
      tauGraph:    false,
    }, drawOpts);

    var ctx = $el[0].getContext('2d');
    var w   = $el.width(); 
    var h   = $el.height();

    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,w,h); 
    
    var coords = {};

    var nodeID;
    for (nodeID in data.coords) {
      var pos = data.coords[nodeID];
      coords[nodeID] = [pos[0],-pos[1]];
    }


    var maxX = maxY = -Number.MAX_VALUE;
    var minX = minY =  Number.MAX_VALUE;

    for (nodeID in coords) {
      var pos = coords[nodeID];
      var x   = pos[0];
      var y   = pos[1];

      if (x < minX) {minX = x;}
      if (y < minY) {minY = y;}
      if (x > maxX) {maxX = x;}
      if (y > maxY) {maxY = y;}
    }

    var size, delta;
    
    if (maxX-minX > maxY-minY) {
      //log('X rules');
      size  = w;
      delta = maxX-minX; 
    } else {
      //log('Y rules');
      size  = h;
      delta = maxY-minY; 
    }

    var ods   = 10;
    var alpha = (size - 2*ods) / delta;

    var ex = (minX + maxX) / 2;
    var ey = (minY + maxY) / 2;

    var beta = [ w/2 - alpha*ex ,
                 h/2 - alpha*ey ];


    //log(alpha, betaX, betaY);

    function pxPos (pos) {
      return plus( krat(alpha,pos), beta );
    }

    if (drawOpts.tauGraph) {
      drawStyledEdges(ctx, coords, pxPos, drawOpts.tauGraph);
    }

    if (drawOpts.drawOptimal) {
      //log('draw i optimalek');
      
      var optimalPath = data.optimal;
      var len = optimalPath.length;

      for (var i=0; i<len; i++ ){
        var pos1 = coords[ optimalPath[ i       ] ];
        var pos2 = coords[ optimalPath[(i+1)%len] ];

        drawEdge(ctx, pxPos(pos1), pxPos(pos2), '#E8E8E8', 10 );

      }
    }  

    if (drawOpts.drawPath) {
      var path = drawOpts.drawPath;
      var len = path.length;

      for (var i=0; i<len; i++ ){
        var pos1 = coords[ path[ i       ] ];
        var pos2 = coords[ path[(i+1)%len] ];

        drawEdge(ctx, pxPos(pos1), pxPos(pos2), 'black', 2 );

      }
    } 

    for (nodeID in coords) {
      var pos = coords[nodeID];

      drawNode(ctx, pxPos(pos)   );  
    } 

    

  } 

  return {
    mkTspProblem: mkTspProblem,
    draw: draw,
    mkDistGraph: mkDistGraph,
  };
})();
 
TSPutils.Ulysses16 = {
  coords : {
    '1'   : [38.24, 20.42],
    '2'   : [39.57, 26.15],
    '3'   : [40.56, 25.32],
    '4'   : [36.26, 23.12],
    '5'   : [33.48, 10.54],
    '6'   : [37.56, 12.19],
    '7'   : [38.42, 13.11],
    '8'   : [37.52, 20.44],
    '9'   : [41.23,  9.10],
    '10'  : [41.17, 13.05],
    '11'  : [36.08, -5.21],
    '12'  : [38.47, 15.13],
    '13'  : [38.15, 15.35],
    '14'  : [37.51, 15.17],
    '15'  : [35.49, 14.32],
    '16'  : [39.36, 19.56]  
  },
  optimal : ['1', '14', '13', '12', '7', '6', '15', '5', '11', '9', '10', '16', '3', '2', '4', '8']   
}; 

TSPutils.EU4 = {
  coords: {
    'Praha'  : [14.43, 50.08],
    'Londýn' : [-0.1,  51.52],
    'Berlín' : [13.38, 52.52],
    'Paříž'  : [2.34,  48.86]
  },
  optimal : ["Praha","Berlín","Londýn","Paříž"]
};

TSPutils.EU4_dists = {
  'Praha,Londýn'  : 1034 ,
  'Praha,Berlín'  : 280  ,
  'Berlín,Londýn' : 929  ,
  'Berlín,Paříž'  : 876  ,
  'Paříž,Praha'   : 885  ,
  'Paříž,Londýn'  : 340
};
