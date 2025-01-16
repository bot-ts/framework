import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.join(__dirname, "..", "src")
const destDir = path.join(__dirname, "..", "dist")

function copyKeepFiles(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const files = fs.readdirSync(src, { withFileTypes: true })

  files.forEach((file) => {
    const srcPath = path.join(src, file.name)
    const destPath = path.join(dest, file.name)

    if (file.isDirectory()) {
      copyKeepFiles(srcPath, destPath)
    } else if (file.name === ".keep") {
      fs.copyFileSync(srcPath, destPath)
    }
  })
}

copyKeepFiles(srcDir, destDir)
