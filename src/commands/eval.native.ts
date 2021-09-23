import evaluate from "ghom-eval"
import cp from "child_process"
import fs from "fs"
import util from "util"
import * as app from "../app.js"

const exec = util.promisify(cp.exec)

const packageJson = app.fetchPackageJson()

const alreadyInstalled = (pack: string): boolean =>
  packageJson.dependencies.hasOwnProperty(pack) ||
  packageJson.devDependencies.hasOwnProperty(pack)

export default new app.Command({
  name: "eval",
  description: "JS code evaluator",
  channelType: "all",
  botOwnerOnly: true,
  aliases: ["js", "code", "run", "="],
  rest: {
    name: "code",
    description: "The evaluated code",
    required: true,
  },
  options: [
    {
      name: "packages",
      aliases: ["use", "u", "req", "require", "import", "i"],
      castValue: "array",
      description: "NPM packages I want to includes in my code",
    },
  ],
  flags: [
    {
      name: "muted",
      aliases: ["mute", "silent"],
      flag: "m",
      description: "Disable message feedback",
    },
    {
      name: "information",
      aliases: ["info", "detail", "more"],
      flag: "i",
      description: "Information about output",
    },
  ],
  async run(message) {
    const installed = new Set<string>()

    let code = message.args.code

    if (message.args.packages.length > 0) {
      const given = new Set<string>(
        message.args.packages.filter((p: string) => p)
      )

      for (const pack of given) {
        if (alreadyInstalled(pack)) {
          await message.channel.send(`\\✔ **${pack}** - installed`)

          installed.add(pack)
        } else {
          let log

          try {
            log = await message.channel.send(`\\⏳ **${pack}** - install...`)
            await exec(`npm i ${pack}@latest`)
            await log.edit(`\\✔ **${pack}** - installed`)
            installed.add(pack)
          } catch (error) {
            if (log) await log.edit(`\\❌ **${pack}** - error`)
            else await message.channel.send(`\\❌ **${pack}** - error`)
          }
        }
      }
    }

    if (app.code.pattern.test(code)) code = code.replace(app.code.pattern, "$2")

    if (code.split("\n").length === 1 && !/const|let|return/.test(code)) {
      code = "return " + code
    }

    const req = Object.fromEntries(
      await Promise.all(
        [...installed].map(async (pack) => [pack, await import(pack)])
      )
    )

    const evaluated = await evaluate(
      code,
      { message, app, req },
      "{ message, app, req }"
    )

    if (message.args.muted) {
      await message.channel.send(
        `\\✔ successfully evaluated in ${evaluated.duration}ms`
      )
    } else {
      const embed = new app.MessageEmbed()
        .setColor(evaluated.failed ? "RED" : "BLURPLE")
        .setTitle(
          `${evaluated.failed ? "\\❌" : "\\✔"} Result of JS evaluation ${
            evaluated.failed ? "(failed)" : ""
          }`
        )
        .setDescription(
          app.code.stringify({
            content: evaluated.output
              .slice(0, 2000)
              .replace(/```/g, "\\`\\`\\`"),
            lang: "js",
          })
        )

      if (message.args.information)
        embed.addField(
          "Information",
          app.code.stringify({
            content: `type: ${evaluated.type}\nclass: ${evaluated.class}\nduration: ${evaluated.duration}ms`,
            lang: "yaml",
          })
        )
      await message.channel.send({ embeds: [embed] })
    }

    let somePackagesRemoved = false

    for (const pack of installed) {
      if (alreadyInstalled(pack)) continue

      somePackagesRemoved = true

      let log

      try {
        log = await message.channel.send(`\\⏳ **${pack}** - uninstall...`)
        await exec(`npm remove --purge ${pack}`)
        await log.edit(`\\✔ **${pack}** - uninstalled`)
      } catch (error) {
        if (log) await log.edit(`\\❌ **${pack}** - error`)
        else await message.channel.send(`\\❌ **${pack}** - error`)
      }
    }

    if (somePackagesRemoved)
      return message.channel.send(`\\✔ process completed`)
  },
})
