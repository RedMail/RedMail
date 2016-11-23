
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
