import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import url from "url"

/*global process, console*/

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.join(dirname, "..")

dotenv.config({
  path: path.join(rootDir, ".env"),
})

const { templates, components } = JSON.parse(
  fs.readFileSync(path.join(rootDir, "compatibility.json"), "utf-8"),
)

const packageManager = process.env.PACKAGE_MANAGER || "npm"
const runtime = process.env.RUNTIME || "node"

function generateScripts() {
  const scripts = {}

  for (const [key, value] of Object.entries(templates)) {
    if (typeof value === "string") {
      scripts[key] = replaceTags(value)
    } else if (typeof value === "object") {
      scripts[key] = replaceTags(value[runtime] ?? value.default)
    }
  }

  return scripts
}

function replaceTags(template) {
  return template.replace(/{([a-z-]+)}/g, (_, tag) => {
    if ("note" in components[tag]) {
      return components[tag][runtime]
    } else {
      return components[tag][packageManager]
    }
  })
}

const generatedScripts = generateScripts()
const packageJsonPath = path.join(rootDir, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

packageJson.scripts = {
  ...packageJson.scripts,
  ...generatedScripts,
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf-8")

console.log("✅ Updated 'package.json' scripts")
