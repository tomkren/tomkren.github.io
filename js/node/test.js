var http  = require('http');
var mysql = require('mysql');
var fs    = require('fs');

var i  = 0;

function run (config) {
  http.createServer(function (req, res) {
    i++;

    var connection = mysql.createConnection(config.mysql);
    connection.connect();

    var sql = "SELECT `val` FROM `big_object` WHERE `key` = 'zobrazeni'";
    connection.query(sql, function (err, rows, fields) {
    
      res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
      res.write('Ahoj pane číslo '+i+'!\n');
    

      if (err) {
        console.log(err.toString());
      } else {
        res.write('big_object.zobrazeni = '+ rows[0].val+'\n');  
      }

      res.end();
      
    });

    connection.end();

    console.log(i);
  }).listen(config.port, config.ip);
  console.log('Server running at http://'+config.ip+':'+config.port );
}

function loadConfig (onLoad) {
  var localConfigFile = __dirname + '/config.json';
  fs.readFile(localConfigFile, 'utf8', function (err, data) {
    if (!err) {
      onLoad(JSON.parse(data));
    } else {
      var defaultConfigFile = __dirname + '/config.default.json';
      fs.readFile(defaultConfigFile, 'utf8', function (err, data) {
        if (!err) {
          console.log('(using config.default.json)');
          onLoad(JSON.parse(data));
        } else {
          console.log(err.toString());
        }
      });
    }
  });
}

loadConfig(run);