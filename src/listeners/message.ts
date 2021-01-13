import * as app from "../app"
import yargsParser from "yargs-parser"

const listener: app.Listener<"message"> = {
  event: "message",
  async call(message) {
    if (!app.isCommandMessage(message)) return

    const prefix = app.prefix(message.guild)

    if (message.content.startsWith(prefix)) {
      message.content = message.content.slice(prefix.length)
    } else {
      return
    }

    let key = message.content.split(/\s+/)[0]
    let cmd = app.commands.resolve(key)

    if (!cmd) return null

    {
      let cursor = 0
      let depth = 0

      while (cmd.subs && cursor < cmd.subs.length) {
        const subKey = message.content.split(/\s+/)[depth + 1]

        for (const sub of cmd.subs) {
          if (sub.name === subKey) {
            key += ` ${subKey}`
            cursor = 0
            cmd = sub
            depth++
            break
          }
          cursor++
        }
      }
    }

    if (cmd.botOwner) {
      if (process.env.OWNER !== message.member.id) {
        return await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be my owner.",
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    if (cmd.guildOwner) {
      if (message.guild.owner !== message.member) {
        return await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be the guild owner.",
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    message.content = message.content.slice(key.length).trim()
    message.args = yargsParser(message.content)

    if (cmd.args) {
      for (const arg of cmd.args) {
        const value = () => message.args[arg.name]

        if (arg.required) {
          let given = message.args.hasOwnProperty(arg.name)

          if (!given && arg.alias)
            given = message.args.hasOwnProperty(arg.alias)

          if (!given)
            return await message.channel.send(
              new app.MessageEmbed()
                .setColor("RED")
                .setAuthor(
                  `Missing argument "${arg.name}"`,
                  message.client.user?.displayAvatarURL()
                )
                .setDescription(
                  arg.description
                    ? "Description: " + arg.description
                    : `Exemple: \`--${arg.name}=someValue\``
                )
            )
        }

        if (arg.flag) message.args[arg.name] = !!value()
        else {
          if (arg.default && value() === undefined) {
            message.args[arg.name] = arg.default
          }

          if (arg.castValue) {
            switch (arg.castValue) {
              case "boolean":
              // todo: continue casting of boolean
              case "date":
              // todo: continue casting of date
              case "json":
              // todo: continue casting of json
              case "number":
              // todo: continue casting of number
              case "regex":
              // todo: continue casting of regex
            }
          }

          if (arg.checkValue) {
            if (!arg.checkValue.test(value())) {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Bad argument pattern "${arg.name}".`,
                    message.client.user?.displayAvatarURL()
                  )
                  .setDescription(
                    `Expected pattern: \`${arg.checkValue.source}\``
                  )
              )
            }
          }
        }
      }
    }

    try {
      await cmd.run(message)
    } catch (error) {
      message.channel
        .send(
          app.toCodeBlock(
            `Error: ${error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"}`,
            "js"
          )
        )
        .catch(console.error)
    }
  },
}

module.exports = listener
