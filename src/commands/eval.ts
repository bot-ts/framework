import discordEval from "discord-eval.ts"
import cp from "child_process"
import util from "util"
import * as app from "../app"

const exec = util.promisify(cp.exec)
const regex = /--(?:install|use|add|with|npm|dep) +([a-z-_.]+)(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?(?:, ?([a-z-_.]+))?/i

const packageJson = require("../../package.json")

const alreadyInstalled = (pack: string): boolean =>
  packageJson.dependencies.hasOwnProperty(pack) ||
  packageJson.devDependencies.hasOwnProperty(pack)

const command: app.Command = {
  name: "js",
  botOwner: true,
  aliases: ["eval", "code", "run", "=", "test"],
  async run(message) {
    const match = regex.exec(message.content)
    const installed = new Set<string>()

    if (match) {
      message.content = message.content.replace(regex, "").trim()

      const given = new Set<string>(match.slice(1).filter((p) => p))

      for (const pack of given) {
        if (alreadyInstalled(pack)) {
          await message.channel.send(`✅ **${pack}** - installed`)
          installed.add(pack)
        } else {
          let log
          try {
            log = await message.channel.send(
              `<a:wait:560972897376665600> **${pack}** - install...`
            )
            await exec(`npm i ${pack}@latest`)
            await log.edit(`✅ **${pack}** - installed`)
            installed.add(pack)
          } catch (error) {
            if (log) await log.edit(`❌ **${pack}** - error`)
            else await message.channel.send(`❌ **${pack}** - error`)
          }
        }
      }
    }

    if (app.codeRegex.test(message.content))
      message.content = message.content.replace(app.codeRegex, "$1")

    if (
      message.content.split("\n").length === 1 &&
      !/const|let|return/.test(message.content)
    ) {
      message.content = "return " + message.content
    }

    message.content = `
      ${
        message.content.includes("app")
          ? 'const app = require(require("path").join(process.cwd(), "dist", "app.js"));'
          : ""
      } ${
      match
        ? `const req = {${[...installed]
            .map((pack) => `"${pack}": require("${pack}")`)
            .join(", ")}};`
        : ""
    } ${message.content}`

    await discordEval(
      message.content,
      message,
      message.content.includes("@muted")
    )

    for (const pack of installed) {
      if (alreadyInstalled(pack)) continue
      let log
      try {
        log = await message.channel.send(
          `<a:wait:560972897376665600> **${pack}** - uninstall...`
        )
        await exec(`npm remove --purge ${pack}`)
        await log.edit(`🗑️ **${pack}** - uninstalled`)
      } catch (error) {
        if (log) await log.edit(`❌ **${pack}** - error`)
        else await message.channel.send(`❌ **${pack}** - error`)
      }
    }

    return message.channel.send(`✅ process completed`)
  },
}

module.exports = command
