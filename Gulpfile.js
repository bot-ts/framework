const gulp = require("gulp")
const esbuild = require("gulp-esbuild")
const del = require("del")
const cp = require("child_process")

function clean() {
  return del(["dist/**/*"])
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
  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(clean, build))
}

exports.build = gulp.series(clean, build)
exports.watch = gulp.series(clean, build, watch)