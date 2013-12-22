var Ryba = (function() {
  
  function mk (rybaOpts) {

    var $el = $('<div>').css({
      position : 'absolute',
      bottom   : rybaOpts.bottom,
      right    : rybaOpts.right,
      color    : 'red',
      'z-index': '5'
    }).html(
      $('<img>').attr({src:'img/hra/pomocnik.png'})
    );

    $el.click(function () {
      log('Yo click\'d-da fisha!');
    });

    return {
      $el: $el,
    }
  }

  return {
    mk : mk,
  };
})();