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
 'ants.js',
 'eva.js'
);
  
function send (subject, content) {
  self.postMessage(JSON.stringify({
    subject: subject,
    content: content
  }));
} 

self.addEventListener('message', function(e) {
  
  var msg = JSON.parse(e.data); 

  var opts;
  eval('opts = '+ msg.optsStr );

  var gpResult = gp(opts, function (logStr) {
    send('log', logStr); 
  });

  send('result', gpResult);

  self.close();


},false);