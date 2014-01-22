function ajaxes (opts) {
  opts = _.extend({
    urls : [],
    dataType : 'text',
    success : function(){},
    finish  : function(){}
  }, opts);

  var i = 0;

  function step (urls) {
    if (urls.length === 0) {
      opts.finish();
    } else {
      var url = _.head(urls);
      $.ajax({
        url: url,
        dataType: opts.dataType,
        success: function (data) {
          opts.success(data, i);
          i++;
          step(_.tail(urls));
        }
      });        
    }  
  }
  
  step(opts.urls);
}

function setButtText ($butt, text, ico) {
  $butt.html('');
  if (ico) {
    $butt.append($('<span>')
         .addClass('glyphicon glyphicon-'+ico));
  }
  $butt.append(' '+text);
}

function mkAButt (text, ico, href, isTab, isSmall,clickFun, btnClass) {
  var btnClass = btnClass || 'btn-default';  
  var $butt = $('<a>')
    .addClass('btn '+btnClass+' btn-'+(isSmall?'xs':'lg'))
    .css('margin-right','3px');
  if (href)  {$butt.attr('href',href);}
  if (isTab) {$butt.attr('data-toggle','tab');}
  setButtText($butt, text, ico);
  if (clickFun) {
    $butt.click(clickFun);
  }
  return $butt;
}

