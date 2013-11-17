

function mkGUI (containerId) {

  var $el = $('#'+containerId);

/*  var $startButt = 
    $('<input>')
      .attr('value','start')
      .attr('type','button');
*/

  function mkButt (text, ico) {
    var $butt =      
      $('<button>')
        .attr('type', 'button')
        .addClass('btn btn-default btn-lg')
        .css('margin-right','3px');
    if (ico) {
      $butt.append($('<span>').addClass('glyphicon glyphicon-'+ico));
    }
    $butt.append(' '+text);
    return $butt;
  }

  var $startButt = mkButt('start', 'play');
  var $clearButt = mkButt('clear', 'remove'); 

  var $log = 
    $('<pre>')
      .css('height', '400px')
      .css('overflow-y', 'scroll')
      .css('margin-top', '3px');

  function autosetLogHeight () {
    $log.css('height', window.innerHeight-106+'px');
  }

  autosetLogHeight();

  $(window).resize(autosetLogHeight);


  $el.append($startButt)
     .append($clearButt)
     .append($log);


  $startButt.click(function (e) {
    if ($log.html() !== '') {
      guiLog('\n'+repeat('-',80)+'\n');
    }
    guiLog('starting ...');
    runGP(SSR_str, function(msg){
      var content = msg.content;
      switch (msg.subject) {
        case 'log'    : guiLog(content); break;
        case 'result' : log(res1 = content); break;
        default       : log(content); break;

      }
    });
  });

  $clearButt.click(function (e) {
    $log.html('');
  });

  QUnit.done(function( details ) {
    console.log( "[TESTS] ",
      "Runtime:", details.runtime,
      "Total:",   details.total, 
      "Failed:",  details.failed, 
      "Passed:",  details.passed );

    if (details.failed > 0) {
      $('#tests-link').tab('show');
    }
  });



  function guiLog (msg) {
    $log.append(msg).append('\n');

    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
  }


  return {
    log : guiLog
  };


}



