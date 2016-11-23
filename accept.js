import config from './config/config.json'
import * as utils from './plugins/utils'

export default (req, callback) => {
  // 这里是 helo 之后的回调  
  req.on('greeting', (to, ack) => ack.accept())
  // 发信人的地址
  req.on('from', (to, ack) => ack.accept())
  // 收信人的地址
  req.on('to', (to, ack) => {   
    var domain = to.split('@')[1]
    if (config.host.indexOf(domain) !== -1) ack.accept()  //  判断域名是否是本服务器
    else ack.reject()
  })
  // 邮件内容
  req.on('message', (stream, ack) => { 
    stream.pipe(callback);
    ack.accept();   
  });
}
