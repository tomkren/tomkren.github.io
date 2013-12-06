var LogOpts = {
  'default' : {
    bestIndiv: false,
    bestVal:   true,
    avgVal:    true,
    worstVal:  false,
    valPrecision: 4,
    startTab: 'results'
  } 
};

var StatsOpts = {
  'default' : {
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
  }
};