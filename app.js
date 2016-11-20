var SMTPServer = require('smtp-server').SMTPServer;

// This example starts a SMTP server using TLS with your own certificate and key
var server = new SMTPServer({
    logger: true,
    onData: function(stream, session, callback){
    stream.pipe(process.stdout); // print message to console
    stream.on('end', callback);
}
});
server.on('error', function(err){
    console.log('Error %s', err.message);
});

server.listen(9090);








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
