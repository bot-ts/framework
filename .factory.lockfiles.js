import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"
import os from "node:os"

/*global console, process*/

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const lockfileDir = path.join(dirname, "lockfiles")

const compatibility = JSON.parse(
  fs.readFileSync(path.join(dirname, "compatibility.json"), {
    encoding: "utf-8",
  }),
)

const dotenv = fs.readFileSync(path.join(dirname, ".env"), { encoding: "utf8" })
const result = /PACKAGE_MANAGER="?(\w+)"?/.exec(dotenv)
const PACKAGE_MANAGER = result ? result[1] : "npm"

// Create the lockfile directory if it doesn't exist
if (!fs.existsSync(lockfileDir)) {
  fs.mkdirSync(lockfileDir)
}

// Function to generate a lockfile for a given package manager without affecting node_modules
function generateLockfile(packageManager, lockfileName) {
  process.stdout.write(`Generating ${lockfileName}...`)

  try {
    const startedAt = Date.now()

    // Create a temporary directory for installation
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lockfile-gen-"))

    // Copy package.json to the temp directory
    fs.copyFileSync(
      path.join(dirname, "package.json"),
      path.join(tempDir, "package.json"),
    )

    // If package-lock.json exists and this is npm, copy it too (for faster resolution)
    if (
      packageManager === "npm" &&
      fs.existsSync(path.join(dirname, "package-lock.json"))
    ) {
      fs.copyFileSync(
        path.join(dirname, "package-lock.json"),
        path.join(tempDir, "package-lock.json"),
      )
    }

    // Execute install command in the temporary directory
    let installCommand = compatibility.components["install"][packageManager]

    execSync(installCommand, {
      stdio: ["ignore", "ignore", "pipe"],
      cwd: tempDir,
    })

    // Copy the generated lockfile to our lockfiles directory
    if (fs.existsSync(path.join(tempDir, lockfileName))) {
      fs.copyFileSync(
        path.join(tempDir, lockfileName),
        path.join(lockfileDir, lockfileName),
      )
    } else {
      throw new Error(`Lockfile ${lockfileName} was not generated`)
    }

    // Clean up the temporary directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.warn(
        `Warning: Failed to clean up temporary directory ${tempDir}: ${cleanupError.message}`,
      )
    }

    const finishedAt = Date.now()

    process.stdout.write(
      `\r✅ Successfully generated ${lockfileName} in ${Math.floor(
        (finishedAt - startedAt) / 1000,
      )} seconds\n`,
    )
  } catch (error) {
    process.stdout.write(`\r❌ Error generating ${lockfileName}: ${error}\n`)
  }
}

// Generate lockfiles for each package manager
Object.keys(compatibility.components.lockfile).forEach((packageManager) => {
  const lockfileName = compatibility.components.lockfile[packageManager]
  generateLockfile(packageManager, lockfileName)
})

// Copy the current package manager lockfile to the root directory
const currentLockfileName = compatibility.components.lockfile[PACKAGE_MANAGER]
if (fs.existsSync(path.join(lockfileDir, currentLockfileName))) {
  fs.copyFileSync(
    path.join(lockfileDir, currentLockfileName),
    path.join(dirname, currentLockfileName),
  )
  console.log(`✅ Copied ${currentLockfileName} to root directory`)
} else {
  console.error(
    `❌ Failed to find ${currentLockfileName} in the lockfiles directory`,
  )
}

console.log("✅ Successfully generated lockfiles")
