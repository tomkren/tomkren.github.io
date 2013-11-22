function mkGraph ($el, opts) {

  var plotOpts;

  function extDefaultSeries (seriesOpts) {
    return _.extend({
      lines:  { show: true },
      points: { show: true },
      color: 'black'}, seriesOpts);
  }

  var series = {
    best: extDefaultSeries({
      label: 'best',
      color: 'black',
      lines:  { show: false },
    }),
    avg: extDefaultSeries({
      label: 'avg',
      color: 'gray',
      lines:  { show: false },
    }),
    worst: extDefaultSeries({
      label : 'worst',
      color : '#DBDBDB',
      lines:  { show: false },
    }),
    best_avg: extDefaultSeries({
      color: 'black',
      points:  { show: false },
    }),
    avg_avg: extDefaultSeries({
      color: 'gray',
      points:  { show: false },
    }),
    worst_avg: extDefaultSeries({
      color : '#DBDBDB',
      points:  { show: false },
    }),
  };

  var sums = {
    best:  [],
    avg:   [],
    worst: []
  };

  var ns = {
    best:  0,
    avg:   0,
    worst: 0
  };



  var seriesToDraw = [];
  var numGens;

  function getSeriesToDraw (gpOpts) {
    return _.map(_.filter(_.pairs(gpOpts.statsOpts.show), 
      function(p){return p[1]}), function(p){return p[0]});
  }

  function experimentBegin (gpOpts) {
    numGens = gpOpts.numGens;
    seriesToDraw = getSeriesToDraw(gpOpts);

    plotOpts = {
      xaxis: {
        min: 0,
        max: numGens -1,
      },
      yaxis: {
        min: 0
      },
      legend: {
        show: true,
        position: 'nw'
      },
    };

    if (gpOpts.statsOpts.maxFitVal) {
      plotOpts.yaxis.max = gpOpts.statsOpts.maxFitVal;
    }

    //plotOpts.xaxis.max = numGens - 1;

    _.each(seriesToDraw, function (id) {
      sums[id] = [];
      ns  [id] = [];

      series[id+'_avg'].data = [];
      for(var i = 0; i < numGens; i++){
        sums[id].push(0);
        ns  [id].push(0);
      }
    });

  }

  function runBegin (run) {
    log('run '+run+' begins');
    
    _.each(seriesToDraw, function (id) {
      series[id].data = [];
    });
  }


  function handleStats (stats) {

    _.each(seriesToDraw, function(id){
      var x = stats.gen;
      var y = stats[id+'Val'];
      series[id].data.push([x, y]);

      function setAvgVal (x) {
        sums[id][x] += y;
        ns  [id][x] ++;
        var avgVal  = sums[id][x] / ns[id][x];
        var avgData = series[id+'_avg'].data;
        if (avgData[x] !== undefined) {
          avgData[x] = [x, avgVal];
        } else {
          avgData.push([x, avgVal]);
        }
      }

      setAvgVal(x);

      if (stats.terminate && id === 'best') {
        log('terminate');
        for (var x_ = x+1; x_ < numGens; x_++) {
          setAvgVal(x_);
        }
      }
    });

    draw();
  }

  function draw () {
    var runData = _.map(seriesToDraw, function(id){return series[id]});
    var avgData = _.map(seriesToDraw, function(id){return series[id+'_avg']});
    $.plot($el, avgData.concat(runData), plotOpts);  
    
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