const child       = require('child_process');
const browserSync = require('browser-sync');
const gulp        = require('gulp');
const pug         = require('gulp-pug');
const concat      = require('gulp-concat');
const deploy      = require("gulp-gh-pages");
const gutil       = require('gulp-util');
const sass        = require('gulp-sass');
const prefix      = require('gulp-autoprefixer');

/*
*   Paths to all folders: Jekyll's build folder, Sass, Pug, etc
*/
const paths = {
  root: '_site',
  assets: ['./_assets/**'],
  scripts: [
    './src/js/main.js',
    './src/js/**/*.js'
  ],
  html: [
    './src/pug/index.pug',
    './src/pug/**/*.pug'
  ],
  styles: [
    './src/sass/main.scss',
    './src/sass/**/*.scss',
    './src/sass/**/*.sass'
  ]
};

/*
*   Runs Jekyll and logs Jekyll output
*/
gulp.task('jekyll:build', (done) => {
  const jekyll = child.spawn('jekyll', ['build',
    '--watch',
    '--incremental',
    '--drafts'
  ]);

  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach((message) => gutil.log('Jekyll: ' + message));
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
});

/*
*   Runs Browser Sync and servers the Jekyll build folder '_site'
*/
gulp.task('serve', () => {
  browserSync.init({
    files: [paths.root + '/**'],
    port: 4000,
    server: {
      baseDir: paths.root
    }
  });
});

/*
*   Pushes Jekyll build folder '_site' to Github's GH-Pages
*   TODO: Figure out why Gulp won't let you call this task 'deploy'
*/
gulp.task('fire', () => {
  return gulp.src(`${paths.root}/**/*`)
    .pipe(deploy());
});

/*
*   Moves Asset folders: img, icons, fonts, etc into '_site'
*   TODO: Add image optimization task
*/
gulp.task('assets:build', function(){
  return gulp.src(paths.assets)
    .pipe(gulp.dest('_site/assets/'));
});

/*
*   Builds Sass then runs it through AutoPrefixer. 
*/
gulp.task('css:build', () => {
  gulp.src(paths.styles)
    .pipe(sass({
      includePaths: ['sass', 'scss'],
      onError: browserSync.notify 
    }))
    .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
    .pipe(gulp.dest('_site/css'))
    .pipe(browserSync.reload({stream:true}))
    .pipe(gulp.dest('css'));
});

gulp.task('css:watch', ['css:build', 'jekyll:build'], (done) => {
    browserSync.reload();
    done();
});

/*
*   -----
*/
gulp.task('html:build', () =>{
  return gulp.src(paths.html)
    .pipe(pug())
    .pipe(gulp.dest('_includes'));
});

gulp.task('html:watch', ['html:build', 'jekyll:build'], (done) => {
    browserSync.reload();
    done();
});


/*
*   ----- TODO: fix this
*/
gulp.task('js:lint', () => {
  return gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

/*
*   ----- TODO: fix this
*/
gulp.task('js:build', () => {
  return gulp.src(paths.scripts)
    // .pipe(concat('main.js'))
    // .pipe(gulp.dest('./public/js'));
});

gulp.task('js:watch', ['js:build', 'jekyll:build'], (done) => {
    browserSync.reload();
    done();
});

/*
*   Overall watch tasks for all the different file types
*/
gulp.task('watch', () => {
  gulp.watch(paths.html, ['html:watch']);
  gulp.watch(paths.scripts, ['js:lint', 'js:watch']);
  gulp.watch(paths.styles, ['css:watch']);
});

/*
*   Overall Build tasks. Builds everything. 
*/
gulp.task('build', ['js:build', 'html:build', 'css:build', 'assets:build', 'jekyll:build',]);

/*
*   DUH! - fires off building, serving with BrowserSync, then watching all files
*/
gulp.task('default', ['build', 'serve', 'watch']);