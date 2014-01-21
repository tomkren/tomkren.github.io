
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

  function geoDist (pos1, pos2) {
    var p1 = new LatLon(pos1[0], pos1[1]);
    var p2 = new LatLon(pos2[0], pos2[1]);
    return parseFloat( p1.distanceTo(p2) ); 
  }


  function mkDistGraph (data) {

    var coords = data.coords;
    var dist   = data.dist;

    assert(_.isObject(coords), 
      'TSPutils.mkGraph: unsupported data format');

    var graph = {};

    var keys = _.keys(coords);
    var len  = keys.length;

    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];

        if (graph[I] === undefined) {graph[I] = {};}
        if (graph[J] === undefined) {graph[J] = {};}

        var d = dist(coords[I], coords[J]);

        graph[I][J] = d;
        graph[J][I] = d;
      }
    }

    return graph;
  }

  //TODO !!!!!!!!!!!! udelany prasacky jak sviň, lepší aby se tady jen tisklo co příde z 
  // preprocesu
  function drawStyledEdges (ctx, coords, pxPos, graph) {
    var keys = _.keys(coords);
    var len  = keys.length;

    var max = -Number.MAX_VALUE;
    var min =  Number.MAX_VALUE;
    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];

        if (graph[I] !== undefined && graph[I][J] !== undefined){
          var x = graph[I][J];
          if (x < min) {min = x;}
          if (x > max) {max = x;}
        }
      }
    }

    var alpha = 1 / (max-min);
    var beta  = - alpha * min;

    function normalize (x) {
      if (max === min) {return 0.5;}
      return alpha*x + beta;
    }

    var edgeArr = [];    

    for (var i = 0; i<len; i++) {
      for (var j = i+1; j<len; j++) {
        var I = keys[i];
        var J = keys[j];

        if (graph[I] !== undefined && graph[I][J] !== undefined) {

          var x = Math.round( 250 * ( 1-normalize(graph[I][J]) ) ) ;

          var colorStr = 'rgb('+x+','+x+','+x+')';

          edgeArr.push({ 
            colorStr: colorStr, 
            tau: graph[I][J],
            iPos: pxPos(coords[I]),
            jPos: pxPos(coords[J]) 
          });

        }
                
      }
    }

    edgeArr = _.sortBy( edgeArr, function (x) {
      return x.tau;
    });


    for (var k = 0; k<edgeArr.length; k++) {
      var e = edgeArr[k];
      drawEdge(ctx, e.iPos, e.jPos, e.colorStr );
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

    euDist: euDist,
    geoDist: geoDist
  };
})();
 
TSPutils.Ulysses16 = {
  dist: TSPutils.geoDist,
  coords : {
    '1'   : [38.24, 20.42], '2'   : [39.57, 26.15], '3'   : [40.56, 25.32],
    '4'   : [36.26, 23.12], '5'   : [33.48, 10.54], '6'   : [37.56, 12.19],
    '7'   : [38.42, 13.11], '8'   : [37.52, 20.44], '9'   : [41.23,  9.10], 
    '10'  : [41.17, 13.05], '11'  : [36.08, -5.21], '12'  : [38.47, 15.13], 
    '13'  : [38.15, 15.35], '14'  : [37.51, 15.17], '15'  : [35.49, 14.32], 
    '16'  : [39.36, 19.56]  
  },
  optimal : ['1', '14', '13', '12', '7', '6', '15', '5', '11', '9', '10', '16', '3', '2', '4', '8'],
  optVal: 6792.12
}; 

TSPutils.Ulysses22 = {
  dist: TSPutils.geoDist,
  coords : {
    '1' : [ 38.24, 20.42 ], '2' : [ 39.57, 26.15 ], '3' : [ 40.56, 25.32 ], 
    '4' : [ 36.26, 23.12 ], '5' : [ 33.48, 10.54 ], '6' : [ 37.56, 12.19 ], 
    '7' : [ 38.42, 13.11 ], '8' : [ 37.52, 20.44 ], '9' : [ 41.23, 9.10  ], 
    '10': [ 41.17, 13.05 ], '11': [ 36.08, -5.21 ], '12': [ 38.47, 15.13 ], 
    '13': [ 38.15, 15.35 ], '14': [ 37.51, 15.17 ], '15': [ 35.49, 14.32 ], 
    '16': [ 39.36, 19.56 ], '17': [ 38.09, 24.36 ], '18': [ 36.09, 23.00 ], 
    '19': [ 40.44, 13.57 ], '20': [ 40.33, 14.15 ], '21': [ 40.37, 14.23 ], 
    '22': [ 37.57, 22.56 ]    
  },
  optimal : ['1', '14', '13', '12', '7', '6', '15', '5', '11', '9', '10', '19', 
             '20', '21', '16', '3', '2', '17', '22', '4', '18', '8'],
  optVal : 7013 
}; 

