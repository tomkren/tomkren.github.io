var Zone2D = {

  mk: function (opts) {
    opts = _.extend({
      side: 32,
      fieldSide: 16,
      initBoard: function(){},
      initField: function(){},
    },opts);

    var side      = opts.side;
    var fieldSide = opts.fieldSide;

    var board = [];

    function eachField (fun) {
      for (var i=0; i<side; i++){
        for (var j=0; j<side; j++){
          fun(board[i][j], {i:i,j:j});
        }
      }     
    }

    function init () {
      
      for (var i=0; i<side; i++){
        board[i] = [];
        for (var j=0; j<side; j++){
          board[i][j] = [];
        }
      } 

      opts.initBoard(board);
      eachField(opts.initField);
    }

    init();

    

    function step () {

    }

    var lastCtx = null;

    function draw (ctx) {

      if (ctx === undefined) {
        if (lastCtx !== null) {
          ctx = lastCtx;
        } else {
          log('ERR: zone2d.draw - no ctx supplied');
          return;
        }
      } else {
        lastCtx = ctx;
      }

      var w = side*fieldSide;
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,w,w); 

      eachField(function (field, pos) {
        _.each(field, function(obj){
          if (obj.draw) {
            obj.draw(ctx, pos.j*fieldSide, pos.i*fieldSide);
          }
        });
      });
    }

    return {
      step: step,
      draw: draw
    };

  }

};

