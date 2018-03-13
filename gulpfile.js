"use strict";

// Global
const gulp = require("gulp");
const plumber = require("gulp-plumber");
const rimraf = require("rimraf");
const rename = require("gulp-rename");
const htmlmin = require("gulp-htmlmin");
const fileinclude = require("gulp-file-include");
const inlinesource = require("gulp-inline-source");
const runSequence = require("run-sequence");
const cheerio = require("gulp-cheerio");
const gulpIf = require("gulp-if");
const server = require("browser-sync").create();

// SVG, PNG, JPG, WEBP
const imagemin = require("gulp-imagemin");
const sourcemaps = require("gulp-sourcemaps");
const svgmin = require("gulp-svgmin");
const svgstore = require("gulp-svgstore");
const webp = require("gulp-webp");

// JS
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");

// CSS
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const minify = require("gulp-csso");
const csscomb = require("gulp-csscomb");

const isProduction = process.env.NODE_ENV == "production";

var path = {
  src: { //Пути откуда брать исходники
    html: ["src/**/*.html", "!src/_blocks/**/*.html"],
    js: ["src/_blocks/**/*.js", "!src/_blocks/**/jq-*.js"],
    jsJq: "src/_blocks/**/jq-*.js",
    plagjs: "src/js/*.js",
    css: "src/scss/main.scss",
    cssCases: "src/_blocks/cases/**/main.scss",
    img: "src/img/_blocks/**/*.{png,jpg,gif,webp}",
    imgWebp: "src/img/_blocks/**/*.{webp}",
    blocksvg: "src/img/_blocks/**/*.svg",
    fonts: ["src/fonts/**/*.*", "!src/fonts/**/*.scss"],
    favicon: "src/img/favicon/*",
    sprite: "src/img/sprite/*",
    svg: "src/img/svg/*.svg",
    webmanifest: "src/*.webmanifest.json"
  },
  watch: {
    html: "src/**/*.html",
    js: "src/**/*.js",
    css: "src/**/*.scss",
    fonts: "src/fonts/**/*.*"
  },
  build: {
    html: "build/",
    pages: "build/*.html",
    serverRoot: "./build/",
    js: "build/js/",
    css: "build/css/",
    img: "build/img/",
    fonts: "build/fonts/",
    favicon: "build/img/favicon/",
    sprite: "build/img/sprite/",
    svgSprite: "build/img/svg",
    webmanifest: "build/"
  },
  clean: "./build",
};

//  Таск для чистки папки build
gulp.task("clean", function (cb) {
  return rimraf(path.clean, cb);
});
//-----------------------------------

// Таск для генерации изображений в формате webp
gulp.task("webp", function(){
  return gulp.src("src/img/_blocks/**/*.{png,jpg}")
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest("src/img/_blocks/"));
});
//-----------------------------------

