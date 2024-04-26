// native file, if you want edit it, remove the "native" suffix from the filename

import cp from "child_process"
import util from "util"
import * as ge from "ghom-eval"
import * as app from "#app"

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
      name: "information",
      flag: "i",
      description: "Information about output",
    },
  ],
  async run(message) {
    const installed = new Set<string>()

    let code = message.args.code
    let use = message.args.use

    if (message.args.use.length > 0) {
      const given = new Set<string>(message.args.use.filter((p: string) => p))

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
          } catch (error) {
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

    if (app.code.pattern.test(code)) code = code.replace(app.code.pattern, "$2")

    if (code.split("\n").length === 1 && !/const|let|return/.test(code)) {
      code = "return " + code
    }

    const req = Object.fromEntries(
      await Promise.all(
        [...installed].map(async (pack) => [pack, await import(pack)]),
      ),
    )

    const evaluated = await ge.evaluate(
      code,
      { message, app, req },
      "{ message, app, req }",
    )

    if (message.args.muted) {
      await message.channel.send(
        `\\✔ successfully evaluated in ${evaluated.duration}ms`,
      )
    } else {
      const systemMessageOptions: Partial<app.SystemMessageOptions> = {
        title: `Result of JS evaluation ${evaluated.failed ? "(failed)" : ""}`,
        description: await app.code.stringify({
          content: evaluated.output.slice(0, 2000).replace(/```/g, "\\`\\`\\`"),
          lang: "js",
        }),
      }

      if (message.args.information)
        systemMessageOptions.fields = [
          {
            name: "Information",
            value: await app.code.stringify({
              content: `type: ${evaluated.type}\nclass: ${evaluated.class}\nduration: ${evaluated.duration}ms`,
              lang: "yaml",
            }),
            inline: true,
          },
        ]

      await message.channel.send(
        await app.getSystemMessage(
          evaluated.failed ? "error" : "success",
          systemMessageOptions,
        ),
      )
    }

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
      } catch (error) {
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
