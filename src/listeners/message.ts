import * as app from "../app"
import yargsParser from "yargs-parser"
import regexParser from "regex-parser"

const listener: app.Listener<"message"> = {
  event: "message",
  async call(message) {
    if (!app.isCommandMessage(message)) return

    const prefix = await app.prefix(message.guild)

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
    message.args.rest = message.args._.join(" ")

    if (cmd.args) {
      for (const arg of cmd.args) {
        const value = () => message.args[arg.name]

        let usedName = arg.name
        let given = message.args.hasOwnProperty(arg.name)

        if (!given && arg.aliases) {
          if (typeof arg.aliases === "string") {
            usedName = arg.aliases
            given = message.args.hasOwnProperty(arg.aliases)
          } else {
            for (const alias of arg.aliases) {
              if (message.args.hasOwnProperty(alias)) {
                usedName = alias
                given = true
                break
              }
            }
          }
        }

        if (arg.required && !given)
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

        if (arg.flag)
          message.args[arg.name] = message.args.hasOwnProperty(usedName)
        else {
          message.args[arg.name] = message.args[usedName]

          if (value() === undefined) {
            if (arg.default) {
              message.args[arg.name] =
                typeof arg.default === "function"
                  ? await arg.default(message)
                  : arg.default
            } else if (arg.castValue !== "array") {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Missing value for "${usedName}" argument`,
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
                ? !(await arg.checkValue(value(), message))
                : !arg.checkValue.test(value())
            ) {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Bad argument ${
                      typeof arg.checkValue === "function"
                        ? "tested "
                        : "pattern"
                    } "${usedName}".`,
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
                  message.args[arg.name] = Boolean(value())
                  break
                case "date":
                  message.args[arg.name] = new Date(value())
                  break
                case "json":
                  message.args[arg.name] = JSON.parse(value())
                  break
                case "number":
                  message.args[arg.name] = Number(value())
                  if (Number.isNaN(value()))
                    throw new Error("The value is not a Number!")
                  break
                case "regex":
                  message.args[arg.name] = regexParser(value())
                  break
                case "array":
                  if (value() === undefined) message.args[arg.name] = []
                  else message.args[arg.name] = value().split(/[,;|]/)
                  break
                default:
                  message.args[arg.name] = await arg.castValue(value(), message)
                  break
              }
            } catch (error) {
              return await message.channel.send(
                new app.MessageEmbed()
                  .setColor("RED")
                  .setAuthor(
                    `Bad argument type "${usedName}".`,
                    message.client.user?.displayAvatarURL()
                  )
                  .setDescription(
                    `Cannot cast the value of the "${usedName}" argument to ${
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
