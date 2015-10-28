var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('default', function() {
  return browserify({
  	entries: ["index_rx.js"]
  })
  .transform(babelify)
  .bundle()
  .pipe(source('app_rx.js'))
  .pipe(gulp.dest('./wwwroot/assets'));
});