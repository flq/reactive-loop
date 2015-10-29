var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('rx', function() {
  return bundle('index_rx.js', 'app_rx.js')
});

gulp.task('redux', function() {
  return bundle('index_redux.js', 'app_redux.js')
});

function bundle(input, output) {
  return browserify({
    entries: [input]
  })
  .transform(babelify)
  .bundle()
  .pipe(source(output))
  .pipe(gulp.dest('./wwwroot/assets'));
}