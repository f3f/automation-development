const gulp                = require('gulp'),
      sass                = require('gulp-sass'),
      less                = require('gulp-less'),
      htmlclean           = require('gulp-htmlclean'),
      del                 = require('del'),
      sourcemaps          = require('gulp-sourcemaps'),
      autoprefixer        = require('gulp-autoprefixer'),
      imagemin            = require('gulp-imagemin'),
      useref              = require('gulp-useref'),
      uglify              = require('gulp-uglify'),
      babel               = require('gulp-babel'),
      uncss               = require('gulp-uncss'),
      plumber         	  = require('gulp-plumber'),
      minimist         	  = require('minimist'),
      changed         	  = require('gulp-changed'),
      gulpif         	  = require('gulp-if'),
      htmlExtend          = require('gulp-html-extend'),
      rev 		          = require('gulp-rev'),
      revCollector        = require('gulp-rev-collector'),
      browserSync         = require('browser-sync').create();
const reload = browserSync.reload;
const knownOptions = {
  string: 'env',
  default: { env: process.env.NODE_ENV || 'production' }
};
const options = minimist(process.argv.slice(2), knownOptions);

let url = []
    if (options.env == 'production') {
        url = ['rev/**/*.json', 'src/html/**/*.html']
    } else {
        url = ['src/html/**/*.html']
    }


/**
	* 编译scss->css.
	* 使用autoprefixer. 增加浏览器前缀
	* uncss. 剔除书写而没有用到的样式
	* 在开发模式下使用gulp-rev. 增加文件版本号
**/
gulp.task('task-scss', function(){
  return gulp.src('src/css/**/*.scss')
          .pipe(gulpif(options.env != 'production',sourcemaps.init())) //set hash key 
          .pipe(gulpif(options.env == 'production', rev())) //set hash key 
          .pipe(changed('./dist/css'))
          .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        //   .pipe(uncss({
        //   	   ignore:['.class'],// UnCSS保持不动的选择器，因为它无法检测页面上的用户交互（例如悬停，点击，焦点）。文字名称和正则表达式都被识别
	       //     html: ['src/html/**/*.html']
	       // }))
          .pipe(autoprefixer({
            browsers: ['last 2 versions']
          }))
          .pipe(gulpif(options.env != 'production', sourcemaps.write('./maps')))
          .pipe(gulp.dest('dist/css'))
          .pipe(gulpif(options.env == 'production', rev.manifest()))
          .pipe(gulpif(options.env == 'production', gulp.dest('rev/css')))
          .pipe(browserSync.stream())
});


/**
	* 编译less->css.
	* 使用autoprefixer. 增加浏览器前缀
	* uncss. 剔除书写而没有用到的样式
	* 在开发模式下使用gulp-rev. 增加文件版本号
**/

gulp.task('task-less', function(){
  return gulp.src('src/css/**/*.less')
          .pipe(gulpif(options.env != 'production', sourcemaps.init()))
          .pipe(gulpif(options.env == 'production', rev())) //set hash key
          .pipe(changed('./dist/css'))
          .pipe(less())
        //   .pipe(uncss({
        //   	   ignore:['.class'],// UnCSS保持不动的选择器，因为它无法检测页面上的用户交互（例如悬停，点击，焦点）。文字名称和正则表达式都被识别
	       //     html: ['src/html/**/*.html']
	       // }))
          .pipe(autoprefixer({
            browsers: ['last 2 versions']
          }))
          .pipe()
          .pipe(gulpif(options.env != 'production', sourcemaps.write('./maps')))
          .pipe(gulp.dest('dist/css'))
          .pipe(gulpif(options.env == 'production', rev.manifest()))
          .pipe(gulpif(options.env == 'production', gulp.dest('rev/css')))
          .pipe(browserSync.stream())
});

