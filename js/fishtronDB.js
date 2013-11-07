var FishtronDB = function () {

  var url = 'http://kutil.php5.cz/fishtronDB'; 
  //var url = 'http://localhost/fishtronDB';
  var callback = log;

  function load (args,fun) {

    var reqUrl = url + '?' + args ;

    var id = '__fishtronDB__script__';

    var res = $('#'+id);

    if (res.length !== 0) {
      res.remove();
    } 

    var newScript = 
      $('<script>')
        .attr('id',id)
        .attr('type','text/javascript')
        .attr('src',reqUrl);

    if (fun !== undefined) {
      callback = function (x) {
        $('#'+id).remove(); // uklidí po sobě
        fun(x);
      };  
    }

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

  function handle (x) {
    return callback(x);
  }

  return {
    get   : get,
    set   : set,
    whole : whole,
    handle: handle,
    apiURL: url 
  };
}();