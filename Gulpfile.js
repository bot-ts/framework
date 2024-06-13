import discord from "discord.js"
import gulp from "gulp"
import esbuild from "gulp-esbuild"
import filter from "gulp-filter"
import vinyl from "vinyl-paths"
import rename from "gulp-rename"
import replace from "gulp-replace"
import del from "del"
import log from "fancy-log"
import chalk from "chalk"
import git from "git-commit-info"
import cp from "child_process"
import path from "path"
import util from "util"
import fs from "fs"

import "dotenv/config"

import { Handler } from "@ghom/handler"
import { dirname } from "dirname-filename-esm"

const __dirname = dirname(import.meta)

function _npmInstall(cb) {
  // eslint-disable-next-line import/no-unresolved
  import("@esbuild/linux-x64")
    .then(() => cp.exec("npm i", cb))
    .catch(() => cp.exec("npm i --force", cb))
}

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
  // eslint-disable-next-line no-undef
  fetch("https://raw.githubusercontent.com/bot-ts/framework/master/Gulpfile.js")
    .then((res) => res.text())
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

        {
          // check for new dependencies in gulpfile

          // eslint-disable-next-line no-undef
          const remotePackageJSON = await fetch(
            "https://raw.githubusercontent.com/bot-ts/framework/master/package.json",
          ).then((res) => res.json())

          const localPackageJSON = JSON.parse(
            await fs.promises.readFile(
              path.join(__dirname, "package.json"),
              "utf8",
            ),
          )

          const gulpDevDependencies = Object.entries(
            remotePackageJSON.devDependencies,
          )

          let packageJSONUpdated = false

          for (const [name, version] of gulpDevDependencies) {
            if (remote.includes(`"${name}"`) && !local.includes(`"${name}"`)) {
              log(
                `Added    '${chalk.cyan(name)}' [${chalk.blueBright(version)}]`,
              )

              localPackageJSON.devDependencies[name] = version
              packageJSONUpdated = true
            }
          }

          if (packageJSONUpdated) {
            await fs.promises.writeFile(
              path.join(__dirname, "package.json"),
              JSON.stringify(localPackageJSON, null, 2),
              "utf8",
            )

            await new Promise((resolve) => _npmInstall(resolve))
          }
        }

        log(
          `${chalk.red("Gulpfile updated!")} Please re-run the ${chalk.cyan(
            "update",
          )} command.`,
        )

        // eslint-disable-next-line no-undef
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
    .pipe(
      replace(/((?:import|export) .*? from\s+['"].*?)\.ts(['"])/g, "$1.js$2"),
    )
    .pipe(gulp.dest("dist"))
}

function _copyKeepers() {
  return gulp.src(["src/**/.keep"], { base: "src" }).pipe(gulp.dest("dist"))
}

function _watch(cb) {
  const spawn = cp.spawn("nodemon dist/index --delay 1", { shell: true })

  spawn.stdout.on("data", (data) => {
    // eslint-disable-next-line no-undef
    console.log(`${data}`.trim())
  })

  spawn.stderr.on("data", (data) => {
    // eslint-disable-next-line no-undef
    console.error(`${data}`.trim())
  })

  spawn.on("close", () => cb())

  gulp.watch("src/**/*.ts", { delay: 500 }, gulp.series(_cleanDist, _build))
}

function _overrideNativeFiles() {
  return gulp
    .src(
      [
        "temp/src/app/*.ts",
        "temp/**/*.native.ts",
        "temp/src/index.ts",
        "temp/.gitattributes",
        "temp/.gitignore",
        "temp/.eslintrc.json",
        "temp/.github/workflows/**/*.native.*",
        "temp/template.env",
        "temp/template.md",
        "temp/tsconfig.json",
        "temp/tests/**/*.js",
        "temp/templates/*",
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

function _updatePackageJSON(cb) {
  const localPackageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"))
  const remotePackageJSON = JSON.parse(
    fs.readFileSync("./temp/package.json", "utf8"),
  )

  localPackageJSON.main = remotePackageJSON.main
  localPackageJSON.type = remotePackageJSON.type
  localPackageJSON.version = remotePackageJSON.version

  localPackageJSON.engines = {
    ...localPackageJSON.engines,
    ...remotePackageJSON.engines,
  }

  localPackageJSON.scripts = {
    ...localPackageJSON.scripts,
    ...remotePackageJSON.scripts,
  }

  localPackageJSON.imports = {
    ...localPackageJSON.imports,
    ...remotePackageJSON.imports,
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

  _npmInstall(cb)
}

function _updateDatabaseFile() {
  const packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"))
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )
  return gulp
    .src("templates/" + database)
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
  /* eslint-disable @typescript-eslint/no-unused-vars */

  const client = new discord.Client({
    intents: [],
  })

  // eslint-disable-next-line no-undef
  await client.login(process.env.BOT_TOKEN)

  const avatar =
    client.user.displayAvatarURL({ format: "png", size: 128 }) +
    "&fit=cover&mask=circle"

  await client.destroy()

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

  const readme = template.replace(/\{\{(.+?)}}/gs, (match, key) => {
    log(`Evaluated '${chalk.cyan(key)}'`)
    return eval(key)
  })

  await fs.promises.writeFile(
    // eslint-disable-next-line no-undef
    `${process.env.BOT_MODE === "factory" ? "." : ""}readme.md`,
    readme,
    "utf8",
  )

  cb()

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const build = gulp.series(_cleanDist, _build, _copyKeepers)
export const watch = gulp.series(build, _watch)
export const readme = gulp.series(build, _generateReadme)
export const update = gulp.series(
  _checkGulpfile,
  _cleanTemp,
  _downloadTemp,
  _overrideNativeFiles,
  _copyConfig,
  _removeDuplicates,
  _updatePackageJSON,
  _updateDatabaseFile,
  _gitLog,
  _cleanTemp,
)
