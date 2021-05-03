const gulp = require("gulp")
const esbuild = require("gulp-esbuild")
const del = require("del")

const cp = require("child_process")

function cleanDist() {
  return del(["dist/**/*"])
}

function cleanTemp() {
  return del(["temp/**/*"])
}

function downloadTemp(cb) {
  cp.exec("git clone https://github.com/CamilleAbella/bot.ts.git temp", cb)
}

function build(){
  return gulp.src("src/**/*.ts")
    .pipe(esbuild({
      sourcemap: "inline",
      format: "cjs",
      target: "node12",
      loader: {
        ".ts": "ts"
      }
    }))
    .pipe(gulp.dest("dist"))
}

function watch(cb) {
  cp.exec("nodemon dist/index", cb)
  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(cleanDist, build))
}

function update() {
  return gulp.series(
    cleanTemp,
    downloadTemp,
    gulp.src([
      "temp/src/app/*.ts",
      "temp/src/commands/*.native.ts",
      "temp/src/listeners/*.native.ts",
      "temp/src/app.native.ts",
      "temp/src/index.ts",
      "temp/.gitignore",
      "temp/Gulpfile.js",
      "temp/tsconfig.json"
    ]).pipe(gulp.dest(".")),
    cleanTemp
  )
}

exports.build = gulp.series(cleanDist, build)
exports.watch = gulp.series(cleanDist, build, watch)
exports.update = update