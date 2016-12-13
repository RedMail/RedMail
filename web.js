var express = require('express');
var app = express();
var cors = require('cors')

import emaildb from './model/email'

app.use(cors());


app.get('/', function (req, res) {
  res.send('RedMail api');
});

app.get('/list/:pages',  async(req, res) =>{
  var pages = req.params.pages || 1
  var num = (pages-1)*10
  var list = await emaildb.find({}).limit(10).skip(num)
  res.json(list);
});

var server = app.listen(11025, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
