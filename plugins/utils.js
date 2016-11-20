var stream = require('stream')
export const strToStream = (str)=>{
  var a = new stream.PassThrough()
  a.write(str)
  a.end()
  return a
}
