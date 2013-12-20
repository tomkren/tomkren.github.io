var $ = function (x){}

importScripts(
 'libs/underscore-1.5.1.js',
 'libs/peg-0.7.0.js',
 'libs/wu-0.1.8.js', 
 'utils.js',
 'term.js',
 'parser.js',
 'zipper.js',
 'show.js',
 'priority-queue.js',
 'prove.js',
 'strategy.js',
 'xover.js',
 //'ants.js',
 'solver.js',
 'solvers/GP.js',
 'solvers/Ants.js',
 'problem-opts.js'
);

var log = function (logStr) {
  send('log', logStr); 
};



function send (subject, content) {
  self.postMessage(JSON.stringify({
    subject: subject,
    content: content
  }));
} 

self.addEventListener('message', function(e) {
  
  var msg = JSON.parse(e.data); 

  //var opts; eval( msg.optsStr );
  var opts = evalOptsStr( msg.optsStr );

  var communicator = {
    log: log, 
    sendStats: function (stats) {
      send('stats', stats);
    },
    runBegin: function (run){
      send('runBegin', run);
    }
  };
  //var gpResult = gp(opts, communicator);
  var gpResult = Solver.run(opts, communicator);

  send('result', gpResult);
  self.close();

},false);

