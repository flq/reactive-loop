var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

gulp.task('w_redux', function(){
  return browserifyWatch('index_redux.js', 'app_redux.js');
});

gulp.task('w_rx', function(){
  return browserifyWatch('index_rx.js', 'app_rx.js');
});

gulp.task('rx', function() {
  return bundleShare(
    browserify({ entries: ['index_rx.js'] }),
    'app_rx.js'
  );
});

gulp.task('redux', function() {
  return bundleShare(
    browserify({ entries: ['index_redux.js'] }),
    'app_redux.js'
  ); 
});

function browserifyWatch(input, output){
  // you need to pass these three config option to browserify
  var b = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true
  });
  b = watchify(b);
  b.on('update', function(){
    bundleShare(b, output);
  });
  
  b.add('./' + input);
  return bundleShare(b, output);
}

function bundleShare(b, output) {
  return b
    .transform(babelify)
    .bundle()
    .pipe(source(output))
    .pipe(gulp.dest('./wwwroot/assets'));
}