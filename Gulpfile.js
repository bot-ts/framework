import cp from "child_process"
import path from "path"
import util from "util"
import fs from "fs"

import "dotenv/config"

import gulp from "gulp"
import dayjs from "dayjs"

let through2, PluginError

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
  } catch (e) {
    try {
      await __install(packageName, optional, withTypes, dev)
      // eslint-disable-next-line no-undef
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

  // eslint-disable-next-line no-undef
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
  let isLinux = false

  try {
    // eslint-disable-next-line import/no-unresolved
    await import("@esbuild/linux-x64")

    isLinux = true
  } catch (err) {}

  await new Promise((resolve, reject) => {
    cp.exec(
      `npm i ${packageName} ${optional ? "--save-optional" : dev ? "-D" : ""} ${isLinux ? "" : "--force"}`,
      (err) => (err ? reject(err) : resolve()),
    )
  })

  if (withTypes) {
    await new Promise((resolve, reject) => {
      cp.exec(
        `npm i @types/${packageName.split(/\b@/)[0]} ${optional ? "--save-optional" : ""} ${isLinux ? "" : "--force"}`,
        (err) => (err ? reject(err) : resolve()),
      )
    })
  }
}

function __replace(regex, replacement) {
  return through2.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit("error", new PluginError("replace", "Streams not supported!"))
      return cb()
    }

    if (file.isBuffer()) {
      const content = file.contents.toString(enc)
      const updatedContent = content.replace(regex, replacement)
      // eslint-disable-next-line no-undef
      file.contents = Buffer.from(updatedContent, enc)
    }

    cb(null, file)
  })
}

function _npmInstall(cb) {
  __install().then(cb).catch(cb)
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

            await new Promise((resolve) => _npmInstall(resolve))
          }
        }

        log(
          `${util.styleText("red", "Gulpfile updated!")} Please re-run the ${util.styleText(
            "cyan",
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

async function _build() {
  through2 = await __importOrInstall("through2", true, true)
  PluginError = await __importOrInstall("plugin-error", true, true)
  const esbuild = await __importOrInstall("gulp-esbuild", true, true)

  // process.traceDeprecation = true
  return gulp
    .src("src/**/*.ts")
    .pipe(
      esbuild({
        sourcemap: "inline",
        format: "esm",
        target: "node20",
        loader: { ".ts": "ts" },
      }),
    )
    .pipe(
      __replace(
        /((?:import|export) .*? from\s+['"][#./].*?)\.ts(['"])/g,
        "$1.js$2",
      ),
    )
    .pipe(gulp.dest("dist"))
}

function _copyKeepers() {
  return gulp.src(["src/**/.keep"], { base: "src" }).pipe(gulp.dest("dist"))
}

async function _watch(cb) {
  await __install("nodemon", true)

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

  if (fs.existsSync("./package-lock.json")) fs.unlinkSync("./package-lock.json")

  fs.writeFileSync(
    "./package.json",
    JSON.stringify(localPackageJSON, null, 2),
    "utf8",
  )

  _npmInstall(cb)
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

  // eslint-disable-next-line no-undef
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
    // eslint-disable-next-line no-undef
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
  _updateDatabaseFile,
  _gitLog,
  _cleanTemp,
  _showWarnings,
)
