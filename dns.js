import send from './send'

import mxparser from './middleware/mxparser'

// var ss = async ()=>{
//    await send('nobey@localhost', {
//      subject: 'title',
//      html: '<h1>sdfdsfsd</h1>'
//    })
// }

var ww = async ()=>{
var sdd =  await mxparser('qq.cn')
  console.log(sdd)
}


// ss()
// ss()
ww()
