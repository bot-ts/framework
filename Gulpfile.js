const gulp = require("gulp")
const esbuild = require("gulp-esbuild")
const del = require("del")

const cp = require("child_process")
const path = require("path")

function cleanDist() {
  return del(["dist/**/*"])
}

function cleanTemp() {
  return del(["temp"], { force: true })
}

function downloadTemp(cb) {
  cp.exec("git clone https://github.com/CamilleAbella/bot.ts.git temp", cb)
}

function build() {
  return gulp
    .src("src/**/*.ts")
    .pipe(
      esbuild({
        sourcemap: "inline",
        format: "cjs",
        target: "node12",
        loader: {
          ".ts": "ts",
        },
      })
    )
    .pipe(gulp.dest("dist"))
}

function watch(cb) {
  cp.exec("nodemon dist/index", cb)
  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(cleanDist, build))
}

function copyTemp() {
  return gulp
    .src(
      [
        "temp/src/app",
        "temp/**/*.native.ts",
        "temp/src/index.ts",
        "temp/.gitignore",
        "temp/Gulpfile.js",
        "temp/tsconfig.json",
      ],
      { base: "temp" }
    )
    .pipe(gulp.dest(process.cwd(), { overwrite: true }))
}

exports.build = gulp.series(cleanDist, build)
exports.watch = gulp.series(cleanDist, build, watch)
exports.update = gulp.series(cleanTemp, downloadTemp, copyTemp, cleanTemp)
