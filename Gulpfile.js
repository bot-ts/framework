"use strict"

/*global console, fetch, process*/

import cp from "child_process"
import fs from "fs"
import path from "path"
import util from "util"

import "dotenv/config"

import dayjs from "dayjs"
import gulp from "gulp"
import yaml from "yaml"

const pmc = yaml.parse(fs.readFileSync("pmc.yml", "utf8"))
/**
 * @type {{
 *  lockfile: string
 *  "install-all": string
 *  "install-package": string
 *  "install-dev-package": string
 *  "install-optional-package": string
 *  "install-global-package": string
 *  "install-global-dev-package": string
 *  "remove-package": string
 * }}
 */
const pm = pmc[process.env.PACKAGE_MANAGER ?? "npm"]

const log = await __importOrInstall("fancy-log", true, true)
const { dirname } = await __importOrInstall("dirname-filename-esm")

const __dirname = dirname(import.meta)

const warnings = []

async function __importOrInstall(
  packageName,
  importDefault = false,
  optional = false,
  withTypes = false,
  dev = false,
) {
  let namespace = null

  try {
    namespace = await import(packageName.split(/\b@/)[0])
  } catch {
    try {
      await __install(packageName, optional, withTypes, dev)

      console.log(
        `[${dayjs().format("HH:mm:ss")}] Added    '${util.styleText("cyan", packageName)}'`,
      )
      namespace = await import(packageName.split(/\b@/)[0])
    } catch (installError) {
      throw new Error(
        `Failed to install "${packageName}": ${installError.message}`,
      )
    }
  }

  console.log(
    `[${dayjs().format("HH:mm:ss")}] Imported '${util.styleText("cyan", packageName)}'`,
  )

  return importDefault ? namespace.default : namespace
}

async function __install(
  packageName = "",
  optional = false,
  withTypes = false,
  dev = false,
) {
  await new Promise((resolve, reject) => {
    cp.exec(
      `${
        optional
          ? pm["install-optional-package"]
          : dev
            ? pm["install-dev-package"]
            : pm["install-package"]
      } ${packageName}`,
      (err) => (err ? reject(err) : resolve()),
    )
  })

  if (withTypes) {
    await new Promise((resolve, reject) => {
      cp.exec(
        `${
          optional ? pm["install-optional-package"] : pm["install-dev-package"]
        } @types/${packageName.split(/\b@/)[0]}`,
        (err) => (err ? reject(err) : resolve()),
      )
    })
  }
}

// function __replace(regex, replacement) {
//   return through2.obj(function (file, enc, cb) {
//     if (file.isStream()) {
//       this.emit("error", new PluginError("replace", "Streams not supported!"))
//       return cb()
//     }

//     if (file.isBuffer()) {
//       const content = file.contents.toString(enc)
//       const updatedContent = content.replace(regex, replacement)

//       file.contents = Buffer.from(updatedContent, enc)
//     }

//     cb(null, file)
//   })
// }

function _updateDependencies(cb) {
  cp.exec(pm["install-all"], (err) => (err ? cb(err) : cb()))
}

async function _gitLog(cb) {
  const git = await __importOrInstall("git-commit-info", true, true)

  const newVersion = git({ cwd: path.join(__dirname, "temp") })

  log(
    [
      `Updated  '${util.styleText("cyan", "bot.ts")}'`,
      `[${util.styleText("blueBright", newVersion.shortCommit)}]`,
      `${newVersion.date} -`,
      `${util.styleText("grey", newVersion.message)}`,
    ].join(" "),
  )

  cb()
}

async function _cleanDist() {
  const del = await __importOrInstall("del@6.1.1", true, true)

  return del(["dist/**/*"])
}

async function _cleanTemp() {
  const del = await __importOrInstall("del@6.1.1", true, true)

  return del(["temp"], { force: true })
}

