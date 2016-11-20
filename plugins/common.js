/**
 * 所有表公用字段
 *
 * - created_at_ms 创建时间戳
 * - created_at 创建时间
 * - updated_at 更新时间
 * - is_deleted 是否已删除
 * - remark 备注
 */
var moment = require('moment');

module.exports = exports = function (schema, options) {
  schema.add({
    //创建年份
    created_year : {
      type : String,
      require : true
    },
    // 创建月份
    created_month : {
      type : String,
      require : true
    },
    // 创建天
    created_day : {
      type : String,
      require : true
    },
    // 创建小时
    created_hour : {
      type : String,
      require : true
    },
    // 创建分钟
    created_minute : {
      type : String,
      require : true
    },
    // 创建时间戳
    created_at_ms: {
      type: String
    },
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now
    },
    // 最后修改时间
    updated_at: {
      type: Date,
      default: Date.now
    },
    // 是否已删除
    is_deleted: {
      type: Boolean,
      default: false
    },
    // 备注
    remark: {
      type: String
    },
  })
  
  schema.pre('save', function (next) {
    var date = moment().format('YYYY-MM-DD-hh-mm').split('-');
    this.created_at_ms  = new Date().getTime();
    this.created_year   = date[0];
    this.created_month  = date[1];
    this.created_day    = date[2];
    this.created_hour   = date[3];
    this.created_minute = date[4];
    next();
  })
}