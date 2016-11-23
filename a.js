// var mail = require('mail').Mail({
//   host: '126.com',
//
// });
//
//
// mail.message({
//   from: 'sender@nobey.top',
//   to: ['kswsspy@126.com'],
//   subject: 'Hello from Node.JS'
// })
// .body('Node speaks SMTP!')
// .send(function(err) {
//   if (err) throw err;
//   console.log('Sent!');
// });


var smtp = require('smtp-protocol');
var fs = require('fs');
// import * as utils from './plugins/utils'
var utils = require('./plugins/utils')
smtp.connect('cname.chacuo.net', 25, function (mail) {
        mail.helo('mx1.qq.com');
        mail.from('nobey@nobey.top');
        mail.to('sbuiya54896@chacuo.net');
        mail.data();
        utils.strToStream('sdsdhd').pipe(mail.message());

        mail.quit();
    });
