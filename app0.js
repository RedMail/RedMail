// import fs from 'fs'
// import * as ut from './plugins/utils.js'
// var concat = require('concat-stream');
//
// var reverseStream = concat(function(text){
//   console.log(text.toString())
// })
//
// ut.strToStream('sssdddfsfd').pipe(reverseStream)

// const mongoose = require('mongoose');

import db from './bin/mongodb.js'
import Email from './model/email'
// var data = {}
// console.log(Email)e




Email.create({
  subject: '121212',
  text: 'sdljksdksdfkj'
}).then((s)=>{
  console.log(s)
})
