function mkGraph ($el, opts) {

  var plotOpts;

  function extDefaultSeries (seriesOpts) {
    return _.extend({
      lines:  { show: true },
      points: { show: true },
      color: 'black'}, seriesOpts);
  }


  var basicSeriesOpts = {
    best  : { color: 'green' }, 
    avg   : { color: 'blue'  }, 
    worst : { color: 'red'   }
  };

  function mkSeries (basicSeriesOpts) {
    var ret = {};
    for (var name in basicSeriesOpts) {
      var opt = basicSeriesOpts[name];
      ret[name] = extDefaultSeries({
        label: name,
        color: opt.color,
        lines: {show: false},
      });
      ret[name+'_avg'] = extDefaultSeries({
        id:     name+'_avg',
        color:  opt.color,
        points: { show: false },
        lines:  { fill: true },
        fillBetween: name+'_min'  
      });
      ret[name+'_max'] = extDefaultSeries({
        color:       opt.color,
        points:      { show: false },
        lines:       { lineWidth: 0, fill: true},
        fillBetween: name+'_avg'
      });
      ret[name+'_min'] = extDefaultSeries({
        id:      name+'_min',
        color:   opt.color,
        points:  { show: false },
        lines:   { show: false }
      });
    }
    return ret;
  }

  var series, sums, ns;


  var seriesToDraw = [];
  var numGens;

  function getSeriesToDraw (gpOpts) {
    return _.map(_.filter(_.pairs(gpOpts.statsOpts.graph), 
      function(p){return p[1]}), function(p){return p[0]});
  }

  function experimentBegin (gpOpts) {

    series = mkSeries(gpOpts.statsOpts.graph);
    sums   = {};
    ns     = {};

    numGens = gpOpts.numGens;
    seriesToDraw = getSeriesToDraw(gpOpts);

    plotOpts = {
      xaxis: {
        min: 0,
        max: numGens-1,
        axisLabel: 'Generation',
        axisLabelFontSizePixels: 11,
        //axisLabelUseCanvas: !true,
        //axisLabelFontFamily: 'Arial'
      },
      yaxis: {
        min: 0,
        axisLabel: 'Fitness',
        axisLabelFontSizePixels: 11
      },
      legend: {
        show: true,
        position: 'nw'
      },
    };

    if (gpOpts.statsOpts.maxFitVal) {
      plotOpts.yaxis.max = gpOpts.statsOpts.maxFitVal;
    }

    _.each(seriesToDraw, function (id) {
      sums[id] = [];
      ns  [id] = [];

      series[id+'_avg'].data = [];
      series[id+'_max'].data = [];
      series[id+'_min'].data = [];

      for(var i = 0; i < numGens; i++){
        sums[id].push(0);
        ns  [id].push(0);
      }
    });

  }

  function runBegin (run) {
    //log('run '+run+' begins');
    
    _.each(seriesToDraw, function (id) {
      series[id].data = [];
    });


  }


  function handleStats (stats) {

    _.each(seriesToDraw, function(id){
      var x = stats.gen;
      var y = stats[id+'Val'];
      series[id].data.push([x, y]);



      function setOtherVals (x) {
  
        var maxData = series[id+'_max'].data;
        var xyMax = maxData[x];
        if (xyMax === undefined || xyMax[1] < y) {
          maxData[x] = [x,y];
        } 

        var minData = series[id+'_min'].data;
        var xyMin = minData[x];
        if (xyMin === undefined || xyMin[1] > y) {
          minData[x] = [x,y];
        } 

        sums[id][x] += y;
        ns  [id][x] ++;
        var avgVal  = sums[id][x] / ns[id][x];
        var avgData = series[id+'_avg'].data;
        if (avgData[x] !== undefined) {
          avgData[x] = [x, avgVal];
        } else {
          avgData.push([x, avgVal]); // TODO : nadbytečný, stačí
                                     // to if pro obě možnosti
        }
      }

      setOtherVals(x);

      if (stats.terminate && id === 'best') {
        //log('terminate');
        for (var x_ = x+1; x_ < numGens; x_++) {
          setOtherVals(x_);
          //maxData[x_] = [x_,y];
        }
      }
    });

    draw();
  }

  function seriesBySufix (sufix) {
    return _.map(seriesToDraw, function(id){
      return series[id+sufix]
    });
  }

  var drawStep = 1;
  var numDrawSteps = 0;

  function draw () {
    numDrawSteps ++;
    if (numDrawSteps % drawStep === 1) {return;}

    
    var runData = seriesBySufix('');
    var avgData = seriesBySufix('_avg');
    var maxData = seriesBySufix('_max');
    var minData = seriesBySufix('_min');
    var allData = _.flatten(
      [minData, maxData, avgData, runData], true);
    $.plot($el, allData, plotOpts);  
    
  }
  
  draw();

  return {
    $el: $el,
    draw: draw,
    handleStats: handleStats,
    experimentBegin: experimentBegin,
    runBegin: runBegin
  };
}