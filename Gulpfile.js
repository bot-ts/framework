const gulp = require("gulp")
const esbuild = require("gulp-esbuild")
const del = require("del")

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

exports.clean = clean
exports.build = build
exports.cleanAndBuild = gulp.series(clean, build)