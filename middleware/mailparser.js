import { MailParser } from 'mailparser'

export default (mail) => {
  const mailparser = new MailParser()
  mailparser.write(mail)
  mailparser.end()
  return new Promise((resolve, reject) => {
    mailparser.on("end", (mail_object) => {
      resolve(mail_object)
    })
  })
}
