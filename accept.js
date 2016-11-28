import config from './config/config.json'
import * as utils from './plugins/utils'
import parser from './middleware/mailparser'
import concat from 'concat-stream'
import send  from './send'

export default (req, callback) => {
  // 这里是 helo 之后的回调  
  req.on('greeting', (to, ack) => ack.accept())
  // 发信人的地址
  req.on('from', (to, ack) => ack.accept())
  // 收信人的地址
  req.on('to', (to, ack) => {   
    var todomain   = to.split('@')[1]
    var fromdomain = req.from.split('@')[1]
    // if (config.host.indexOf(todomain) !== -1) ack.accept()  //  判断域名是否是本服务器
    ack.accept()
    // else ack.reject()
  })
  // 邮件内容
  req.on('message', (stream, ack) => { 
    var todomain   = req.to.split('@')[1]
    var fromdomain = req.from.split('@')[1]
    if(config.host.indexOf(fromdomain) === -1) {
        stream.pipe(concat(async(mailData) => {
          const data = await parser(mailData)
          await send(data.to[0].address, data)
          console.log(data)
        }))
        ack.accept();   
        return
    }
    stream.pipe(callback);
    ack.accept();   
  });
}
