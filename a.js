var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtp://cname.chacuo.net');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'sdsd@nobey.top', // sender address
    to: 'wjclzf20451@chacuo.net', // list of receivers
    subject: 'Hello ✔', // Subject line
    html: '<b>Hello world 🐴</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});





// var smtp = require('smtp-protocol');
// var fs = require('fs');
// import * as utils from './utils'
// smtp.connect('smtp.gmail.com', 465, function (mail) {
//     mail.helo('');
//     mail.from('nobey@nobey.top');
//     mail.to('nobeycn@gmail.com');
//     mail.data();
//     // fs.createReadStream('./es6.js').pipe(mail.message())
//     mail.quit();
// });
