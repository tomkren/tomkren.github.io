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
    .attr('id','editor-pre')
    .css('width', '100%');


  var sTabs = mkTabs(['editor','log','stats']);

  var $clearButt = mkAButt('clear','remove',false,false,true);
  sTabs.log.append($log,$clearButt);


  sTabs.editor.append($editor);


  var $graphContainer = 
   $('<div>').css({ width:  '100%',
                    height: '400px'});
  sTabs.stats.append($graphContainer);
  


  var $startButt     = mkAButt('start', 'play'  );
  sTabs.log   .$butt = mkAButt('log', 'book', '#log', true);   
  sTabs.editor.$butt = mkAButt('edit', 'pencil', '#editor', true);
  sTabs.stats .$butt = mkAButt('stats','stats','#stats', true, false,
    function () {
      setTimeout(graphs.draw, 10);
    });

  
  tabs.solver.append( 
    $('<div>').css('margin', '3px').append([
      $startButt, 
      sTabs.editor.$butt,
      sTabs.log.$butt,
      sTabs.stats.$butt
    ]), 
    sTabs.$el );

  var graphs = mkGraph($graphContainer, {});


  var editor = ace.edit('editor-pre');
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

  function guiStats (stats) {
    graphs.handleStats(stats);
  }

  function runInit () {
    graphs.runInit();
  }

  //TODO : nefacha když je rezizlej hidden editor
  function resize () {
    var newHeight = window.innerHeight-106;
    $log   .css('height', (newHeight-30)+'px');
    $editor.css('height', (newHeight+0)+'px');
    $graphContainer.css('height',(newHeight+0)+'px');
    editor.resize();
    graphs.draw();
  }

  resize();
  $(window).resize(resize);
  
  var isRunning = false;
  var worker, startTime;

  function stopped () {
    isRunning = false;
    setButtText($startButt, 'start', 'play');
    var time = (new Date().getTime()) - startTime;
    guiLog('\nruntime: '+ Math.round(time/1000) +' s' );
  }

  $startButt.click(function (e) {

    if (isRunning) {
      worker.terminate();
      guiLog('\nstopped ...');
      stopped();
      return;
    }

    isRunning = true;
    startTime = new Date().getTime();
    if ($log.html() !== '') {
      guiLog('\n'+repeat('-',80)+'\n');
    }

    var optsStr = ses.getValue();
    var opts; eval(optsStr);

    graphs.experimentBegin(opts);

    if (opts.logOpts.startTab) {
      sTabs[opts.logOpts.startTab].$butt.tab('show');
      resize();
    }

    guiLog('starting ...');
    worker = startGPworker(optsStr, function(msg){
      var content = msg.content;
      switch (msg.subject) {
        case 'log'     : guiLog(content);             break;
        case 'stats'   : guiStats(content);           break;
        case 'result'  : stopped();                   break;
        case 'runBegin': graphs.runBegin(content); break;
        default        : log(content);                break;
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
    tabs: tabs,
    graphs: graphs
  };

}

