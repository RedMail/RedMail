
import mongoose from 'mongoose'
const Schema = mongoose.Schema;
/*
 *
 ** @subject     {String}      标题
 ** @text        {String}      文本内容
 ** @html        {String}      内容
 ** @from        {String}      发信人
 ** @to          {String}      收信人
 ** @fromname    {String}      发信人名字
 ** @toname      {String}      收信人名字
 **
 *
 */


const EmailSchema = new Schema({
  subject: {
    type: String
  },

  text: {
    type: String
  },

  html: {
    type: String
  },

  from: {
    type: String,
  },

  to: {
    type: String,
  },

  fromname: {
    type: String,
  },

  toname: {
    type: String,
  }
})

EmailSchema.plugin(require('../plugins/common.js'))

const Email = mongoose.model('Email', EmailSchema)

export default Email
