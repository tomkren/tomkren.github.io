function mkGUI (containerId) {

  function mkTabMenu (arr) {
    var $ret = $('<ul>')
      .addClass('nav nav-tabs')
      .css('margin-bottom', '3px');
    _.each(arr, function (tabId,i) {
      var $li = $('<li>').append(
        $('<a>').attr({
          'href': '#'+tabId,
          'data-toggle': 'tab',
          'id': tabId+'-link'
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

/*
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
*/
  
  function setButtText ($butt, text, ico) {
    $butt.html('');
    if (ico) {
      $butt.append($('<span>')
           .addClass('glyphicon glyphicon-'+ico));
    }
    $butt.append(' '+text);
  }

  function mkAButt (text, ico, href, isTab, isSmall,clickFun) {
    var $butt = $('<a>')
      .addClass('btn btn-default btn-'+(isSmall?'xs':'lg'))
      .css('margin-right','3px');
    if (href)  {$butt.attr('href',href);}
    if (isTab) {$butt.attr('data-toggle','tab');}
    setButtText($butt, text, ico);
    if (clickFun) {
      $butt.click(clickFun);
    }
    return $butt;
  }

  var tabIds = ['solver','tests'];

  var $tabMenu = mkTabMenu(tabIds);
  var tabs     = mkTabs   (tabIds);

  tabs.tests.append(  
    $('<div>').attr('id','qunit'), 
    $('<div>').attr('id','qunit-fixture') );

  var $el = $('#'+containerId);
  $el.append($tabMenu, tabs.$el);

 
  var $log = $('<pre>').css({
    'height'    : '400px',
    'overflow-y': 'scroll',
    'font-size' : '8pt',
    'margin-top': '3px'
  });

  var $editor = $('<pre>')
    .attr('id','editor')
    .css('width', '100%');


  var subTabs = mkTabs(['editor_','log_','stats_']);

  var $clearButt = mkAButt('clear','remove',false,false,true);
  subTabs.log_.append($log,$clearButt);


  subTabs.editor_.append($editor);

  var $startButt = mkAButt('start', 'play'  );
  var $logButt   = mkAButt('log', 'book', '#log_', true);   
  var $editButt  = mkAButt('edit', 'pencil', '#editor_', true);

  
  tabs.solver.append( 
    $('<div>').css('margin', '3px').append(
      $startButt, 
      $editButt,
      $logButt,
      mkAButt('stats','stats','#stats_', true)
    ), 
    subTabs.$el );

  var editor = ace.edit('editor');
  var ses = editor.getSession();
  editor.setTheme("ace/theme/monokai");
  ses.setMode("ace/mode/javascript"); 
  ses.setTabSize(2); 
  ses.setUseSoftTabs(true);
  ses.setUseWrapMode(true);
  
  $.ajax({
    url : 'js/problems/SSR.js',
    dataType: "text",
    success : function (data) {
      ses.setValue(data);
    }
  });

  function guiLog (msg) {
    $log.append(msg).append('\n');
    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
  }

  //TODO : nefacha když je rezizlej hidden editor
  function resize () {
    var newHeight = window.innerHeight-106;
    $log   .css('height', (newHeight-30)+'px');
    $editor.css('height', (newHeight+0)+'px');
    editor.resize();
  }

  resize();
  $(window).resize(resize);
  
  var isRunning = false;
  var worker;

  $startButt.click(function (e) {

    if (isRunning) {
      isRunning = false;
      worker.terminate();
      setButtText($startButt, 'start', 'play');
      return;
    }

    isRunning = true;
    if ($log.html() !== '') {
      guiLog('\n'+repeat('-',80)+'\n');
    }
    $logButt.tab('show');
    guiLog('starting ...\n');
    worker = startGPworker(ses.getValue(), function(msg){
      var content = msg.content;
      switch (msg.subject) {
        case 'log'    : guiLog(content); break;
        case 'result' : 
          log(res1 = content); 
          isRunning = false;
          setButtText($startButt, 'start', 'play');
          break;
        default : log(content); break;

      }
    });
    setButtText($startButt, 'stop', 'stop');
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

