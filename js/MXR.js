var MXR = (function () {

  var nxtEID = 0;
  function nextEditorId () {
    var ret = '__mxr-miniedit-' + nxtEID + '__';
    nxtEID ++;
    return ret;
  }
  
  function mk (mkOpts) {



    var $el = $('<div>').html('TODO.. :)');

    mkOpts.$appendToElem.append( $el );


    function set (opts) {

      $el.html('');

      var mixerOpts = _.extend({
        propsToShow : ['name', 'numRuns', 'numGens', 'popSize', 'saveBest']
      }, opts.mxrOpts || {});

      $el.append( strfyObject(opts, mixerOpts.propsToShow, true) );

    }

    return {
      $el: $el,
      set: set
    };
  }

  function stringify (x) {

    if (_.isString  (x)) { return strfyString  (x); }
    if (_.isFunction(x)) { return strfyFunction(x); } 
    if (_.isArray   (x)) { return strfyDefault (x); } 
    if (_.isObject  (x)) { return strfyObject  (x); }
    if (_.isNumber  (x)) { return strfyDefault (x); }
    if (_.isBoolean (x)) { return strfyBoolean (x); }

    return strfyDefault(x);
  }

  function strfyDefault (x) {
    return $('<pre>').text(JSON.stringify(x));
  }

  function strfyString (str) {
    //TODO
    return $('<div>').css('font-family', 'Courier New').text(str);
  }

  function strfyBoolean (isTrue) {
    var $box = $(' <input type="checkbox">');
    if (isTrue) {
      $box.attr('checked','checked');
    }    
    return $box;
  }

  function mkStrfyFun (miniStr, coreFun) {
    return function (obj, toShow, isOpen) {
      
      var $tab = coreFun(obj, toShow, isOpen);

      if (isOpen) {

        return $tab;

      } else {

        isOpen = false;
        
        var $maximizeLink // = $('<a>').css('cursor', 'pointer').html(miniStr);
                          = $('<span>').addClass("label label-default").css({
                              cursor : 'pointer',
                              'font-size' : '15px' 
                            }).html(miniStr);
        var $tabPlace     = $('<div>').css({
          'margin-top' : '20px'
        }).html( $tab ).hide();

        $maximizeLink.click(function () {
          if (isOpen) {
            $tabPlace.hide();
          } else {
            $tabPlace.show();
          }
          isOpen = !isOpen;
        });
        
        return $('<div>').append([ $maximizeLink, $tabPlace ]);
      }

    }
  }

  var strfyFunction = mkStrfyFun('function (..) {..}', function (x) {
    return $('<pre>').text( x.toString() );
  });

  var strfyObject = mkStrfyFun('{..}', function (opts, toShow, isOpen) {
    
    toShow = toShow || _.keys(opts);  

    var $tab = $('<table>').addClass('table table-hover');

    _.each(toShow, function(prop) {
      
      var  val = opts[prop];

      var $row = $('<tr>').append([ 
        $('<td>').css('width', '10%').html(prop), 
        $('<td>').html( stringify(val) ) 
      ]);

      $tab.append($row);

    });

    return $tab;

  });






  return {
    mk : mk
  };
})();