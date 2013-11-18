
function nop () {}

var log = function(x){
  console.log(x);
};

var logArray = function(xs){
  if(!_.isArray(xs)){xs=[xs];}
  _.each(xs,function(x){
      log(x);
  });  
};

var logCodes = function(xs){
  return logArray(code(xs));  
};

var assert = function(condition, message) {
  if (!condition) {
    throw message || "Assertion failed!";
  }
};


function randomElem (arr) {
  return arr[_.random(0,arr.length-1)];
}


var empty = null;
var cons = function(x,xs){
  return { head : x  , 
           tail : xs };
};


function sum(xs){
  return _.reduce(xs,function(x,y){return x+y;},0);  
}

function times (n, fun) {
  for (var i = 1; i<=n; i++) {
    fun(i);
  }
}

function repeat (str, n) {
  var ret = '';
  times(n, function(){
    ret += str;
  });
  return ret;
}

function formatBreak (n, str, ods) {
  var parts = str.split('\n');
  var ret = '';
  if (ods) {n = n - ods;}
  var re = new RegExp('.{1,'+n+'}','g');
   
  _.each(parts, function (part) {
    _.each(part.match(re), function (subpart) {
      if (ods) {subpart = repeat(' ',ods) + subpart;}
      ret += subpart + '\n';
    });
  });
  return ret;
}

function prefill (str,n) {
  str = str+'';
  if (str.length < n){
    return repeat(' ',n-str.length) + str;
  }
  return str;
}


var partition = function(mustBeTrue,array){
  assert(_.isArray(array),'partition : the array argument must be an array.');
  var satisfy    = [];
  var notSatisfy = [];
  for( var i = 0 ; i < array.length ; i++ ){
    if( mustBeTrue(array[i]) ){
      satisfy.push( array[i] );
    } else {
      notSatisfy.push( array[i] );
    }
  }
  return { satisfy    : satisfy ,
           notSatisfy : notSatisfy };
};

function updateBest( oldRes , newRes ){
  if( oldRes.fitVal < newRes.fitVal ){
    return newRes;
  }
  return oldRes;
}

function mkDist( distArr ){
  
  var sum = 0;
  var len = distArr.length;

  for(var i = 0; i < len; i++){
    var p = distArr[i][1];
    assert(p >= 0, 'probability for dist mus be >= 0, was '+p);
    sum += p;
  }

  function get () {
    var ball = Math.random() * sum;
    var sumNow = 0;
    var i;
    for(i = 0; i < len; i++){
      sumNow += distArr[i][1];
      if( ball < sumNow ){
        break;
      }
    }
    return distArr[i][0];
  }

  function avgVal () {
    return sum / len;
  }

  function bestVal () {
    var best = {fitVal: 0};
    for (var i = 0; i < len; i++){
      best = updateBest(best, {fitVal:distArr[i][1]});
    }
    return best.fitVal;
  }

  function worstVal () {
    var best = {fitVal: -Number.MAX_VALUE};
    for (var i = 0; i < len; i++){
      best = updateBest(best, {fitVal:-distArr[i][1]});
    }
    return -best.fitVal;
  }

  function prettyPrint (fun) {
    fun = fun || _.identity;

    _.each(_.sortBy(distArr,function (p) {
      return -p[1];
    }), function (row) {
      log( fun(row[0]) + ' : ' + row[1]);
    });
  }

  return {
    get : get,
    distArr : function(){return distArr;},
    prettyPrint: prettyPrint,
    avgVal:   avgVal,
    bestVal:  bestVal,
    worstVal: worstVal
  };
}


var mkTypeChecker = function(arg){
  return _.isArray(arg) ? 
         mkTypeChecker_union(arg) : 
         mkTypeChecker_const(arg) ;
};

var mkTypeChecker_const = function( typeConstructorConstant ){
  return function(x){
    return x.c === typeConstructorConstant ;
  };
};

var mkTypeChecker_union = function( typeCheckerFuns ){
  var len = typeCheckerFuns.length;
  return function(x){
    for( var i = 0 ; i < len ; i++ ){
      if(typeCheckerFuns[i](x)){
        return true;
      }
    }
    return false;
  };
};