/**
	* 编译html.
	* 使用htmlExtend. 引入页面公共部分
	* 在开发模式下使用revCollector. 增加文件版本号
**/
gulp.task('task-html', ['task-js','task-scss'],function(){
  return gulp.src(url)
        .pipe(plumber("This file has an error: <%= file.relative %>!"))
        .pipe(changed('dist/html'))
        .pipe(gulpif(options.env =='production', revCollector({
        	replaceReved:true   
        })))
        .pipe(htmlExtend({
            annotations: true,
            verbose: false
        }))
       .pipe(gulpif(options.env =='production', htmlclean()))
       .pipe(gulp.dest('dist/html'))
       .pipe(browserSync.stream())
});


/**
	* 使用gulp-useref来对html页面中的js，css引用进行合并，压缩等操作很简单
	* 通过插入特定的标签，用于标示gulp-useref要处理的资源。
	* 样例在 src/html/useref.html
**/
gulp.task('task-useref', function(){
  return gulp.src('src/html/useref.html')
  	   .pipe(useref())
       .pipe(gulp.dest('dist/html'))
});

/**
	* 编译js.
	* 使用gulp-babel. 编译js
	* 在开发模式下使用revCollector. 增加文件版本号
**/
gulp.task('task-js', function(){
  return  gulp.src(['./src/js/*/**.js','!./src/js/lib/**/**.js','!./src/js/common/**/**.js'])
            .pipe(plumber())
            .pipe(gulpif(options.env == 'production', rev())) //set hash key
            .pipe(changed('dist/js'))
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(gulp.dest("dist/js"))
            .pipe(gulpif(options.env == 'production', rev.manifest()))
            .pipe(gulpif(options.env == 'production', gulp.dest('rev/js')))
            .pipe(browserSync.reload({
                stream: true
            }));
});

/**
	* 编译图片.
	* 使用imagemin. 压缩图片
**/
gulp.task('task-img', function(){
  return   gulp.src('./src/img/*')
            .pipe(plumber())
            .pipe(changed('./dist/img'))
            .pipe(imagemin())
            .pipe(gulp.dest('dist/img'))
            .pipe(browserSync.reload({
                stream: true
            }));
});


/**
	* 复制移动js类库
	* 项目中不想被打包和编译的类库复制到dist目录下
**/
gulp.task('task-copystatic', function(){
  return   gulp.src('./src/static/**/*')
            .pipe(gulp.dest('dist/static'))
});


/**
	* 复制移动css文件
	* 项目中不想被打包和编译的css文件复制到dist目录下
**/
gulp.task('task-copycss', function(){
  return   gulp.src('./src/css/**/*.css')
            .pipe(gulp.dest('dist/css/'))
});

 /**
	* 清空任务
	* 项目编译前清楚dist
**/ 
gulp.task('clean', function(){
    del.sync('dist/');
})

gulp.task('build',['clean','task-html','task-img','task-copystatic'])

gulp.task('browserSync', function(){
  browserSync.init({
    server: {
      baseDir: 'dist'
    }
  })
});
// 静态服务器 + 监听 scss/html 文件
gulp.task('dev', ['build'], function() {
	browserSync.init({
		server: "./dist"
	});
	gulp.watch('src/img/**/*', ['task-img']);
	gulp.watch('src/img/**/*').on('change', reload);
	gulp.watch('src/js/**/*.js', ['task-js']);
	gulp.watch('src/js/**/*.js').on('change', reload);
	gulp.watch('src/css/**/*.less', ['task-less']);
	gulp.watch('src/css/**/*.less').on('change', reload);
	gulp.watch('src/css/**/*.scss', ['task-scss']);
	gulp.watch('src/css/**/*.scss').on('change', reload);
	gulp.watch('src/html/**/*.html', ['task-html']);
	gulp.watch('src/html/**/*.html').on('change', reload);
	gulp.watch('src/components/**.html', ['task-html']);
	gulp.watch('src/components/**.html').on('change', reload);

});


gulp.task('default',['build'])








