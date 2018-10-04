`use strict`;

// Global
const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const rimraf = require(`gulp-rimraf`);
const rename = require(`gulp-rename`);
const htmlmin = require(`gulp-htmlmin`);
const fileinclude = require(`gulp-file-include`);
const cheerio = require(`gulp-cheerio`);
const gulpIf = require(`gulp-if`);
const size = require(`gulp-size`);
const sourcemaps = require(`gulp-sourcemaps`);
const server = require(`browser-sync`).create();

// SVG, PNG, JPG, WEBP
const imagemin = require(`gulp-imagemin`);
const svgmin = require(`gulp-svgmin`);
const svgstore = require(`gulp-svgstore`);
const webp = require(`gulp-webp`);

// JS
const babel = require(`gulp-babel`);
const uglify = require(`gulp-uglify`);
const concat = require(`gulp-concat`);
const webpack = require('webpack-stream');

// CSS
const sass = require(`gulp-sass`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const cssnano = require(`gulp-cssnano`);

const isProduction = process.env.NODE_ENV === `production`;

var path = {
  src: {
    html: [`src/**/*.html`, `!src/_blocks/**/*.html`],
    js: [`src/_blocks/**/*.js`, `!src/_blocks/**/jq-*.js`],
    jsJq: `src/_blocks/**/jq-*.js`,
    jsPlugins: `src/plugins/**/*`,
    css: `src/scss/main.scss`,
    img: `src/img/_blocks/**/*.{png,jpg,gif,webp}`,
    imgWebp: `src/img/_blocks/**/*.{webp}`,
    blocksvg: `src/img/_blocks/**/*.svg`,
    fonts: [`src/fonts/**/*.*`, `!src/fonts/**/*.scss`],
    favicon: `src/img/favicon/*`,
    svg: `src/img/svg/*.svg`,
    webmanifest: `src/manifest-*.json`,
    webpack: `src/webpack/main-webpack.js`
  },
  watch: {
    html: `src/**/*.html`,
    js: [`src/**/*.js`, `!src/webpack/**/*`],
    webpack: `src/webpack/**/*`,
    css: `src/**/*.scss`,
    fonts: `src/fonts/**/*.*`
  },
  build: {
    html: `build/`,
    js: `build/js/`,
    jsPlugins: `build/plugins/`,
    css: `build/css/`,
    img: `build/img/`,
    fonts: `build/fonts/`,
    favicon: `build/img/favicon/`,
    svgSprite: `build/img/svg`,
    webmanifest: `build/`
  },
  clean: [`./build`, `./someFolder`],
};

gulp.task("clean", () => {
  return gulp.src(path.clean, {read: false})
         .pipe(rimraf());
});
//-----------------------------------

//Генерации изображений в формате webp
gulp.task(`webp`, () => {
  return gulp.src(`src/img/_blocks/**/*.{png,jpg}`)
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest(`src/img/_blocks/`));
});
//-----------------------------------

// Таск для склеивания SVG-спраита
gulp.task(`symbols`, () => {
  return gulp.src(path.src.svg)
    .pipe(svgmin())
    .pipe(svgstore({inlineSvg: true}))
    .pipe(cheerio({
      run: function($) {
        $(`svg`).attr(`style`, `display:none`);
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(rename(`symbols.svg`))
    .pipe(gulp.dest(path.build.svgSprite))
    .pipe(server.stream());
});
//------------------------------------

//Копируем шрифты
gulp.task(`fonts`, () => {
  return gulp.src(path.src.fonts)
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.fonts))
    .pipe(server.stream());
});
//-------------------------------------

//Копируем svg, которые размещены в папке img/_blocks
gulp.task(`blocksvg`, () => {
  return gulp.src(path.src.blocksvg)
    .pipe(gulpIf(isProduction, svgmin()))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.img))
    .pipe(server.stream());
});
//-------------------------------------

//Копируем фавиконы
gulp.task(`copyfavicon`, () => {
  return gulp.src(path.src.favicon)
    .pipe(gulp.dest(path.build.favicon))
    .pipe(server.stream());
});
//-------------------------------------

