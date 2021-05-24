const gulp = require("gulp")
const esbuild = require("gulp-esbuild")
const filter = require("gulp-filter")
const vinyl = require("vinyl-paths")
const rename = require("gulp-rename")
const del = require("del")
const log = require("fancy-log")
const chalk = require("chalk")
const git = require("git-commit-info")
const cp = require("child_process")
const path = require("path")
const fs = require("fs")

function gitLog(cb) {
  const newVersion = git({ cwd: path.join(process.cwd(), "temp") })

  log(
    [
      `Updated  '${chalk.cyan("bot.ts")}'`,
      `[${chalk.blueBright(newVersion.shortCommit)}]`,
      `${newVersion.date} -`,
      `${chalk.grey(newVersion.message)}`,
    ].join(" ")
  )

  cb()
}

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
  const spawn = cp.spawn("nodemon dist/index", { shell: true })

  spawn.stdout.on("data", (data) => {
    console.log(chalk.white(`${data}`.trim()))
  })

  spawn.stderr.on("data", (data) => {
    console.error(chalk.red(`${data}`.trim()))
  })

  spawn.on("close", () => cb())

  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(cleanDist, build))
}

function copyTemp() {
  return gulp
    .src(
      [
        "temp/src/app/*.ts",
        "temp/**/*.native.ts",
        "temp/src/index.ts",
        "temp/.gitattributes",
        "temp/.gitignore",
        "temp/Gulpfile.js",
        "temp/tsconfig.json",
        "!temp/src/app/database.ts",
      ],
      { base: "temp" }
    )
    .pipe(gulp.dest(process.cwd(), { overwrite: true }))
}

function updateDependencies(cb) {
  const packageJSON = require("./package.json")
  const newPackageJSON = require("./temp/package.json")
  for (const baseKey of ["dependencies", "devDependencies"]) {
    const dependencies = packageJSON[baseKey]
    const newDependencies = newPackageJSON[baseKey]
    for (const key of Object.keys(newDependencies)) {
      if (/^(?:sqlite3|pg|mysql2)$/.test(key)) continue
      if (
        !dependencies.hasOwnProperty(key) ||
        dependencies[key] !== newDependencies[key]
      ) {
        log(
          `Updated  '${chalk.cyan(key)}' [${
            dependencies[key]
              ? `${chalk.blueBright(dependencies[key])} => ${chalk.blueBright(
                  newDependencies[key]
                )}`
              : chalk.blueBright(newDependencies[key])
          }]`
        )
        dependencies[key] = newDependencies[key]
      }
    }
  }

  if (fs.existsSync("./package-lock.json")) fs.unlinkSync("./package-lock.json")

  fs.writeFileSync(
    "./package.json",
    JSON.stringify(packageJSON, null, 2),
    "utf8"
  )

  cp.exec("npm i", cb)
}

function updateDatabaseFile() {
  const packageJSON = require("./package.json")
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies
  )
  return gulp
    .src("node_modules/make-bot.ts/templates/" + database)
    .pipe(rename("database.ts"))
    .pipe(gulp.dest("src/app"))
}

function removeDuplicates() {
  return gulp
    .src(["src/**/*.native.ts", "!src/app.native.ts"])
    .pipe(
      filter((file) =>
        fs.existsSync(
          path.join(file.dirname, file.basename.replace("native.ts", "ts"))
        )
      )
    )
    .pipe(vinyl(del))
}

exports.build = gulp.series(cleanDist, build)
exports.watch = gulp.series(cleanDist, build, watch)
exports.update = gulp.series(
  cleanTemp,
  downloadTemp,
  copyTemp,
  removeDuplicates,
  updateDependencies,
  updateDatabaseFile,
  gitLog,
  cleanTemp
)
