var gulp = require('gulp');
var eslint = require('gulp-eslint');
gulp.task('default', ['lint'], function() {
  // 将默认任务
});

gulp.task('lint', function() {
  // eslint 检查
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('dev', function() {
  // 调试使用 自动检查改变重启


});
