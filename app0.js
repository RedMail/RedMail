import fs from 'fs'
import * as ut from './plugins/utils.js'
var concat = require('concat-stream');

var reverseStream = concat(function(text){
  console.log(text.toString())
})

ut.strToStream('sssdddfsfd').pipe(reverseStream)
