import mailer from 'nodemailer'
import direct from 'nodemailer-direct-transport'
import mxparser from './middleware/mxparser'
import config from './config/config'

export default async (Addres, data) => {
  const addres = await mxparser(Addres)
  const mxaddres = addres.length === 0 ? Addres.split('@')[1] : addres[0]
  const transporter = mailer.createTransport(direct({
    name: mxaddres
  }))
  const mailOptions = {
      from: config.send + "@" + config.host[0],
      to: Addres,
      subject: data.subject,
      html: data.html
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
        if(error) return reject(error)
        resolve(info)
    })
  })
}
