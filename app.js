import smtp from 'smtp-protocol'
import accept from './accept'
import parser from './middleware/mailparser'
import concat from 'concat-stream'
import emaildb from './model/email'

// 创建stmp服务器
const server = smtp.createServer(req => {

  accept(req, concat(async(mailData) => {
    const data = await parser(mailData)
    emaildb.create({
      subject: data.subject,
      text: data.text,
      html: data.html,
      from: data.from[0].address,
      to: data.to[0].address,
      fromname: data.from[0].name,
      toname: data.to[0].name
    })
    console.log(data)
  })
)})

export default server
