import { Handler } from "@ghom/handler"
import discord from "discord.js"
import dotenv from "dotenv"
import ejs from "ejs"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"

/*global process, console */

const filename = url.fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = (...segments) => path.join(dirname, "..", ...segments)

dotenv.config({
  path: rootDir(".env"),
})

const client = new discord.Client({
  intents: [],
})

await client.login(process.env.BOT_TOKEN)

const avatar =
  client.user.displayAvatarURL({ format: "png", size: 128 }) +
  "&fit=cover&mask=circle"

const config = await import("../dist/config.js").then(
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
  await fs.promises.readFile(rootDir("package.json"), "utf8"),
)
const database = ["mysql2", "sqlite3", "pg"].find(
  (name) => name in packageJSON.dependencies,
)
const configFile = await fs.promises.readFile(
  rootDir("src", "config.ts"),
  "utf8",
)
const template = await fs.promises.readFile(
  rootDir("templates", "readme.ejs"),
  "utf8",
)

/**
 * @param dirname {string}
 * @return {Promise<Map<any>>}
 */
const handle = async (dirname) => {
  const handler = new Handler(rootDir("dist", dirname), {
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
        .relative(rootDir(), _path)
        .replace("dist", "src")
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
const cronJobs = await handle("cron")
const buttons = await handle("buttons")

const readme = ejs.compile(template)({
  avatar,
  invitation,
  database,
  configFile,
  slash,
  commands,
  listeners,
  namespaces,
  tables,
  cronJobs,
  buttons,
  packageJSON,
  client,
})

await fs.promises.writeFile(
  `${process.env.BOT_MODE === "factory" ? "." : ""}readme.md`,
  readme,
  "utf8",
)

console.log(`✅ Successfully generated readme.md`)
process.exit(0)
