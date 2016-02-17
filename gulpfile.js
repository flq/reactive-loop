var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

gulp.task('watch', function(){
  return browserifyWatch('index.js', 'app.js');
});

gulp.task('default', ['first', 'rocketLaunch']);

gulp.task('first', function() {
  return createSample('samples/first.js', 'first.js');
});

gulp.task('rocketLaunch', function() {
  return createSample('samples/launch.js', 'launch.js');
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

function createSample(input, output) {
  return bundleShare(
    browserify({ entries: [input] }),
    output
  );
}

function bundleShare(b, output) {
  return b
    .transform(babelify.configure({
      presets: ["es2015", "react"]
    }))
    .bundle()
    .pipe(source(output))
    .pipe(gulp.dest('./wwwroot/assets'));
}