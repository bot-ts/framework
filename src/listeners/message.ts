import * as app from "../app"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

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
    message.args = yargsParser(message.content) as app.CommandMessage["args"]

    if (cmd.args) {
      for (const arg of cmd.args) {
        const value = () => message.args[arg.name]

        let name = arg.name

        if (arg.required) {
          let given = message.args.hasOwnProperty(arg.name)

          if (!given && arg.aliases) {
            if (typeof arg.aliases === "string") {
              name = arg.aliases
              given = message.args.hasOwnProperty(arg.aliases)
            } else {
              for (const alias of arg.aliases) {
                if (message.args.hasOwnProperty(alias)) {
                  name = alias
                  given = true
                  break
                }
              }
            }
          }

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

        if (arg.flag) message.args[name] = message.args.hasOwnProperty(name)
        else {
          if (value() === undefined) {
            if (arg.default) {
              message.args[name] =
                typeof arg.default === "function"
                  ? await arg.default()
                  : arg.default
            } else if (arg.castValue !== "array") {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Missing value for "${name}" argument`,
                    message.client.user?.displayAvatarURL()
                  )
                  .setDescription(
                    "Please add a `arg.default` value or activate the `arg.flag` property."
                  )
              )
            }
          } else if (arg.checkValue) {
            if (
              typeof arg.checkValue === "function"
                ? !(await arg.checkValue(value()))
                : !arg.checkValue.test(value())
            ) {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Bad "${name}" argument ${
                      typeof arg.checkValue === "function"
                        ? "tested"
                        : "pattern"
                    } "${arg.name}".`,
                    message.client.user?.displayAvatarURL()
                  )
                  .setDescription(
                    typeof arg.checkValue === "function"
                      ? app.toCodeBlock(arg.checkValue.toString(), "js")
                      : `Expected pattern: \`${arg.checkValue.source}\``
                  )
              )
            }
          }

          if (arg.castValue) {
            try {
              switch (arg.castValue) {
                case "boolean":
                  message.args[name] = Boolean(value())
                  break
                case "date":
                  message.args[name] = new Date(value())
                  break
                case "json":
                  message.args[name] = JSON.parse(value())
                  break
                case "number":
                  message.args[name] = Number(value())
                  if (Number.isNaN(value()))
                    throw new Error("The value is not a Number!")
                  break
                case "regex":
                  message.args[name] = regexParser(value())
                  break
                case "array":
                  if (value() === undefined) message.args[name] = []
                  else message.args[name] = value().split(/[,;|]/)
                  break
                default:
                  message.args[name] = await arg.castValue(value())
                  break
              }
            } catch (error) {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Bad argument type "${name}".`,
                    message.client.user?.displayAvatarURL()
                  )
                  .setDescription(
                    `Cannot cast the value of the "${name}" argument to ${
                      typeof arg.castValue === "function"
                        ? "custom type"
                        : "`" + arg.castValue + "`"
                    }\n${app.toCodeBlock(`Error: ${error.message}`, "js")}`
                  )
              )
            }
          }
        }
      }
    }

    message.args.rest = message.args._.join(" ")

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
