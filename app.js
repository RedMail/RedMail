import smtp from 'smtp-protocol'
import accept from './accept'
import parser from './middleware/mailparser'
import concat from 'concat-stream'
// 创建stmp服务器
var server = smtp.createServer(req => {
  accept(req, concat(async(mailData) => {
    var data = await parser(mailData)
    console.log(data)
  })
)})

export default server
