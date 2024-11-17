import dotenv from "dotenv"
import ejs from "ejs"
import glob from "fast-glob"
import gitCommitInfo from "git-commit-info"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"

/*global process, fetch, console*/

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.join(dirname, "..")

dotenv.config({
  path: path.join(rootDir, ".env"),
})

const compatibility = JSON.parse(
  fs.readFileSync(path.join(rootDir, "compatibility.json"), "utf-8"),
)

const warnings = []

async function _checkUpdater() {
  process.stdout.write("Checking for updater updates...")

  const remote = await fetch(
    "https://raw.githubusercontent.com/bot-ts/framework/master/scripts/update-framework.js",
  ).then((res) => res.text())
  const local = await fs.promises.readFile(filename, "utf8")

  if (remote !== local) {
    process.stdout.write("\r⚠️ Updater is outdated, updating...")

    await fs.promises.writeFile(filename, remote, "utf8")

    console.log("\r✅ Updated updater")

    execSync(process.argv.join(" "), { cwd: rootDir, stdio: "inherit" })

    process.exit(0)
  } else {
    console.log("\r✅ Updater is up to date")
  }
}

async function _cleanTemp() {
  const tempPath = path.join(rootDir, "temp")

  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }

  console.log("✅ Cleaned files")
}

function _downloadTemp() {
  process.stdout.write("Downloading files...")

  execSync("git clone https://github.com/bot-ts/framework.git temp", {
    cwd: rootDir,
    stdio: "ignore",
  })

  console.log("\r✅ Downloaded files")
}

async function _overrideNativeFiles() {
  process.stdout.write("Installing new files...")

  const files = [
    "temp/src/core/*.ts",
    "temp/**/*.native.ts",
    "temp/src/index.ts",
    "temp/.gitattributes",
    "temp/.gitignore",
    "temp/Dockerfile",
    "temp/compose.yml",
    "temp/eslint.config.mjs",
    "temp/.github/workflows/tests.yml",
    "temp/template.env",
    "temp/template.md",
    "temp/tsconfig.json",
    "temp/tests/**/*.js",
    "temp/scripts/*.js",
    "temp/templates/*",
    "!temp/src/core/database.ts",
  ]

  for (const pattern of files) {
    const matches = glob.sync(pattern, { cwd: rootDir })
    for (const file of matches) {
      const dest = path.join(rootDir, file.replace("temp/", ""))
      await fs.promises.copyFile(file, dest)
    }
  }

  console.log("\r✅ Installed new files")
}

async function _copyConfig() {
  const files = glob.sync("temp/src/{config.ts,types.ts}", { cwd: rootDir })

  for (const file of files) {
    const dest = path.join(rootDir, file.replace("temp/", ""))

    if (!fs.existsSync(dest)) {
      await fs.promises.copyFile(file, dest)
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

  console.log("✅ Updated 'package.json'")
}

async function _updateDependencies() {
  process.stdout.write(
    `Updating dependencies with ${process.env.PACKAGE_MANAGER}...`,
  )

  execSync(
    compatibility.components["install-all"][process.env.PACKAGE_MANAGER],
    { cwd: rootDir, stdio: "ignore" },
  )

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
    path.join("templates", `database.ejs`),
    "utf8",
  )

  await fs.promises.writeFile(
    path.join(rootDir, "src", "core", "database.ts"),
    ejs.compile(template)({ client }),
    "utf8",
  )

  console.log(`✅ Updated 'database.ts'`)
}

async function _gitLog() {
  const newVersion = gitCommitInfo({ cwd: path.join(rootDir, "temp") })

  console.log(
    `✅ Updated 'bot.ts' [${newVersion.shortCommit}] ${newVersion.date} - ${newVersion.message}`,
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
