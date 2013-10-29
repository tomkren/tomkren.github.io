

function mkRampedHalfAndHalf(D_init){

  var isFull;
  var d;

  function init () {
    isFull = Math.random() < 0.5;
    d = _.random(2,D_init);
  }

  function filter (ns) {

    if (ns.length === 0) {return ns;}

    var toSelectFrom = [];

    var s_depth = ns[0].s_depth;

    for (var i=0; i<ns.length; i++) {
      
      assert(s_depth === ns[i].s_depth, 
        's_depth of all succesors should be the same.');

      var newSubterm = ns[i].newSubterm;

      //log( showZipper(ns[i].state) );
      //log( code( newSubterm ,'lc') +' '
      //     + isTerminal(newSubterm)  +' '+ s_depth );

      var addIt;

      if      (s_depth == 0) {addIt = ! isTerminal(newSubterm); }
      else if (s_depth >= d) {addIt =   isTerminal(newSubterm); }
      else if (isFull)       {addIt = ! isTerminal(newSubterm); }
      else                   {addIt = true; }
      
      if (addIt) {
        toSelectFrom.push(ns[i]);
      }
    }

    //log(ns);

    

    return [randomElem(toSelectFrom)];
  }

  function isTerminal (term) {
    switch(term.c){
      case VAR : return true;
      case VAL : return true;
      case APP : return isTerminal(term.m) && isTerminal(term.n);
      case LAM : return isTerminal(term.m);
      case UNF : return false;
      default  : throw 'ramped-half-and-half.isTerminal : default-in-switch error';
    }
    throw 'ramped-half-and-half.isTerminal : should be unreachable';
  }

  return {
    init   : init,
    filter : filter,
    isFull : function () {return isFull;},
    d      : function () {return d;}
  };
}


var Strategy = {

  systematic        : {filter: _.identity},
  rampedHalfAndHalf : mkRampedHalfAndHalf(6)

}; 
