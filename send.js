import mailer from 'nodemailer'
import direct from 'nodemailer-direct-transport'
import mxparser from './middleware/mxparser'
import config from './config/config'

var isArray = function(obj) {
return Object.prototype.toString.call(obj) === '[object Array]';
}

export default async (Addres, data) => {
  const addres = await mxparser(Addres.split('@')[1])
  if (!isArray(addres)) return
  const mxaddres = addres.length === 0 ? Addres.split('@')[1] : addres[0]
  const transporter = mailer.createTransport(direct({
    name: mxaddres
  }))
  const mailOptions = {
      from: data.from[0].address,
      to: Addres,
      subject: data.subject,
      html: data.html,
      text: data.text
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
        if(error) return reject(error)
        resolve(info)
    })
  })
}
