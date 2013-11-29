function mkGraph ($graphEl, $buttsEl, opts) {  

  function extDefaultSeries (seriesOpts) {
    return _.extend({
      lines:  { show: true },
      points: { show: true },
      color: 'black',
      data: [],
      init: function () {
        this.data = [];
      }
    }, seriesOpts);
  }

  var graphKeys = [];
  var actualGraphName;
  var isDrawStats = true;

  function mkSeries (graphsOpts) {
    var ret = {};
    var prvni = true;
    $buttsEl.html('');

    for (var graphName in graphsOpts) {

      var graph = graphsOpts[graphName];
      
      var aGraphKeys = (function () {
        var theGraphKeys = [];
        var theGraphName = graphName; 

        if (prvni) {
          graphKeys       = theGraphKeys;
          actualGraphName = theGraphName;
          prvni = false;
        }

        $buttsEl.append( 
          mkEasyButt({
            text: graphName,
            isSmall: true,
            click: function () {
              graphKeys       = theGraphKeys;
              actualGraphName = theGraphName;
              draw();
            }
          }));

        return theGraphKeys;
      })();

      for (var name in graph.vars) {
        var opt = graph.vars[name];
        var color = opt.color;

        if (opt.avg || opt.minmax) {
          aGraphKeys.push(name+'_avg');
          ret[name+'_avg'] = extDefaultSeries({
            id:     name+'_avg',
            color:  color,
            points: { show: false }, 
            initOn: {experimentBegin : true},
            updateOn:  name,
            init: function () {
              this.data = [];
              this.sums = [];
              this.ns   = [];
              for(var i = 0; i < numGens; i++){
                this.sums.push(0);
                this.ns  .push(0);
              }
            },
            update: function(x,y) {
              this.sums[x] += y;
              this.ns  [x] ++;
              this.data[x] = [x, this.sums[x] / this.ns[x] ];
            }
          });
          if (!opt.avg) {
            ret[name+'_avg'].lines.lineWidth = 0;
          }
        }

        if (opt.minmax) {
          
          ret[name+'_avg'].lines.fill  = true ;
          ret[name+'_avg'].fillBetween = name+'_min'; 
          
          aGraphKeys.push(name+'_max');
          ret[name+'_max'] = extDefaultSeries({
            color:       color,
            points:      { show: false },
            lines:       { lineWidth: 0, fill: true},
            fillBetween: name+'_avg',
            initOn: {experimentBegin : true},
            updateOn: name,
            update: function (x,y) {
              var xyMax = this.data[x];
              if (xyMax === undefined || xyMax[1] < y) {
                this.data[x] = [x,y];
              } 
            }
          });

          aGraphKeys.push(name+'_min');
          ret[name+'_min'] = extDefaultSeries({
            id:      name+'_min',
            color:   color,
            points:  { show: false },
            lines:   { show: false },
            initOn: {experimentBegin : true},
            updateOn: name,
            update: function (x,y) {
              var xyMin = this.data[x];
              if (xyMin === undefined || xyMin[1] > y) {
                this.data[x] = [x,y];
              } 
            }
          });
        }

        aGraphKeys.push(name);
        ret[name] = extDefaultSeries({
          label: name,
          color: color,
          lines: {show: false},
          initOn:   {runBegin : true},
          updateOn: name,
          update: function (x,y) {
            this.data[x] =[x,y];
          }
        });

      }
    }

    $drawStatsButt = $('<input>').attr({
      'type':'checkbox',
      'checked':isDrawStats
    }).click(function(){
      isDrawStats = !isDrawStats;
      log(isDrawStats);
    });

    $buttsEl.append([
      $('<span>').append([
        '&nbsp; draw stats? ',
        $drawStatsButt
      ]).css({
          'font-size':'8pt',
          'position' :'absolute',
          'bottom':'1px',
          'right':'1px'
      }) 
       ]);

    return ret;
  }

  function getObservedVariables (graphsOpts) {
    var ret = [];
    for (var prop in graphsOpts) {
      ret = ret.concat(_.keys(graphsOpts[prop].vars));
    }
    return ret;
  }


  var series, observedVariables, numGens, drawStep, plotOpts;

  function experimentBegin (gpOpts) {

    var graphsOpts = gpOpts.statsOpts.graphs;
    drawStep       = gpOpts.statsOpts.drawStep;
    
    series            = mkSeries(graphsOpts);
    observedVariables = getObservedVariables(graphsOpts);
    numGens           = gpOpts.numGens;

    plotOpts = {};
    for (var graphName in graphsOpts) {

      var plotOptions = {
        xaxis: {
          min: 0,
          max: numGens-1,
          axisLabel: 'Generation',
          axisLabelFontSizePixels: 11,
        },
        yaxis: {
          min: 0,
          axisLabel: 'Fitness',
          axisLabelFontSizePixels: 11
        },
        legend: {
          show: true,
          position: 'nw'
        }
      };

      var yMax = graphsOpts[graphName].yMax;
      if (yMax) {
        plotOptions.yaxis.max = yMax;
      }

      plotOpts[graphName] = plotOptions;
    }

    for (var id in series) {
      var s = series[id];
      if (s.initOn.experimentBegin) {
        s.init();
      }
    }

  }

  function runBegin (run) {
    for (var id in series) {
      var s = series[id];
      if (s.initOn.runBegin) {
        s.init();
      }
    }    
  }

  function update(obsrvedVar, x, y) {
    for (var id in series) {
      var s = series[id];
      if (s.updateOn === obsrvedVar) {
        s.update(x,y);
      }
    }
  }

  function handleStats (stats) {
    var gen = stats.gen;

    _.each(observedVariables, function(observedVar){
      update(observedVar, gen, stats[observedVar]);
    });

    if (stats.terminate) {
      for (var i = gen+1; i < numGens; i++) {
        update('best', i, stats.best);
      }
    }

    draw();
  }

  
  var numDrawSteps = 0;

  var drawNow = false;

  function draw () {
    numDrawSteps ++;
    if (!isDrawStats || (numDrawSteps % drawStep !== 0) ) {return;}
    
    drawNow = true;
    //draw2();
  }

  var timeoutTime = 100;

  function draw2 () {
    if ( !(drawNow && isDrawStats) ) {
      setTimeout(draw2,timeoutTime);
      return;
    }

    var plotOptions = 
      plotOpts ? plotOpts[actualGraphName] : {};

    $.plot($graphEl, 
           _.values(_.pick(series, graphKeys)), 
           plotOptions); 

    setTimeout(draw2,timeoutTime);  
  }
  
  draw();

  draw2();

  return {
    draw: draw,
    handleStats: handleStats,
    experimentBegin: experimentBegin,
    runBegin: runBegin
  };
}