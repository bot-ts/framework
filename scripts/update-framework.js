import dotenv from "dotenv"
import ejs from "ejs"
import glob from "fast-glob"
import gitCommitInfo from "git-commit-info"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"
import url from "node:url"

/*global process, fetch, console*/

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.join(dirname, "..")

dotenv.config({
  path: path.join(rootDir, ".env"),
})

if (!process.env.PACKAGE_MANAGER) process.env.PACKAGE_MANAGER = "npm"

const compatibility = JSON.parse(
  fs.readFileSync(path.join(rootDir, "compatibility.json"), "utf-8"),
)

const warnings = []

function clearLastLine() {
  readline.clearLine(process.stdout, 0)
  readline.cursorTo(process.stdout, 0)
}

async function _checkUpdater() {
  process.stdout.write("Checking for updater updates...")

  const remote = await fetch(
    "https://raw.githubusercontent.com/bot-ts/framework/master/scripts/update-framework.js",
  ).then((res) => res.text())
  const local = await fs.promises.readFile(filename, "utf8")

  if (remote !== local) {
    clearLastLine()
    process.stdout.write("⚠️ Updater is outdated, updating...")

    await fs.promises.writeFile(filename, remote, "utf8")

    clearLastLine()
    console.log("✅ Updated updater")

    execSync(process.argv.join(" "), { cwd: rootDir, stdio: "inherit" })

    process.exit(0)
  } else {
    clearLastLine()
    console.log("✅ Updater is up to date")
  }
}

async function _cleanTemp() {
  const tempPath = path.join(rootDir, "temp")

  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }

  console.log("✅ Cleaned update files")
}

function _downloadTemp() {
  process.stdout.write("Downloading files...")

  execSync("git clone https://github.com/bot-ts/framework.git temp", {
    cwd: rootDir,
    stdio: "ignore",
  })

  clearLastLine()
  console.log("✅ Downloaded update files")
}

async function _overrideNativeFiles() {
  process.stdout.write("Installing new files...")

  const files = [
    "temp/src/core/*.ts",
    "temp/**/*.native.ts",
    "temp/src/index.ts",
    "temp/src/index.test.ts",
    "temp/.gitattributes",
    "temp/.gitignore",
    "temp/Dockerfile",
    "temp/compose.yml",
    "temp/compatibility.json",
    "temp/eslint.config.mjs",
    "temp/rollup.config.mjs",
    "temp/.template.env",
    "temp/tsconfig.json",
    "temp/scripts/*.js",
    "temp/templates/*.ejs",
    "!temp/src/core/database.ts",
  ]

  for (const pattern of files) {
    const matches = glob.sync(pattern, { cwd: rootDir })

    for (const relativePath of matches) {
      const source = path.join(rootDir, relativePath)
      const dest = source.replace(path.sep + "temp" + path.sep, path.sep)

      console.log(dest)

      await fs.promises.mkdir(path.dirname(dest), { recursive: true })

      await fs.promises.copyFile(source, dest)
    }
  }

  clearLastLine()
  console.log("✅ Updated native files")
}

async function _copyConfig() {
  const files = glob.sync("temp/src/{config.ts,types.ts}", { cwd: rootDir })

  for (const relativePath of files) {
    const source = path.join(rootDir, relativePath)
    const dest = source.replace(path.sep + "temp" + path.sep, path.sep)

    if (!fs.existsSync(dest)) {
      await fs.promises.copyFile(source, dest)
    }
  }

  console.log("✅ Updated config files")
}

async function _removeDuplicates() {
  const files = glob.sync("src/**/*.native.ts", { cwd: rootDir })

  for (const file of files) {
    const dest = path.join(rootDir, file.replace(".native", ""))

    if (fs.existsSync(dest)) {
      await fs.promises.unlink(file)

      console.log(`✅ Keeped custom '${path.relative(rootDir, file)}'`)
    }
  }
}

async function _updatePackageJSON() {
  const localPackageJSON = JSON.parse(
    await fs.promises.readFile(path.join(rootDir, "package.json"), "utf8"),
  )
  const remotePackageJSON = JSON.parse(
    await fs.promises.readFile(
      path.join(rootDir, "temp", "package.json"),
      "utf8",
    ),
  )

  localPackageJSON.main = remotePackageJSON.main
  localPackageJSON.type = remotePackageJSON.type
  localPackageJSON.version = remotePackageJSON.version
  localPackageJSON.engines = remotePackageJSON.engines
  localPackageJSON.scripts = remotePackageJSON.scripts
  localPackageJSON.imports = remotePackageJSON.imports

  for (const baseKey of ["dependencies", "devDependencies"]) {
    const dependencies = localPackageJSON[baseKey]
    const newDependencies = remotePackageJSON[baseKey]
    for (const key of Object.keys(newDependencies)) {
      if (/^(?:sqlite3|pg|mysql2)$/.test(key)) continue
      if (
        !dependencies.hasOwnProperty(key) ||
        dependencies[key] !== newDependencies[key]
      ) {
        console.log(
          `Updated '${key}' [${dependencies[key] ? `${dependencies[key]} => ${newDependencies[key]}` : newDependencies[key]}]`,
        )
        dependencies[key] = newDependencies[key]
      }
    }
  }

  fs.writeFileSync(
    path.join(rootDir, "package.json"),
    JSON.stringify(localPackageJSON, null, 2),
    "utf8",
  )

  console.log("✅ Updated package.json")
}

async function _updateDependencies() {
  process.stdout.write(
    `Updating dependencies with ${process.env.PACKAGE_MANAGER}...`,
  )

  execSync(compatibility.components["install"][process.env.PACKAGE_MANAGER], {
    cwd: rootDir,
    stdio: "ignore",
  })

  clearLastLine()
  console.log("\r✅ Updated dependencies")
}

async function _updateDatabaseFile() {
  const packageJSON = JSON.parse(
    await fs.promises.readFile(path.join(rootDir, "package.json"), "utf8"),
  )

  const client = ["mysql2", "sqlite3", "pg"].find(
    (name) => name in packageJSON.dependencies,
  )

  const template = await fs.promises.readFile(
    path.join(rootDir, "templates", `database.ejs`),
    "utf8",
  )

  await fs.promises.writeFile(
    path.join(rootDir, "src", "core", "database.ts"),
    ejs.compile(template)({ client }),
    "utf8",
  )

  console.log(`✅ Updated database`)
}

async function _gitLog() {
  const newVersion = gitCommitInfo({ cwd: path.join(rootDir, "temp") })

  console.log(
    `✅ Updated bot.ts [${newVersion.shortCommit}] ${newVersion.date} - ${newVersion.message}`,
  )
}

async function _showWarnings() {
  for (const warning of warnings) {
    console.warn(`⚠️ Warning '${warning}'`)
  }
}

try {
  await _checkUpdater()
  await _cleanTemp()
  await _downloadTemp()
  await _overrideNativeFiles()
  await _copyConfig()
  await _removeDuplicates()
  await _updatePackageJSON()
  await _updateDependencies()
  await _updateDatabaseFile()
  await _gitLog()
  await _cleanTemp()
  await _showWarnings()
} catch (error) {
  await fs.promises
    .rm(path.join(rootDir, "temp"), { recursive: true, force: true })
    .catch(console.error)
  throw error
}

console.log("✅ Updated successfully")