//Копируем webmanifest
gulp.task(`copywebmanifest`, () => {
  return gulp.src(path.src.webmanifest)
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.webmanifest))
    .pipe(server.stream());
});
//-------------------------------------

//Копируем js для сторонних плагинов
gulp.task(`pluginsJS`, () => {
  return gulp.src(path.src.jsPlugins)
    .pipe(gulp.dest(path.build.jsPlugins))
    .pipe(server.stream());
});
//------------------------------------

//Инклуд html
gulp.task(`fileinclude`, () => {
  return gulp.src(path.src.html)
    .pipe(fileinclude({
      prefix: `@@`,
      basepath: `@file`
    }))
    .pipe(gulpIf(isProduction, htmlmin({ collapseWhitespace: true })))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.html))
    .pipe(server.stream());
});
//---------------------------------------

// CSS
gulp.task(`style`, () => {
  return gulp.src(path.src.css)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulpIf(isProduction, cssnano({ discardComments: { removeAll: true } })))
    .pipe(sourcemaps.write())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.css))
    .pipe(server.stream());
});
//------------------------------------

// Таск для сбора JS в один файл
gulp.task(`scripts`, () => {
  return gulp.src(path.src.js)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: [`env`]
    }))
    .pipe(concat(`script.js`))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(sourcemaps.write())
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.js))
    .pipe(server.stream());
});
//--------------------------------------

// Таск для Webpack
gulp.task(`webpack`, () => {
  return gulp.src(path.src.webpack)
        .pipe(webpack(require(`./webpack.config.js`)))
        .pipe(rename(`main-webpack.js`))
        .pipe(size({ showFiles: true }))
        .pipe(gulp.dest(path.build.js))
        .pipe(server.stream());
});
//--------------------------------------

// Таск для сбора JQuery в один файл
gulp.task(`scriptsJq`, () => {
  return gulp.src(path.src.jsJq)
    .pipe(babel({
      presets: [`env`]
    }))
    .pipe(concat(`jq-script.js`))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(path.build.js))
    .pipe(server.stream());
});
//--------------------------------------

//Таск для работы с изображениями
gulp.task(`image`, () => {
  return gulp.src(path.src.img)
    .pipe(gulpIf(isProduction, imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ])))
    .pipe(gulp.dest(path.build.img))
    .pipe(server.stream());
});
//---------------------------------------

//Таск для работы с изображениями (build)
// gulp.task(`image:webp`, () => {
//   return gulp.src(path.src.imgWebp)
//     .pipe(gulp.dest(path.build.img));
// });

// Сервер
gulp.task(`server`, () => {
  server.init({
    server: `build`,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(path.src.img, gulp.parallel(`image`));
  gulp.watch(path.watch.html, gulp.parallel(`fileinclude`));
  gulp.watch(path.watch.js, gulp.parallel(`scripts`, `scriptsJq`));
  gulp.watch(path.watch.webpack, gulp.parallel(`webpack`));
  gulp.watch(path.src.jsPlugins, gulp.parallel(`pluginsJS`));
  gulp.watch(path.watch.css, gulp.parallel(`style`));
  gulp.watch(path.watch.fonts, gulp.parallel(`fonts`));
  gulp.watch(path.src.favicon, gulp.parallel(`copyfavicon`));
  gulp.watch(path.src.webmanifest, gulp.parallel(`copywebmanifest`));
  gulp.watch(path.src.blocksvg, gulp.parallel(`blocksvg`));
});
//----------------------------------------

// Build
gulp.task(`build`, (done) => {
  gulp.series(
    `clean`,
    `symbols`,
    gulp.parallel(
      `image`,
      `fileinclude`,
      `style`,
      `scripts`,
      `webpack`,
      `scriptsJq`,
      `fonts`,
      `pluginsJS`,
      `copyfavicon`,
      `blocksvg`,
      `copywebmanifest`
    ),
    `server`
  )();

  done();
});
