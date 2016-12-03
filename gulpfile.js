var gulp            = require('gulp');
var jshint          = require('gulp-jshint');
var stylish         = require('jshint-stylish');
var rename          = require('gulp-rename');
var jscs            = require('gulp-jscs');
var uglify          = require('gulp-uglify');
var livereload      = require('gulp-livereload');
var sourcemaps      = require('gulp-sourcemaps');
var exec            = require('child_process').exec;

gulp.task('default', ['watch']);

gulp.task('watch', function() {
    livereload.listen(35730);

    gulp.watch([
        './src/*.js',
        './src/*.hbs'
    ], ['reload-js'])
        .on('change', function(e) {
            console.log(
                '[gulp-watch] file ' +
                e.path +
                ' was ' +
                e.type +
                ', building'
            );
        });
});

gulp.task('reload-js', ['build-dist'], function() {
    return livereload.changed();
});

gulp.task('prod', ['uglify']);

gulp.task('uglify', ['build'], function() {
    return gulp.src([
        './dist/mixitup-multifilter.js'
    ])
        .pipe(uglify({
            preserveComments: 'license'
        }))
        .pipe(rename('mixitup-multifilter.min.js'))
        .on('error', function(e) {
            console.error('[uglify] ' + e.message);
        })
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/'))
        .pipe(gulp.dest('./demos/'));
});

gulp.task('build', ['build-dist'], function(done) {
    exec('node node_modules/mixitup-build/docs.js -s mixitup-multifilter.js', function(e, out) {
        if (out) {
            console.log(out);
        }

        done(e);
    });
});


gulp.task('build-dist', ['lint', 'code-style'], function(done) {
    exec('node node_modules/mixitup-build/dist.js -o mixitup-multifilter.js', function(e, out) {
        if (out) {
            console.log(out);
        }

        done(e);
    });
});

gulp.task('lint', function() {
    return gulp.src([
        './src/*.js'
    ],
    {
        base: '/'
    })
        .pipe(jshint('./.jshintrc'))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('code-style', function() {
    return gulp.src([
        './src/*.js'
    ],
    {
        base: '/'
    })
        .pipe(jscs())
        .pipe(jscs.reporter());
});