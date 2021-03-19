const gulp = require("gulp")
const esbuild = require("gulp-esbuild")

exports.build = function(){
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