var Phenotype = function () {

  var $links, $runRow, $stage;
  var valPrecision;

  function init (pheno, $el, opts) {

    valPrecision = opts.logOpts.valPrecision;

    $el.html('');

    $links = $('<div>').css({
      'overflow-y'   : 'scroll', 
      'height'       : '800px',
      'margin-bottom': '20px'
    });
    $stage = $('<div>');

    $el.append([$stage, $links]);

    return pheno.init($stage);
  }

  
  function runBegin (gen) {
    $runRow = $('<div>').html('run '+gen+' : ');
    $links.append( $runRow );
  }

  function update (pheno, $el, best_jsStr, fitVal) {
    var $link = $('<div>').attr({
      //'data-toggle':"tooltip",

    }).css({
      'cursor':'pointer',
      'background-color': 'green',
      'width': '7px',
      'margin-left':'1px',
      'height': '42px',
      'display': 'inline-block'
        
    }).html($('<div>').css({
      'background-color': 'white',
      'height': (100-fitVal*100).toFixed(0) + '%'
    }))
    .click(function(){
      pheno.update($el, best_jsStr);
    })
    .tooltip({
      'placement':'top',
      'title': 'fitness: '+fitVal.toFixed(valPrecision)
    });

    $link.hover(function(){
      $link.css('background-color','red');
    },function(){
      $link.css('background-color','green');
    });

    $runRow.append($link);
    //
  }

  return {
    init: init,
    runBegin: runBegin,
    update: update
  };
}();