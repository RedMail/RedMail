  var N3 = require("pop3-n3").N3,
  server_name = "RedMail";
import '../bin/mongodb'
import Email from '../model/email'
import MessageStore from './messagestore'
MessageStore.prototype.registerHook =  function() {
  var that = this
  var curtime = new Date().toLocaleString()
  // var list1 = [{
  //   subject: '121212',
  //   text: 'sdljksdksdfkj',
  //   __v: 0,
  //   is_deleted: false
  // }, {
  //   subject: 'Hello',
  //   text: 'Hello world',
  //   html: '<b>Hello world</b>',
  //   from: 'nobey@nobey.cn',
  //   to: '786964300@localhost',
  //   fromname: '',
  //   toname: '',
  //   __v: 0,
  //   is_deleted: false
  // }]

   Email.find({}).then((list)=>{
     list.map((d) => {
       that.addMessage({
           toName: d.toname,
           toAddress: d.to,
           fromName: d.fromname,
           fromAddress: d.from,
           subject: d.subject,
           text: d.text,
           html: d.html
         })
     })
   })
}

function AuthStore(user, auth) {
  var password;
  if (user) {
    password = 12345;
  }
  return auth(password);
}

N3.extendAUTH("FOOBAR", function(authObj) {
  var params = authObj.params.split(" "),
    user = params[0],
    pass = params[1];

  if (!user)
    return "-ERR Authentication error. FOOBAR expects <user> <password>"

  authObj.user = user;
  return authObj.check(user, pass);
});

N3.startServer(110, server_name, AuthStore, MessageStore);
console.log(110)
