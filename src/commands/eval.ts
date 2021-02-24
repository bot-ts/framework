import discordEval from "discord-eval.ts"
import cp from "child_process"
import util from "util"
import * as app from "../app"

const exec = util.promisify(cp.exec)

const packageJson = require(app.rootPath("package.json"))

const alreadyInstalled = (pack: string): boolean =>
  packageJson.dependencies.hasOwnProperty(pack) ||
  packageJson.devDependencies.hasOwnProperty(pack)

const command: app.Command = {
  name: "eval",
  botOwner: true,
  aliases: ["js", "code", "run", "="],
  description: "JS code evaluator",
  args: [
    {
      name: "packages",
      aliases: ["use", "u", "req", "require", "import", "i"],
      castValue: "array",
      description: "NPM packages I want to includes in my code",
    },
    {
      flag: "m",
      name: "muted",
      aliases: ["mute", "silent"],
      isFlag: true,
      description: "Disable message feedback",
    },
  ],
  async run(message) {
    const installed = new Set<string>()

    if (message.args.packages.length > 0) {
      const given = new Set<string>(
        message.args.packages.filter((p: string) => p)
      )

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

    if (app.CODE.pattern.test(message.rest))
      message.rest = message.rest.replace(app.CODE.pattern, "$2")

    if (
      message.rest.split("\n").length === 1 &&
      !/const|let|return/.test(message.rest)
    ) {
      message.rest = "return " + message.rest
    }

    message.rest = `
      ${
        message.rest.includes("app")
          ? 'const _path = require("path");const _root = process.cwd();const _app_path = _path.join(_root, "dist", "app.js");const app = require(_app_path);'
          : ""
      } ${
      message.args.packages.length > 0
        ? `const req = {${[...installed]
            .map((pack) => `"${pack}": require("${pack}")`)
            .join(", ")}};`
        : ""
    } ${message.rest}`

    await discordEval(message.rest, message, message.args.muted)

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
