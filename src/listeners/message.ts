import * as app from "../app"
import yargsParser from "yargs-parser"

const listener: app.Listener<"message"> = {
  event: "message",
  async run(message) {
    if (!app.isCommandMessage(message)) return

    const prefix = await app.prefix(message.guild ?? undefined)

    const cut = function (key: string) {
      message.content = message.content.slice(key.length).trim()
    }

    if (message.content.startsWith(prefix)) cut(prefix)
    else return

    let key = message.content.split(/\s+/)[0]

    // turn ON/OFF
    if (key !== "turn" && !app.cache.ensure<boolean>("turn", true)) return

    let cmd: app.Command = app.commands.resolve(key) as app.Command

    if (!cmd) return null

    // check sub commands
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
          } else if (sub.aliases) {
            for (const alias of sub.aliases) {
              if (alias === subKey) {
                key += ` ${subKey}`
                cursor = 0
                cmd = sub
                depth++
              }
            }
          }
          cursor++
        }
      }
    }

    cut(key)

    // parse CommandMessage arguments
    const parsedArgs = yargsParser(message.content)
    const restPositional = parsedArgs._ ?? []

    message.args = (parsedArgs._?.slice(0) ?? []).map((positional) => {
      if (/^(?:".+"|'.+')$/.test(positional))
        return positional.slice(1, positional.length - 1)
      return positional
    })

    // handle help argument
    if (message.args.help || message.args.h)
      return app.sendCommandDetails(message, cmd, prefix)

    // coolDown
    {
      const coolDownId = `${cmd.name}:${message.channel.id}`
      const coolDown = app.cache.ensure("CD-" + coolDownId, {
        time: 0,
        trigger: false,
      })

      if (cmd.coolDown && coolDown.trigger) {
        if (Date.now() > coolDown.time + cmd.coolDown) {
          app.cache.set("CD-" + coolDownId, {
            time: 0,
            trigger: false,
          })
        } else {
          return message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(
                `Please wait ${Math.ceil(
                  (coolDown.time + cmd.coolDown - Date.now()) / 1000
                )} seconds...`,
                message.client.user?.displayAvatarURL()
              )
          )
        }
      }
    }

    if (app.isGuildMessage(message)) {
      if (cmd.dmOnly)
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "This command must be used in DM.",
              message.client.user?.displayAvatarURL()
            )
        )

      if (cmd.guildOwner)
        if (
          message.guild.owner !== message.member &&
          process.env.OWNER !== message.member.id
        )
          return await message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(
                "You must be the guild owner.",
                message.client.user?.displayAvatarURL()
              )
          )

      if (cmd.botPermissions)
        for (const permission of cmd.botPermissions)
          if (
            !message.guild.me?.hasPermission(permission, {
              checkAdmin: true,
              checkOwner: true,
            })
          )
            return await message.channel.send(
              new app.MessageEmbed()
                .setColor("RED")
                .setAuthor(
                  `I need the \`${permission}\` permission to call this command.`,
                  message.client.user?.displayAvatarURL()
                )
            )

      if (cmd.userPermissions)
        for (const permission of cmd.userPermissions)
          if (
            !message.member.hasPermission(permission, {
              checkAdmin: true,
              checkOwner: true,
            })
          )
            return await message.channel.send(
              new app.MessageEmbed()
                .setColor("RED")
                .setAuthor(
                  `You need the \`${permission}\` permission to call this command.`,
                  message.client.user?.displayAvatarURL()
                )
            )
    }

    if (cmd.guildOnly) {
      if (app.isDirectMessage(message))
        return await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "This command must be used in a guild.",
              message.client.user?.displayAvatarURL()
            )
        )
    }

    if (cmd.botOwner)
      if (process.env.OWNER !== message.author.id)
        return await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be my owner.",
              message.client.user?.displayAvatarURL()
            )
        )

    if (cmd.positional) {
      for (const positional of cmd.positional) {
        const index = cmd.positional.indexOf(positional)

        const getValue = () => message.args[positional.name]
        const setValue = (value: any) => {
          message.args[positional.name] = value
          message.args[index] = value
        }

        const given = message.args[index] !== undefined

        message.args[positional.name] = message.args[index]

        if (!given) {
          if (positional.default !== undefined) {
            setValue(await app.scrap(positional.default, message))
          } else if (positional.required) {
            return await message.channel.send(
              new app.MessageEmbed()
                .setColor("RED")
                .setAuthor(
                  `Missing positional "${positional.name}"`,
                  message.client.user?.displayAvatarURL()
                )
                .setDescription(
                  positional.description
                    ? "Description: " + positional.description
                    : `Example: \`--${positional.name}=someValue\``
                )
            )
          }
        } else if (positional.checkValue) {
          const checked = await app.checkValue(
            positional,
            "positional",
            getValue(),
            message
          )

          if (!checked) return
        }

        if (positional.castValue) {
          const casted = await app.castValue(
            positional,
            "positional",
            getValue(),
            message,
            setValue
          )

          if (!casted) return
        }

        restPositional.shift()
      }
    }

    if (cmd.args) {
      for (const arg of cmd.args) {
        const value = () => message.args[arg.name]

        let { given, usedName } = app.resolveGivenArgument(message, arg)

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
                  : `Example: \`--${arg.name}=someValue\``
              )
          )

        message.args[arg.name] = message.args[usedName]

        if (value() === undefined) {
          if (arg.default !== undefined) {
            message.args[arg.name] =
              typeof arg.default === "function"
                ? await arg.default(message)
                : arg.default
          } else if (arg.castValue !== "array") {
            message.args[arg.name] = null
          }
        } else if (arg.checkValue) {
          const checked = await app.checkValue(
            arg,
            "argument",
            value(),
            message
          )

          if (!checked) return
        }

        if (value() !== null && arg.castValue) {
          const casted = await app.castValue(
            arg,
            "argument",
            value(),
            message,
            (value) => (message.args[arg.name] = value)
          )

          if (!casted) return
        }
      }
    }

    if (cmd.flags) {
      for (const flag of cmd.flags) {
        const value = () => message.args[cmd.name]

        let { given, usedName } = app.resolveGivenArgument(message, flag)

        if (!given) message.args[usedName] = false

        message.args[flag.name] = message.args[usedName]

        if (value() === undefined) message.args[flag.name] = false
      }
    }

    message.rest = restPositional.join(" ")

    try {
      await cmd.run(message)
    } catch (error) {
      app.error(error, "handler", true)
      message.channel
        .send(
          app.CODE.stringify({
            content: `Error: ${
              error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"
            }`,
            lang: "js",
          })
        )
        .catch((error) => {
          app.error(error, "system")
        })
    }
  },
}

module.exports = listener
