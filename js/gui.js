

function mkGUI (containerId) {

  var $el = $('#'+containerId);

  var $startButt = 
    $('<input>').attr('value','start')
                .attr('type','button');

  var $log = 
    $('<div style="width: 200px; height: 100px; overflow-y: scroll;">');

  $el.append($startButt).append($log);


  $el.click(function (e) {
    runGP(SSR_str, function(msg){
      log( res1 = msg );
    });
  });


  function guiLog (msg) {
    $log.append(msg).append('<br>');

    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
  }


  return {
    log : guiLog
  };


}



