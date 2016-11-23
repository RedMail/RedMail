var smtp = require('smtp-protocol'); 
import { MailParser } from 'mailparser'
var mailparser = new MailParser();
var concat = require('concat-stream');
var data = ''

mailparser.on("end", function(mail_object){
  // console.log(mail_object)
})

var server = smtp.createServer(function(req) {
  req.on('greeting', function(to, ack) {   
    console.log(to)  // 这里是刚才的 helo 之后的回调  
    ack.accept();
  });

  req.on('from', function(to, ack) {  
    console.log(to) // 输入过发信人后的回调 mail from:
    ack.accept();
  });  

  req.on('to', function(to, ack) {   
    console.log(to)   //  输入目标邮箱后的回调  rcpt to:
    var domain = to.split('@')[1] || 'localhost';  // 获取域名
    if (domain === 'localhost') ack.accept()  //  判断域名是否是本服务器
    else ack.reject()
  });  

  req.on('message', function(stream, ack) {  //  data   //  通知传输数据的开始声明
    console.log('from: ' + req.from);      
    console.log('to: ' + req.to);
    stream.pipe(mailparser);  // 利用process.stdout打开了双向的数据传输通道
    ack.accept();   
  });
  
});



server.listen(9090);  // 监听25 端口 ，也可以使用别的
console.log('9090')
