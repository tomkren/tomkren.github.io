var Phenotype = function () {

  var $links, $code, $runRow, $stage;
  var pheno, ctx, valPrecision;

  function init (pheno_, $el, opts) {
    pheno = pheno_;
    ctx          = opts.solver.ctx;
    valPrecision = opts.logOpts.valPrecision;

    $el.html('');

    $code = $('<pre>').css({
      'margin-top':'10px'
    });

    $links = $('<div>').css({
      'overflow-y'   : 'scroll', 
      'height'       : '400px',
      'padding'      : '10px',
      'background-color': '#F5F5F5',
      'border' : '1px solid #CCCCCC',
      'border-radius': '3px'
    });
    $stage = $('<div>');

    $el.append([$stage, $links, $code]);

    return pheno.init($stage);
  }

  
  function runBegin (gen) {
    $runRow = $('<div>').html(
      '<span class="label label-success">run '+gen+'</span> &nbsp; &nbsp;'
    );
    $links.prepend( $runRow );
  }

  var theGreen = '#5CB85C';

  function update (pheno_, $el, best_jsStr, fitVal, runKnowledge, opts) {

    var __result;
    with(ctxToWithobj(ctx)){
      eval('__result=' + best_jsStr );
    }

    var greenBar = opts.greenBar || 1;
    
    pheno = pheno_;
    var $link = $('<div>').attr({
      //'data-toggle':"tooltip",

    }).css({
      'cursor':'pointer',
      'background-color': theGreen,
      'width': '7px',
      'margin-left':'1px',
      'height': '42px',
      'display': 'inline-block'
        
    }).html($('<div>').css({
      'background-color': '#F5F5F5',
      'height': ( (100-greenBar*fitVal*100) ).toFixed(0) + '%' 
    }))
    .click(function(){
      pheno.update($el, __result, best_jsStr, runKnowledge);
      $code.html( best_jsStr );
    })
    .tooltip({
      'placement':'top',
      'title': 'fitness: '+fitVal.toFixed(valPrecision)
    });

    $link.hover(function(){
      $link.css('background-color','red');
      pheno.update($el, __result, best_jsStr, runKnowledge);
      $code.html( best_jsStr );
    },function(){
      $link.css('background-color','green');
    });

    $runRow.append($link);
    //
  }

  return {
    init: init,
    runBegin: runBegin,
    update: update,
    get$bars:       function(){return $links;},
    getPhenoHeight: function(){return pheno ? pheno.height : undefined;}
  };
}();