var N3 = require("pop3-n3").N3,
    server_name = "RedMail";
import '../bin/mongodb'
import Email from '../model/email'
import MessageStore from './messagestore'
  MessageStore.prototype.registerHook = async function ()  {
        var that    = this
        var curtime = new Date().toLocaleString()
        var list1    = [ {
    created_minute: '43',
    created_hour: '06',
    created_day: '26',

    created_month: '11',
    created_year: '2016',
    created_at_ms: '1480156990001',
    subject: '121212',
    text: 'sdljksdksdfkj',
    __v: 0,
    is_deleted: false},
  {
    created_minute: '40',
    created_hour: '08',
    created_day: '26',
    created_month: '11',
    created_year: '2016',
    created_at_ms: '1480164052084',
    subject: 'Hello',
    text: 'Hello world',
    html: '<b>Hello world</b>',
    from: 'nobey@nobey.cn',
    to: '786964300@localhost',
    fromname: '',
    toname: '',
    __v: 0,
    is_deleted: false} ]
        var list = await Email.find({})
        // console.log(list)
        list.map((d)=>{
          console.log(d)
          that.addMessage({
              toName:       d.toname,
              toAddress:    d.to,
              fromName:     d.fromname,
              fromAddress:  d.from,
              subject:      d.subject,
              text:         d.text,
              html:         d.html
          })
          // console.log(new Date())
        })
    }

    function AuthStore(user, auth){
        var password;
        if(user){
            password = 12345;
        }
        return auth(password);
    }

    N3.extendAUTH("FOOBAR",function(authObj){
        var params = authObj.params.split(" "),
            user = params[0],
            pass = params[1];

        if(!user)
            return "-ERR Authentication error. FOOBAR expects <user> <password>"

        authObj.user = user;
        return authObj.check(user, pass);
    });

    N3.startServer(110, server_name, AuthStore, MessageStore);
    console.log(110)
