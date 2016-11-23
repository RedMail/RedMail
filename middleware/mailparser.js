import { MailParser } from 'mailparser'
const mailparser = new MailParser()

export default (mail) => {
  mailparser.write(mail)
  mailparser.end()
  return new Promise((resolve, reject) => {
    mailparser.on("end", mail_object => resolve(mail_object))
  })
}