// Таск для склеивания SVG-спраита
gulp.task("symbols", function () {
  return gulp.src(path.src.svg)
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(cheerio({
      run: function ($) {
        $("svg").attr("style", "display:none");
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(rename("symbols.svg"))
    .pipe(gulp.dest(path.build.svgSprite))
    .pipe(server.reload({stream: true}));
});
//------------------------------------

// Таск для вставки ресурсов инлайн в html
gulp.task("inlinesource", function () {
  var options = {
      compress: false
    };

  return gulp.src(path.build.pages)
      .pipe(inlinesource(options))
      .pipe(gulp.dest(path.build.html));
});
//-------------------------------------

//Копируем шрифты
gulp.task("fonts", function () {
  return gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts))
    .pipe(server.reload({stream: true}));
});
//-------------------------------------

//Копируем svg, которые размещены в папке img/_blocks
gulp.task("blocksvg", function () {
  return gulp.src(path.src.blocksvg)
    .pipe(gulpIf(isProduction, svgmin()))
    .pipe(gulp.dest(path.build.img))
    .pipe(server.reload({stream: true}));
});
//-------------------------------------

//Копируем фавиконы
gulp.task("copyfavicon", function () {
  return gulp.src(path.src.favicon)
    .pipe(gulp.dest(path.build.favicon))
    .pipe(server.reload({stream: true}));
});
//-------------------------------------

//Копируем webmanifest
gulp.task("copywebmanifest", function () {
  return gulp.src(path.src.webmanifest)
    .pipe(gulp.dest(path.build.webmanifest))
    .pipe(server.reload({stream: true}));
});
//-------------------------------------

//Копируем спраиты
gulp.task("copysprite", function () {
  return gulp.src(path.src.sprite)
    .pipe(gulp.dest(path.build.sprite))
    .pipe(server.reload({stream: true}));
});
//-------------------------------------

// таск для копирования js для сторонних плагинов
gulp.task("copyjs", function () {
  return gulp.src(path.src.plagjs)
    .pipe(gulp.dest(path.build.js))
    .pipe(server.reload({stream: true}));
});
//------------------------------------

// Таск для инклудов html
gulp.task("fileinclude", function() {
  gulp.src(path.src.html)
    .pipe(fileinclude({
      prefix: "@@",
      basepath: "@file"
    }))
    .pipe(gulpIf(isProduction, htmlmin({ collapseWhitespace: true })))
    .pipe(gulp.dest(path.build.html))
    .pipe(server.reload({stream: true}));
});
//---------------------------------------

// Таск для работы с css
gulp.task("style", function () {
  gulp.src(path.src.css)
    .pipe(plumber())
    .pipe(gulpIf(isProduction, csscomb()))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulpIf(isProduction, minify()))
    .pipe(gulp.dest(path.build.css))
    .pipe(server.reload({stream: true}));
});
//------------------------------------

// Таск для работы с css
gulp.task("styleCases", function () {
  gulp.src(path.src.cssCases)
    .pipe(plumber())
    .pipe(gulpIf(isProduction, csscomb()))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulpIf(isProduction, minify()))
    .pipe(rename(function(path) {
      path.basename = path.dirname;
      path.dirname = "cases";
    }))
    .pipe(gulp.dest(path.build.css))
    .pipe(server.reload({stream: true}));
});
//------------------------------------

// Таск для сбора JS в один файл
gulp.task("scripts", function() {
  return gulp.src(path.src.js)
    .pipe(babel({
      presets: ["env"]
    }))
    .pipe(concat("script.js"))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(gulp.dest(path.build.js))
    .pipe(server.reload({stream: true}));
});
//--------------------------------------

// Таск для сбора JQuery в один файл
gulp.task("scriptsJq", function() {
  return gulp.src(path.src.jsJq)
    .pipe(babel({
      presets: ["env"]
    }))
    .pipe(concat("jq-script.js"))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(gulp.dest(path.build.js))
    .pipe(server.reload({stream: true}));
});
//--------------------------------------

//Таск для работы с изображениями
gulp.task("image", function () {
  return gulp.src(path.src.img)
    .pipe(gulpIf(isProduction, imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ])))
    .pipe(gulp.dest(path.build.img))
    .pipe(server.reload({stream: true}));
});
//---------------------------------------

//Таск для работы с изображениями (build)
gulp.task("image:webp", function () {
  return gulp.src(path.src.imgWebp)
    .pipe(gulp.dest(path.build.img));
});

// Сервер
gulp.task("serve", function () {
  server.init({
    server: "build",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
});
//----------------------------------------

//Отследим изменения в файлах
gulp.task("watcher", function () {
  gulp.watch(path.src.img, ["image"]);
  gulp.watch(path.watch.html, ["fileinclude"]);
  gulp.watch(path.watch.js, ["scripts"]);
  gulp.watch(path.watch.js, ["scriptsJq"]);
  gulp.watch(path.watch.plagjs, ["copyjs"]);
  gulp.watch(path.watch.css, ["style"]);
  gulp.watch(path.watch.css, ["styleCases"]);
  gulp.watch(path.watch.fonts, ["fonts"]);
  gulp.watch(path.src.favicon, ["copyfavicon"]);
  gulp.watch(path.src.webmanifest, ["copywebmanifest"]);
  gulp.watch(path.src.blocksvg, ["blocksvg:build"]);
  gulp.watch(path.src.sprite, ["copysprite"]);
});
//---------------------------------------

// Build
gulp.task("build", function (callback) {
  runSequence("clean",
    "symbols",
    [
    "image",
    "fileinclude",
    "style",
    "styleCases",
    "scripts",
    "scriptsJq",
    "fonts",
    "copyjs",
    "copyfavicon",
    "blocksvg",
    "copysprite",
    "copywebmanifest"
    ],
    "serve",
    "watcher",
    callback);
});