function _checkGulpfile(cb) {
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
                `Added    '${util.styleText("cyan", name)}' [${util.styleText("blueBright", version)}]`,
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

            await new Promise((resolve) => _updateDependencies(resolve))
          }
        }

        log(
          `${util.styleText("red", "Gulpfile updated!")} Please re-run the ${util.styleText(
            "cyan",
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

function _build(cb) {
  cp.exec(`npx rollup -c`, (err) => (err ? cb(err) : cb()))

  // __replace(
  //   /((?:import|export) .*? from\s+['"][#./].*?)\.ts(['"])/g,
  //   "$1.js$2",
  // ),
}

function _copyKeepers() {
  return gulp.src(["src/**/.keep"], { base: "src" }).pipe(gulp.dest("dist"))
}

async function _watch(cb) {
  await __install("nodemon", true)

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

function _overrideNativeFiles() {
  return gulp
    .src(
      [
        "temp/src/app/*.ts",
        "temp/**/*.native.ts",
        "temp/src/index.ts",
        "temp/.gitattributes",
        "temp/.gitignore",
        "temp/Dockerfile",
        "temp/compose.yml",
        "temp/eslint.config.mjs",
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
    .src(["temp/src/config.ts", "temp/src/types.ts"], { base: "temp" })
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
          `Updated  '${util.styleText("cyan", key)}' [${
            dependencies[key]
              ? `${util.styleText("blueBright", dependencies[key])} => ${util.styleText(
                  "blueBright",
                  newDependencies[key],
                )}`
              : util.styleText("blueBright", newDependencies[key])
          }]`,
        )
        dependencies[key] = newDependencies[key]
      }
    }
  }

  // if (fs.existsSync(`./${pm.lockfile}`)) {
  //   fs.unlinkSync(`./${pm.lockfile}`)
  // }

  fs.writeFileSync(
    "./package.json",
    JSON.stringify(localPackageJSON, null, 2),
    "utf8",
  )

  cb()
}

async function _updateDatabaseFile() {
  const rename = await __importOrInstall("gulp-rename", true, true)

  const packageJSON = JSON.parse(fs.readFileSync("./package.json", "utf8"))
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )
  return gulp
    .src("templates/" + database)
    .pipe(rename("database.ts"))
    .pipe(gulp.dest("src/app"))
}

async function _removeDuplicates() {
  const filter = await __importOrInstall("gulp-filter", true, true)
  const vinyl = await __importOrInstall("vinyl-paths", true, true)
  const del = await __importOrInstall("del@6.1.1", true, true)

  if (fs.existsSync(".eslintrc.json")) {
    fs.unlinkSync(".eslintrc.json")
  }

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

/**
 * Remove optional dependencies from node_modules
 */
async function _optimize() {
  const del = await __importOrInstall("del@6.1.1", true, true)
  const vinyl = await __importOrInstall("vinyl-paths", true, true)

  const packageJSON = JSON.parse(
    await fs.promises.readFile("./package.json", "utf8"),
  )

  const optionalDependencies = Object.keys(packageJSON.optionalDependencies)
  const devDependencies = Object.keys(packageJSON.devDependencies)

  return gulp
    .src(
      [...optionalDependencies, ...devDependencies].map(
        (name) => `node_modules/${name}`,
      ),
      { allowEmpty: true },
    )
    .pipe(vinyl(del))
}

function _showWarnings(cb) {
  for (const warning of warnings) {
    log(`Warning  ${util.styleText("red", `'${warning}'`)}`)
  }

  cb()
}

async function _generateReadme(cb) {
  const discord = await __importOrInstall("discord.js@14")
  const { Handler } = await __importOrInstall("@ghom/handler")

  /* eslint-disable @typescript-eslint/no-unused-vars */

  const client = new discord.Client({
    intents: [],
  })

  await client.login(process.env.BOT_TOKEN)

  const avatar =
    client.user.displayAvatarURL({ format: "png", size: 128 }) +
    "&fit=cover&mask=circle"

  const config = await import("./dist/config.js").then(
    (config) => config.default,
  )

  const invitation = client.application.botPublic
    ? await client.generateInvite({
        scopes: [
          discord.OAuth2Scopes.Bot,
          discord.OAuth2Scopes.ApplicationsCommands,
        ],
        permissions: config.permissions,
      })
    : null

  await client.destroy()

  const packageJSON = JSON.parse(
    await fs.promises.readFile("./package.json", "utf8"),
  )
  const database = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )
  const configFile = await fs.promises.readFile("./src/config.ts", "utf8")
  const template = await fs.promises.readFile("./template.md", "utf8")

  /**
   * @param dirname {string}
   * @return {Promise<Map<any>>}
   */
  const handle = async (dirname) => {
    const handler = new Handler(path.join(__dirname, "dist", dirname), {
      pattern: /\.js$/i,
      loader: async (filepath) => {
        return (await import(`file://${filepath}`)).default
      },
    })

    await handler.init()

    // crop all the paths from the root directory

    const output = new Map()

    for (const [_path, value] of handler.elements) {
      output.set(
        path
          .relative(__dirname, _path)
          .replace("dist", "./src")
          .replace(/\\/g, "/")
          .replace(/\.js$/, ".ts"),
        value,
      )
    }

    return output
  }

  const slash = await handle("slash")
  const commands = await handle("commands")
  const listeners = await handle("listeners")
  const namespaces = await handle("namespaces")
  const tables = await handle("tables")

  const readme = template.replace(/\{\{(.+?)}}/gs, (match, key) => {
    log(`Evaluated '${util.styleText("cyan", key)}'`)
    return eval(key)
  })

  await fs.promises.writeFile(
    `${process.env.BOT_MODE === "factory" ? "." : ""}readme.md`,
    readme,
    "utf8",
  )

  cb()

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const build = gulp.series(_cleanDist, _build, _copyKeepers)
export const final = gulp.series(build, _optimize)
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
  _updateDependencies,
  _updateDatabaseFile,
  _gitLog,
  _cleanTemp,
  _showWarnings,
)
