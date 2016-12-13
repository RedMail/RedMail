var express = require('express');
var app = express();
var cors = require('cors')
var bodyParser = require('body-parser');
// var multer = require('multer');
// import './bin/mongodb.js'
import emaildb from './model/email'
import send from './send'
app.use(cors());

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
// app.use(multer()); // for parsing multipart/form-data

app.get('/', function(req, res) {
  res.send('RedMail api');
});

app.get('/list/:pages', async(req, res) => {
  var pages = req.params.pages || 1
  var num = (pages - 1) * 10
  var list = await emaildb.find({}).limit(10).skip(num)
  res.json(list);
});

app.post('/send', async(req, res) => {
  var html = req.body.html
  var text = req.body.text
  var subject = req.body.subject
  var from = req.body.from
  var to = req.body.to

  var data = {
    html: html,
    text: text,
    subject: subject,
    from: [{
      address: from,
      name:''
    }],
    to: [{
      address: to,
      name:''
    }]
  }

  const ok = await send(to, data)
  res.json(ok);
});

var server = app.listen(11025, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
