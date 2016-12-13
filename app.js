import server from './smtp-server'
import parser from './middleware/mailparser'
import concat from 'concat-stream'
import emaildb from './model/email'
import send from './send'
import config from './config/config'

// TODO::创建stmp服务器

server.onAuth = (auth, session, callback) => {
  var username = 'nobey';
  var password = '12345';
  if (auth.username === username &&
    (
      auth.method === 'CRAM-MD5' ?
      auth.validatePassword(password) : // if cram-md5, validate challenge response
      auth.password === password // for other methods match plaintext passwords
    )
  ) {
    return callback(null, {
      user: 'userdata' // value could be an user id, or an user object etc. This value can be accessed from session.user afterwards
    });
  }

  return callback(new Error('身份验证失败'));
}

server.onMailFrom = (address, session, callback) => {

  if (/^deny/i.test(address.address)) {
    return callback(new Error('发信人错误拒绝接受'));
  }
  console.log('from: '+ address.address)
  callback();
}

server.onRcptTo = (address, session, callback) => {
  var err;
  console.log('to: '+ address.address)
  if (/^deny/i.test(address.address)) {
    return callback(new Error('收信人错误拒绝接受'));
  }

  callback();
}

server.onData = (stream, session, callback) => {
  stream.pipe(concat(async(mailData) => {
    const data = await parser(mailData)
    const toAdd = data.to[0].address.split('@')[1].toLocaleLowerCase()
    const fromAdd = data.from[0].address.split('@')[1].toLocaleLowerCase()
    await emaildb.create({
      subject: data.subject,
      text: data.text,
      html: data.html,
      from: data.from[0].address,
      to: data.to[0].address,
      fromname: data.from[0].name,
      toname: data.to[0].name
    })

    if (config.host.indexOf(fromAdd) !== -1 && config.host.indexOf(toAdd) === -1) {
      await send(data.to[0].address, data)
    }

  }));

  stream.on('end', function() {
    var err;
    if (stream.sizeExceeded) {
      err = new Error('Error: message exceeds fixed maximum message size 10 MB');
      err.responseCode = 552;
      return callback(err);
    }
    callback(null, 'Message send ok'); // accept the message once the stream is ended
  });
}



export default server
