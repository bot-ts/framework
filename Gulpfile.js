import fetch from "axios"
import gulp from "gulp"
import esbuild from "gulp-esbuild"
import filter from "gulp-filter"
import vinyl from "vinyl-paths"
import rename from "gulp-rename"
import del from "del"
import log from "fancy-log"
import chalk from "chalk"
import git from "git-commit-info"
import cp from "child_process"
import path from "path"
import fs from "fs"

import { Handler } from "@ghom/handler"
import { dirname } from "dirname-filename-esm"

const __dirname = dirname(import.meta)

function _gitLog(cb) {
  const newVersion = git({ cwd: path.join(__dirname, "temp") })

  log(
    [
      `Updated  '${chalk.cyan("bot.ts")}'`,
      `[${chalk.blueBright(newVersion.shortCommit)}]`,
      `${newVersion.date} -`,
      `${chalk.grey(newVersion.message)}`,
    ].join(" "),
  )

  cb()
}

function _cleanDist() {
  return del(["dist/**/*"])
}

function _cleanTemp() {
  return del(["temp"], { force: true })
}

function _checkGulpfile(cb) {
  fetch("https://raw.githubusercontent.com/bot-ts/framework/master/Gulpfile.js")
    .then((res) => res.data)
    .then(async (remote) => {
      const local = await fs.promises.readFile(
        path.join(__dirname, "Gulpfile.js"),
        "utf8",
      )

      if (remote !== local) {
        await fs.promises.writeFile(
          path.join(__dirname, "Gulpfile.js"),
          remote,
          "utf8",
        )

        log(
          `${chalk.red("Gulpfile updated!")} Please re-run the ${chalk.cyan(
            "update",
          )} command.`,
        )

        process.exit(0)
      } else cb()
    })
    .catch(cb)
}

function _downloadTemp(cb) {
  cp.exec("git clone https://github.com/bot-ts/framework.git temp", cb)
}

function _build() {
  return gulp
    .src("src/**/*.ts")
    .pipe(
      esbuild({
        sourcemap: "inline",
        format: "esm",
        target: "node16",
        loader: {
          ".ts": "ts",
        },
      }),
    )
    .pipe(gulp.dest("dist"))
}

function _copyKeepers() {
  return gulp.src(["src/**/.keep"], { base: "src" }).pipe(gulp.dest("dist"))
}

function _watch(cb) {
  const spawn = cp.spawn("nodemon dist/index --delay 1", { shell: true })

  spawn.stdout.on("data", (data) => {
    console.log(`${data}`.trim())
  })

  spawn.stderr.on("data", (data) => {
    console.error(`${data}`.trim())
  })

  spawn.on("close", () => cb())

  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(_cleanDist, _build))
}

function _copyTemp() {
  return gulp
    .src(
      [
        "temp/src/app/*.ts",
        "temp/**/*.native.ts",
        "temp/src/index.ts",
        "temp/.gitattributes",
        "temp/.gitignore",
        "temp/.github/workflows/**/*.native.*",
        "temp/template.env",
        "temp/tsconfig.json",
        "temp/tests/**/*.js",
        "!temp/src/app/database.ts",
      ],
      { base: "temp" },
    )
    .pipe(gulp.dest(__dirname, { overwrite: true }))
}

function _copyConfig() {
  return gulp
    .src(["temp/src/config.ts"], { base: "temp" })
    .pipe(gulp.dest(__dirname, { overwrite: false }))
}

function _updateDependencies(cb) {
  const localPackageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"))
  const remotePackageJSON = JSON.parse(
    fs.readFileSync("./temp/package.json", "utf8"),
  )

  localPackageJSON.main = remotePackageJSON.main
  localPackageJSON.version = remotePackageJSON.version

  localPackageJSON.engines = {
    ...localPackageJSON.engines,
    ...remotePackageJSON.engines,
  }

  localPackageJSON.scripts = {
    ...localPackageJSON.scripts,
    ...remotePackageJSON.scripts,
  }

  for (const baseKey of ["dependencies", "devDependencies"]) {
    const dependencies = localPackageJSON[baseKey]
    const newDependencies = remotePackageJSON[baseKey]
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
                  newDependencies[key],
                )}`
              : chalk.blueBright(newDependencies[key])
          }]`,
        )
        dependencies[key] = newDependencies[key]
      }
    }
  }

  if (fs.existsSync("./package-lock.json")) fs.unlinkSync("./package-lock.json")

  fs.writeFileSync(
    "./package.json",
    JSON.stringify(localPackageJSON, null, 2),
    "utf8",
  )

  import("@esbuild/linux-x64")
    .then(() => cp.exec("npm i", cb))
    .catch((err) => cp.exec("npm i --force", cb))
}

function _updateDatabaseFile() {
  const packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"))
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )
  return gulp
    .src("node_modules/@ghom/bot.ts-cli/templates/" + database)
    .pipe(rename("database.ts"))
    .pipe(gulp.dest("src/app"))
}

function _removeDuplicates() {
  return gulp
    .src([
      "src/**/*.native.ts",
      "!src/app.native.ts",
      "temp/.github/workflows/**/*.native.*",
    ])
    .pipe(
      filter((file) =>
        fs.existsSync(
          path.join(
            file.dirname,
            file.basename.replace(".native" + file.extname, file.extname),
          ),
        ),
      ),
    )
    .pipe(vinyl(del))
}

async function _generateReadme(cb) {
  const packageJSON = JSON.parse(
    await fs.promises.readFile("./package.json", "utf8"),
  )
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )
  const configFile = await fs.promises.readFile("./src/config.ts", "utf8")
  const template = await fs.promises.readFile("./template.md", "utf8")

  const handle = async (dirname) => {
    const handler = new Handler(path.join(__dirname, "dist", dirname), {
      pattern: /\.js$/i,
      loader: async (filepath) => {
        return (await import(`file://${filepath}`)).default
      },
    })

    await handler.init()

    return handler.elements
  }

  const slash = await handle("slash")
  const commands = await handle("commands")
  const listeners = await handle("listeners")
  const namespaces = await handle("namespaces")
  const tables = await handle("tables")

  const readme = template.replace(/\{\{(.+?)}}/g, (match, key) => {
    log(`Evaluated '${chalk.cyan(key)}'`)
    return eval(key)
  })

  console.log(readme)

  cb()
}

export const build = gulp.series(_cleanDist, _build, _copyKeepers)
export const watch = gulp.series(build, _watch)
export const readme = gulp.series(build, _generateReadme)
export const update = gulp.series(
  _checkGulpfile,
  _cleanTemp,
  _downloadTemp,
  _copyTemp,
  _copyConfig,
  _removeDuplicates,
  _updateDependencies,
  _updateDatabaseFile,
  _gitLog,
  _cleanTemp,
)
