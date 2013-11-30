var FishtronDB = function () {

  var apiURL = 'http://146.255.30.53/fishtronDB'; 
  //var apiURL = 'http://kutil.php5.cz/fishtronDB'; 
  //var apiURL = 'http://localhost/fishtronDB';
  
  var nextHandlerID = 1;
  var handlers = {};

  function load (args,fun) {

    var handlerID = 'id' + nextHandlerID;
    nextHandlerID++;
    
    var reqUrl = apiURL + '?id=' + handlerID + '&' + args ;
    var id = '__fishtronDB__script__'+ handlerID ;
    
    var newScript = 
      $('<script>')
        .attr('id',id)
        .attr('type','text/javascript')
        .attr('src',reqUrl);


    handlers[handlerID] = function (x) {
      $('#'+id).remove(); // uklidí po sobě
      delete handlers[handlerID];
      fun(x);
    };  

    try {
      $('head').append(newScript);
    } catch (e) {
      log(e);
    }  
  }

  function set (key,val,fun) {
    if (fun === undefined) {fun = log;}
    var valStr = encodeURIComponent(JSON.stringify(val));
    load('action=set&key='+key+'&val='+valStr,fun);
  }

  function get (key,fun) {
    if (fun === undefined) {fun = log;}
    load('action=get&key='+key,fun);
  }

  function whole (fun) {
    if (fun === undefined) {fun = log;}
    load('action=whole',fun);  
  }

  function handle (handlerID,x) {
    handlers[handlerID](x);
  }

  return {
    get   : get,
    set   : set,
    whole : whole,
    handle: handle,
    apiURL: apiURL,
  };
}();