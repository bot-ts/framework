// native file, if you want edit it, remove the "native" suffix from the filename

import cp from "child_process"
import util from "util"
import * as discordEval from "discord-eval.ts"
import * as app from "#app"
import discord from "discord.js"

const exec = util.promisify(cp.exec)

const alreadyInstalled = (pack: string): boolean =>
  !!app.packageJSON.dependencies?.hasOwnProperty(pack) ||
  !!app.packageJSON.devDependencies?.hasOwnProperty(pack)

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
    app.option({
      name: "use",
      type: "array",
      description: "NPM packages I want to includes in my code",
      validate: (packages) => {
        return packages.length > 0
      },
      default: [],
    }),
  ],
  flags: [
    {
      name: "muted",
      flag: "m",
      description: "Disable message feedback",
      aliases: ["mute"],
    },
    {
      name: "verbose",
      flag: "v",
      aliases: ["info", "information"],
      description: "Information about output",
    },
  ],
  async run(message) {
    const installed = new Set<string>()

    const code = message.args.code
    const use = message.args.use

    if (use.length > 0) {
      const given = new Set<string>(use.filter((p: string) => p))

      for (const pack of given) {
        if (alreadyInstalled(pack)) {
          await message.channel.send(
            `${app.getSystemEmoji("success")} **${pack}** - installed`,
          )

          installed.add(pack)
        } else {
          let log

          try {
            log = await message.channel.send(
              `${app.getSystemEmoji("loading")} **${pack}** - install...`,
            )
            await exec(`npm i ${pack}@latest`)
            await log.edit(
              `${app.getSystemEmoji("success")} **${pack}** - installed`,
            )
            installed.add(pack)
          } catch {
            if (log)
              await log.edit(
                `${app.getSystemEmoji("error")} **${pack}** - error`,
              )
            else
              await message.channel.send(
                `${app.getSystemEmoji("error")} **${pack}** - error`,
              )
          }
        }
      }
    }

    const req = Object.fromEntries(
      await Promise.all(
        [...installed].map(async (pack) => [pack, await import(pack)]),
      ),
    )

    const embed = await discordEval.evaluate(
      code,
      {
        ctx: { message, app, req },
        muted: message.args.muted,
        verbose: message.args.verbose,
      },
      {
        success: new discord.EmbedBuilder().setColor(app.systemColors.success),
        error: new discord.EmbedBuilder().setColor(app.systemColors.error),
      },
    )

    await message.channel.send({
      embeds: [embed],
    })

    let somePackagesRemoved = false

    for (const pack of installed) {
      if (alreadyInstalled(pack)) continue

      somePackagesRemoved = true

      let log

      try {
        log = await message.channel.send(
          `${app.getSystemEmoji("loading")} **${pack}** - uninstall...`,
        )
        await exec(`npm remove --purge ${pack}`)
        await log.edit(
          `${app.getSystemEmoji("success")} **${pack}** - uninstalled`,
        )
      } catch {
        if (log)
          await log.edit(`${app.getSystemEmoji("error")} **${pack}** - error`)
        else
          await message.channel.send(
            `${app.getSystemEmoji("error")} **${pack}** - error`,
          )
      }
    }

    if (somePackagesRemoved)
      return message.channel.send(
        `${app.getSystemEmoji("success")} process completed`,
      )
  },
})
