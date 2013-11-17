

function mkGUI (cId,containerId) {

  var $el = $('#'+containerId);
  var $el_ = $('#'+cId);


/*
<ul class="nav nav-tabs" 
    style="margin-bottom:3px">
  <li class="active">
      <a href="#solver" data-toggle="tab">solver</a></li>
  <li><a href="#tests" id="tests-link" data-toggle="tab">tests</a></li>
</ul>
*/

  function mkTabMenu (arr) {
    $ret = $('<ul>')
      .addClass('nav nav-tabs')
      .css('margin-bottom:', '3px');
    _.each(arr, function (tabId,i) {
      var $li = $('<li>')
        .append(
          $('<a>')
            .attr('href','#'+tabId)
            .attr('data-toggle','tab')
            .html(tabId) );
      if (i===0) {$li.addClass('active');}
      $ret.append($li);
    });
    return $ret;
  }

  $tabMenu = mkTabMenu(['solver','tests']);

  

  function mkButt (text, ico) {
    var $butt = $('<button>')
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

  $el_.append($tabMenu);

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



