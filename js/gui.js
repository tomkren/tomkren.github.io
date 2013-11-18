function mkGUI (containerId) {

  var $el = $('#'+containerId);

  function mkTabMenu (arr) {
    var $ret = $('<ul>')
      .addClass('nav nav-tabs')
      .css('margin-bottom', '3px');
    _.each(arr, function (tabId,i) {
      var $li = $('<li>').append(
        $('<a>').attr({
          'href': '#'+tabId,
          'data-toggle': 'tab'
        }).html(tabId) 
      );
      if (i===0) {$li.addClass('active');}
      $ret.append($li);
    });
    return $ret;
  }

  function mkTabs (arr) {
    var $el = $('<div>').addClass('tab-content');
    var ret = {'$el': $el};
    _.each(arr, function (tabId,i) {
      var $tab = $('<div>').addClass('tab-pane').attr('id',tabId);
      if (i===0) {$tab.addClass('active');}
      $el.append($tab);
      ret[tabId] = $tab;
    });
    return ret;
  }

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

  var tabIds = ['solver','tests'];

  var $tabMenu = mkTabMenu(tabIds);
  var tabs     = mkTabs   (tabIds);

  tabs.tests.append(  
    $('<div>').attr('id','qunit'), 
    $('<div>').attr('id','qunit-fixture') );

  $el.append($tabMenu, tabs.$el);

  var $startButt = mkButt('start', 'play');
  var $editButt  = mkButt('edit',  'pencil'); 
  var $doneButt  = mkButt('done',  'ok');
  var $clearButt = mkButt('clear', 'remove');

  var $solverContent = $('<div>');
  
  var $log = 
    $('<pre>').css({
      'height'    : '400px',
      'overflow-y': 'scroll'
    });

  var $editor = $('<pre>').attr('id','editor').css('width', '100%').hide();

  $solverContent.append($log);

  tabs.solver.append( $('<div>').css('margin', '3px').append(
    $startButt, $clearButt, $editButt), $solverContent,  $editor );

  var editor = ace.edit('editor');
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript"); 
  editor.getSession().setTabSize(2); 
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setUseWrapMode(true);
  editor.getSession().setValue(SSR_str);


  function guiLog (msg) {
    $log.append(msg).append('\n');
    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
  }

  function autosetLogHeight () {
    var newHeight = window.innerHeight-106;
    $log   .css('height', newHeight+'px');
    $editor.css('height', (newHeight+0)+'px');
    editor.resize();
  }

  autosetLogHeight();
  $(window).resize(autosetLogHeight);

  $startButt.click(function (e) {
    if ($log.html() !== '') {
      guiLog('\n'+repeat('-',80)+'\n');
    }
    guiLog('starting ...');
    runGP(editor.getSession().getValue(), function(msg){
      var content = msg.content;
      switch (msg.subject) {
        case 'log'    : guiLog(content); break;
        case 'result' : log(res1 = content); break;
        default       : log(content); break;

      }
    });
  });

  $editButt.click(function (e) {
    $editor.show();
    $solverContent.html($editor);
    $editButt.after($doneButt);
    $editButt.detach();
    $clearButt.detach();
  });

  $doneButt.click(function (e) {
    $solverContent.html($log);
    $doneButt.after($editButt);
    $doneButt.detach();
    $startButt.after($clearButt);
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

  return {
    log: guiLog,
    tabs: tabs
  };

}