function mkEasyButt (opts) {
  opts = opts || {};
  return mkAButt(opts.text, opts.ico, opts.href, opts.isTab,
                 opts.isSmall, opts.click, opts.btnClass );
}

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
    var ret = {'$el': $el, tabs:{} };
    _.each(arr, function (tabId,i) {
      var $tab = $('<div>').addClass('tab-pane').attr('id',tabId);
      if (i===0) {$tab.addClass('active');}
      $el.append($tab);
      ret.tabs[tabId] = $tab;
    });
    return ret;
  }

  function openSTab (name) {
    var $butt = sTabs.tabs[name].$butt; 
    $butt.tab('show');
    resize();
    switchMarkSTab($butt);
  }

  var tabIds = ['fishtron','tests'];

  var $tabMenu = mkTabMenu(tabIds);
  var tabs     = mkTabs   (tabIds);

  tabs.tabs.tests.append(  
    $('<div>').attr('id','qunit'), 
    $('<div>').attr('id','qunit-fixture') );

  var $el = $('#'+containerId);
  $el.append($tabMenu, tabs.$el);

  $('#fishtron-link').css({
    //'font-weight': 'bold',
    //'font-family': '"Arial Black", Gadget, sans-serif'
    'font-size' : '15px',
    'font-family' : "'Prosto One', cursive"
  }).html('fishtron.net');

 
  var $log = $('<pre>').css({
    'height'    : '400px',
    'overflow-y': 'scroll',
    'font-size' : '8pt',
    'margin-top': '3px'
  });

  var $editor = $('<pre>').attr({
    id: 'editor-pre'
  }).css({
    width: '100%',
    'margin-top': '3px'
  });

  var $editorButts = $('<div>');



  //$editorButts.append( ... ); // zde bylo open buton, nechávám to tu na pozdejc až
                                // zas budou naky editor butony

  var ryba = Ryba.mk({
    bottom: '23px',
    right:  '32px'
  });

  var $elRyba = ryba.$el;


  var $editorContainer = $('<div>').append([$editorButts, $elRyba, $editor]);

  var sTabsNames = ['editor','mxr','results','stats','log'];
  var sTabs = mkTabs(sTabsNames);

  var $clearButt = mkAButt('clear','remove',false,false,true);
  var $downButt = mkAButt('down','arrow-down',false,false,true);

  
  sTabs.tabs.log.append($log, $downButt, $clearButt);
  
  sTabs.tabs.editor.append($editorContainer);

  var $results = $('<div>');
  sTabs.tabs.results.append($results);

  var $startButt = mkEasyButt({
    text: 'start', 
    ico:  'play',
    btnClass: 'btn-success' 
  });

  var $openButt = $(
    '<div class="btn-group" style="margin-right: 3px;">'+
      '<button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown">'+
      '<span class="glyphicon glyphicon-folder-open"></span> '+
      '&nbsp;open <span class="caret"></span></button>'+
      '<ul class="dropdown-menu" role="menu"></ul>'+
    '</div>'
  );

  var $openUL = $openButt.children('ul'); 

  sTabs.tabs.mxr.$butt = mkAButt('mixer', 'wrench', '#mxr', true);   
  sTabs.tabs.log.$butt = mkAButt('log', 'book', '#log', true);   
  sTabs.tabs.editor.$butt = mkAButt('code', 'pencil', '#editor',
    true, false, function(){setTimeout(resize,10);});
  sTabs.tabs.stats.$butt = mkAButt('stats','stats','#stats', true, 
    false, function(){setTimeout(graphs.draw, 10);});
  sTabs.tabs.results.$butt = mkAButt('results','eye-open','#results', true);

  var $activeSTab = null;

  function markSTab ($butt) {
    $butt.addClass('active');
    $activeSTab = $butt;
  }

  function switchMarkSTab ($butt) {
    $activeSTab.removeClass('active');
    markSTab($butt);
  } 

  var sTabsButts = _.map(_.keys(sTabs.tabs),function(key){
    var $butt = sTabs.tabs[key].$butt;
    $butt.click(function () {
      switchMarkSTab($butt);
    });
    return $butt;
  });

  markSTab(sTabs.tabs[sTabsNames[0]].$butt);


  var $graphContainer = $('<div>').css({ 
    width:  '100%',
    height: '400px',
    'margin-top' : '3px'
  });
  var $graphButts = $('<div>');
  sTabs.tabs.stats.append([
    $graphContainer,
    $graphButts
  ]);

  var mxr = MXR.mk({
    $appendToElem: sTabs.tabs.mxr
  });

  // main solver buttons 
  tabs.tabs.fishtron.append( 
    $('<div>').css('margin-bottom', '3px')
     .append([$startButt, $openButt].concat(sTabsButts)), 
    sTabs.$el );

  var graphs = mkGraph($graphContainer, $graphButts, {});


  var editor = ace.edit('editor-pre');
  var ses = editor.getSession();
  editor.setTheme("ace/theme/monokai");
  ses.setMode("ace/mode/javascript"); 
  ses.setTabSize(2); 
  ses.setUseSoftTabs(true);
  ses.setUseWrapMode(true);
  
  
  var actOpenInfo = {
    $el: null,
    oldText: null
  };

  function markOpenLink ($link) {
    actOpenInfo.$el = $link;
    $link.css('font-weight','bold');
    actOpenInfo.oldText = $link.html();
    $link.html( actOpenInfo.oldText  + 
      ' &nbsp; <span class="glyphicon glyphicon-eye-open"></span>' );
  }

  function switchOpenLink ($link) {
    actOpenInfo.$el.css('font-weight', '');
    actOpenInfo.$el.html(actOpenInfo.oldText);
    markOpenLink($link);
  }


  var problemFiles = []; // TODO požívá se zatim jen prvek [0], asi předělat

  ajaxes({
    dataType: 'text',
    urls: _.map(ProblemRegister, function(x){
      return 'js/problems/'+x;
    }),
    success: function (data, i) {

      var opts = evalOptsStr(data);

      App.Opts[opts.name] = opts;

      problemFiles.push({
        str:  data,
        opts: opts
      });

      var $link = $('<a>')
        .attr('href', '#')
        .html(opts.name);

      $openUL.append( 
        $('<li>').html($link)
          .click(function(){
            ses.setValue(data);
            mxr.set(opts);
            openSTab('editor');
            switchOpenLink($link);
          })
      );
    },
    finish: function () {
      ses.setValue(problemFiles[0].str); 
      mxr.set(problemFiles[0].opts);
      markOpenLink( $($openUL.find('a')[0]) );
    }
  });
  

  function guiLog (msg) {
    $log.append(msg).append('\n');
    $log[0].scrollTop = $log[0].scrollHeight - $log[0].clientHeight;
  }

  function resize () {
    var newHeight = window.innerHeight-106;
    $log   .css('height', (newHeight-30)+'px');
    $editor.css('height', (newHeight-2)+'px');
    $graphContainer.css('height',(newHeight-20)+'px');
    var $bars = Phenotype.get$bars();
    if ($bars) {
      //var ph = 
      $bars.css('height',(newHeight-(90+Phenotype.getPhenoHeight()))+'px');
    }
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

    $startButt.toggleClass('btn-success btn-danger');

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
    var opts = evalOptsStr(optsStr);

    var pheno = opts.phenotype;

    var $phenoUpdateEl = Phenotype.init(pheno, $results, opts);

    graphs.experimentBegin(opts);

    resize();

    if (opts.logOpts.startTab) {
      openSTab(opts.logOpts.startTab);
    }

    guiLog('starting ...');
    //worker = startGPworker(optsStr, function(msg){
    worker = Solver.startWorker(optsStr, function(msg){
        
      var content = msg.content;
      switch (msg.subject) {
        case 'log'     : guiLog(content); break;
        case 'consoleLog': log(content); break;
        case 'stats'   : 
          var stats = content;
          graphs.handleStats(stats);
          Phenotype.update(pheno, $phenoUpdateEl, stats.best_jsStr, stats.best, stats.runKnowledge, opts);
          resize();
          break;
        case 'result' : 
          $startButt.toggleClass('btn-success btn-danger');
          stopped(); 
          break;
        case 'runBegin': 
          graphs.runBegin(content);
          Phenotype.runBegin(content);
          break;
        default: log(content); break;
      }
    });
    setButtText($startButt, 'stop', 'stop');
  });

  $clearButt.click(function () {
    $log.html('');
  });
  $downButt.click(function () {
    guiLog('');
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