TSPutils.tsp225 = {
  dist: TSPutils.euDist,
  coords : {
    '1':  [155.42,150.65],'2':  [375.92,164.65],'3':  [183.92,150.65],'4':  [205.42,150.65],
    '5':  [205.42,171.65],'6':  [226.42,171.65],'7':  [226.42,186.15],'8':  [226.42,207.15],
    '9':  [226.42,235.65],'10': [226.42,264.15],'11': [226.42,292.65],'12': [226.42,314.15],
    '13': [226.42,335.65],'14': [205.42,335.65],'15': [190.92,335.65],'16': [190.92,328.15],
    '17': [176.92,328.15],'18': [176.92,299.65],'19': [155.42,299.65],'20': [155.42,328.15],
    '21': [155.42,356.65],'22': [183.92,356.65],'23': [219.42,356.65],'24': [240.92,356.65],
    '25': [269.42,356.65],'26': [290.42,356.65],'27': [387.42,136.15],'28': [318.92,356.65],
    '29': [318.92,335.65],'30': [318.92,328.15],'31': [318.92,299.65],'32': [297.92,299.65],
    '33': [290.42,328.15],'34': [290.42,335.65],'35': [297.92,328.15],'36': [254.92,335.65],
    '37': [254.92,314.15],'38': [254.92,292.65],'39': [254.92,271.65],'40': [254.92,243.15],
    '41': [254.92,221.65],'42': [254.92,193.15],'43': [254.92,171.65],'44': [276.42,171.65],
    '45': [296.42,150.65],'46': [276.42,150.65],'47': [375.92,150.65],'48': [308.92,150.65],
    '49': [354.92,164.65],'50': [338.42,174.65],'51': [354.92,174.65],'52': [338.42,200.15],
    '53': [338.42,221.65],'54': [354.92,221.65],'55': [354.92,200.15],'56': [361.92,200.15],
    '57': [361.92,186.15],'58': [383.42,186.15],'59': [383.42,179.15],'60': [404.42,179.15],
    '61': [404.42,186.15],'62': [418.92,186.15],'63': [418.92,200.15],'64': [432.92,200.15],
    '65': [432.92,221.65],'66': [418.92,221.65],'67': [418.92,235.65],'68': [397.42,235.65],
    '69': [397.42,243.15],'70': [375.92,243.15],'71': [375.92,257.15],'72': [368.92,257.15],
    '73': [368.92,264.15],'74': [347.42,264.15],'75': [347.42,278.65],'76': [336.42,278.65],
    '77': [336.42,328.15],'78': [347.42,328.15],'79': [347.42,342.65],'80': [368.92,342.65],
    '81': [368.92,353.65],'82': [418.92,353.65],'83': [418.92,342.65],'84': [432.92,342.65],
    '85': [432.92,356.65],'86': [447.42,356.65],'87': [447.42,321.15],'88': [447.42,292.65],
    '89': [432.92,292.65],'90': [432.92,314.15],'91': [418.92,314.15],'92': [418.92,321.15],
    '93': [397.42,321.15],'94': [397.42,333.65],'95': [375.92,333.65],'96': [375.92,321.15],
    '97': [361.92,321.15],'98': [361.92,299.65],'99': [375.92,299.65],'100':[375.92,285.65],
    '101':[397.42,285.65],'102':[397.42,271.65],'103':[418.92,271.65],'104':[418.92,264.15],
    '105':[439.92,264.15],'106':[439.92,250.15],'107':[454.42,250.15],'108':[454.42,243.15],
    '109':[461.42,243.15],'110':[461.42,214.65],'111':[461.42,193.15],'112':[447.42,193.15],
    '113':[447.42,179.15],'114':[439.92,179.15],'115':[439.92,167.65],'116':[419.92,167.65],
    '117':[419.92,150.65],'118':[439.92,150.65],'119':[454.42,150.65],'120':[475.92,150.65],
    '121':[475.92,171.65],'122':[496.92,171.65],'123':[496.92,193.15],'124':[496.92,214.65],
    '125':[496.92,243.15],'126':[496.92,271.65],'127':[496.92,292.65],'128':[496.92,317.15],
    '129':[496.92,335.65],'130':[470.42,335.65],'131':[470.42,356.65],'132':[496.92,356.65],
    '133':[347.42,150.65],'134':[539.92,356.65],'135':[560.92,356.65],'136':[589.42,356.65],
    '137':[589.42,342.65],'138':[603.92,342.65],'139':[610.92,342.65],'140':[610.92,335.65],
    '141':[610.92,321.15],'142':[624.92,321.15],'143':[624.92,278.65],'144':[610.92,278.65],
    '145':[610.92,257.15],'146':[589.42,257.15],'147':[589.42,250.15],'148':[575.42,250.15],
    '149':[560.92,250.15],'150':[542.92,250.15],'151':[542.92,264.15],'152':[560.92,264.15],
    '153':[575.42,264.15],'154':[575.42,271.65],'155':[582.42,271.65],'156':[582.42,285.65],
    '157':[596.42,285.65],'158':[560.92,335.65],'159':[596.42,314.15],'160':[582.42,314.15],
    '161':[582.42,321.15],'162':[575.42,321.15],'163':[575.42,335.65],'164':[525.42,335.65],
    '165':[525.42,314.15],'166':[525.42,299.65],'167':[525.42,281.65],'168':[525.42,233.15],
    '169':[525.42,214.65],'170':[525.42,193.15],'171':[525.42,171.65],'172':[546.92,171.65],
    '173':[546.92,150.65],'174':[568.42,150.65],'175':[475.92,160.65],'176':[603.92,150.65],
    '177':[624.92,150.65],'178':[624.92,136.15],'179':[596.42,136.15],'180':[575.42,136.15],
    '181':[553.92,136.15],'182':[532.42,136.15],'183':[575.42,356.65],'184':[489.92,136.15],
    '185':[468.42,136.15],'186':[447.42,136.15],'187':[425.92,136.15],'188':[404.42,136.15],
    '189':[370.42,136.15],'190':[361.92,150.65],'191':[340.42,136.15],'192':[326.42,136.15],
    '193':[301.92,136.15],'194':[276.42,136.15],'195':[254.92,136.15],'196':[315.92,136.15],
    '197':[212.42,136.15],'198':[190.92,136.15],'199':[338.92,150.65],'200':[155.42,136.15],
    '201':[624.92,299.65],'202':[318.92,321.65],'203':[155.42,314.15],'204':[311.92,356.65],
    '205':[355.42,136.15],'206':[318.92,314.15],'207':[362.92,164.65],'208':[254.92,356.65],
    '209':[383.42,333.65],'210':[447.42,335.65],'211':[470.42,345.65],'212':[525.42,250.15],
    '213':[546.92,335.65],'214':[525.42,261.15],'215':[525.42,356.65],'216':[336.42,298.65],
    '217':[336.42,313.15],'218':[293.42,136.15],'219':[336.42,306.15],'220':[425.92,264.15],
    '221':[391.42,353.65],'222':[482.92,335.65],'223':[429.92,167.65],'224':[330.92,150.65],
    '225':[368.42,150.65] 
  },
  optimal : ['1','200','198','197','195','194','218','193','196','192','191','205','189','27',
    '188','187','186','185','184','182','181','180','179','178','177','176','174','173','172',
    '171','170','169','168','212','214','167','166','165','164','213','158','163','162','161',
    '160','159','157','156','155','154','153','152','151','150','149','148','147','146','145',
    '144','143','201','142','141','140','139','138','137','136','183','135','134','215','132',
    '131','211','130','222','129','128','127','126','125','124','123','122','121','175','120',
    '119','118','117','116','223','115','114','113','112','111','110','109','108','107','106',
    '105','220','104','103','102','101','100','99','98','97','96','95','209','94','93','92','91',
    '90','89','88','87','210','86','85','84','83','82','221','81','80','79','78','77','217',
    '219','216','76','75','74','73','72','71','70','69','68','67','66','65','64','63','62','61',
    '60','59','58','57','56','55','54','53','52','50','51','49','207','2','47','225','190','133',
    '199','224','48','45','46','44','43','42','41','40','39','38','37','36','34','33','35','32',
    '31','206','202','30','29','28','204','26','25','208','24','23','22','21','20','203','19',
    '18','17','16','15','14','13','12','11','10','9','8','7','6','5','4','3'],
  optVal  : 3919
}; 



TSPutils.EU4 = {
  dist: TSPutils.geoDist,
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
