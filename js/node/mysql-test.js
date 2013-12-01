var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',//'sekol',
  password : '',//'tribar42',
  database : 'test',
});

connection.connect();

connection.query("SELECT `val` FROM `big_object` WHERE `key` = 'zobrazeni'", 
  function(err, rows, fields) {
    if (err) throw err;
    console.log('Tadaa: ', rows[0].val);
  }
);

connection.end();
