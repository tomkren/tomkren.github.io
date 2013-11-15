var renderSections = function(contentsSelector){
  $(contentsSelector).html('');
  $('section').each(function(){
    var it = $(this);  

    var code   = it.attr('id');
    var nadpis = it.attr('text') ? it.attr('text') : it.html();

    if (!it.attr('done')) {
      //log(it.html());
      it.html( $('<h2>').html( nadpis + ' <a href="'+contentsSelector+'">⌂</a>' ) )
        .prepend( $('<a>').attr('name', code ) )
        .attr('done','1')
        .attr('text',nadpis);
    }

    $(contentsSelector)
      .append( $('<a>').attr('href','#'+code).html( nadpis ) )
      .append( $('<br>') );

  });
};

function mkTodoIndex (indexSelector) {
  $(indexSelector).html('');
  $('todo').each(function(i){
    var j = i+1;
    var code = '__todo-'+j;
    var text = '('+ j +') '+ $(this).html();

    $(this).before('<a name="'+code+'"></a>');
    $(indexSelector)
      .append( $('<a>').attr('href','#'+code).html( text ) )
      .append( $('<br>') );
  });
}

var renderLabels = function(tag,str,color){
  $(tag).each(function(){
    var it = $(this);
    if (!it.attr('done')) {
      it
       .attr('done','1')
       .css('color','white')
       .css('background-color',color)
       .css('width','intrinsic')
       .css('width','-moz-max-content')
       .css('padding','3px')
       .prepend('<b>'+str+'</b>')
       .before('<p></p>')
       .after('<p></p>');
    }
  });
};

var runCodes = function(){
  $('code').each(function(){
    $(this)
     .append($('<script>').html( $(this).html() ));
  });
};

var showScripts = function(){
  $('script').each(function(){
    var it = $(this); 
    if (!it.attr('done') && it.attr('show') === 'true') {
      it.attr('done','1').after($('<div>').html( '<pre>'+it.html()+'</pre>' ));
    }
  });
};

function renderAll () {
  renderSections('#contents');
  renderLabels('todo','TODO : ','red');
  renderLabels('note','Note: ','blue');  
  mkTodoIndex ('#todoIndex');
  showScripts();
}
