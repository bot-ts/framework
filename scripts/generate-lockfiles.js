import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import url from "url"

/*global console, process*/

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.join(dirname, "..")

const lockfilesDir = path.join(rootDir, "lockfiles")

const compatibility = JSON.parse(
  fs.readFileSync(path.join(rootDir, "compatibility.json"), "utf-8"),
)

const dotenv = fs.readFileSync(path.join(rootDir, ".env"), "utf8")
const result = /PACKAGE_MANAGER="?(\w+)"?/.exec(dotenv)
const PACKAGE_MANAGER = result ? result[1] : "npm"

// Create the lockfiles directory if it doesn't exist
if (!fs.existsSync(lockfilesDir)) {
  fs.mkdirSync(lockfilesDir)
}

// Function to generate a lockfile for a given package manager
function generateLockfile(command, filename = null) {
  process.stdout.write(`Generating ${filename}...`)

  try {
    const startedAt = Date.now()

    execSync(command, {
      stdio: ["ignore", "ignore", "pipe"],
      cwd: path.join(rootDir),
    })

    const finishedAt = Date.now()

    fs.renameSync(filename, path.join(lockfilesDir, filename))

    process.stdout.write(
      `\r✅ Successfuly generated ${filename} in ${Math.floor(
        (finishedAt - startedAt) / 1000,
      )} seconds\n`,
    )
  } catch (error) {
    process.stdout.write(`\r❌ Error generating ${filename}:`, error, "\n")
  }
}

Object.keys(compatibility.components.lockfile).forEach((key) => {
  generateLockfile(
    compatibility.components["install-all"][key],
    compatibility.components.lockfile[key],
  )
})

// Copy the current package manager lockfile to the root directory
fs.copyFileSync(
  path.join(
    rootDir,
    "lockfiles",
    compatibility.components.lockfile[PACKAGE_MANAGER],
  ),
  path.join(rootDir, compatibility.components.lockfile[PACKAGE_MANAGER]),
)

console.log("✅ Successfully generated lockfiles")
