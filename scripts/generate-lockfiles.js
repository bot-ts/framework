import { execSync } from "child_process"
import fs from "fs"

/*global console, process*/

const lockfilesDir = "./lockfiles"

// Create the lockfiles directory if it doesn't exist
if (!fs.existsSync(lockfilesDir)) {
  fs.mkdirSync(lockfilesDir)
}

// Function to generate a lockfile for a given package manager
function generateLockfile(command, filename = null) {
  process.stdout.write(`Generating lockfile for ${filename}...`)

  try {
    const startedAt = Date.now()
    execSync(command, { stdio: "ignore" })
    const finishedAt = Date.now()
    fs.renameSync(filename, `${lockfilesDir}/${filename}`)
    process.stdout.write(
      `\r✅ Successfuly generated ${filename} in ${Math.floor(
        (finishedAt - startedAt) / 1000,
      )} seconds\n`,
    )
  } catch (error) {
    process.stdout.write(`\r❌ Error generating ${filename}:`, error, "\n")
  }
}

// Generate lockfiles for each package manager
generateLockfile("npm install", "package-lock.json")
generateLockfile("yarn install", "yarn.lock")
generateLockfile("pnpm install --lockfile-only", "pnpm-lock.yaml")

// Copy the package-lock.json file to the root directory
fs.copyFileSync("./lockfiles/package-lock.json", "./package-lock.json")

console.log("All lockfiles have been generated successfully.")
