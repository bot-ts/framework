import * as app from "../app"
import yargsParser from "yargs-parser"

const listener: app.Listener<"message"> = {
  event: "message",
  async run(message) {
    if (!app.isCommandMessage(message)) return

    app.emitMessage(message.channel, message)
    app.emitMessage(message.author, message)

    if (app.isGuildMessage(message)) {
      app.emitMessage(message.guild, message)
      app.emitMessage(message.member, message)
    }

    const prefix = await app.prefix(message.guild ?? undefined)

    let dynamicContent = message.content

    const cut = function (key: string) {
      dynamicContent = dynamicContent.slice(key.length).trim()
    }

    const mentionRegex = new RegExp(`^<@!?${message.client.user?.id}> ?`)

    if (dynamicContent.startsWith(prefix)) message.usedPrefix = prefix
    else if (mentionRegex.test(dynamicContent))
      message.usedPrefix = dynamicContent.split(" ")[0]
    else return

    cut(message.usedPrefix)

    let key = dynamicContent.split(/\s+/)[0]

    // turn ON/OFF
    if (key !== "turn" && !app.cache.ensure<boolean>("turn", true)) return

    let cmd: app.Command = app.commands.resolve(key) as app.Command

    if (!cmd) {
      if (app.defaultCommand) {
        cmd = app.defaultCommand
      } else return null
    }

    // check sub commands
    {
      let cursor = 0
      let depth = 0

      while (cmd.subs && cursor < cmd.subs.length) {
        const subKey = dynamicContent.split(/\s+/)[depth + 1]

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

    const baseContent = dynamicContent

    // parse CommandMessage arguments
    const parsedArgs = yargsParser(dynamicContent)
    const restPositional = parsedArgs._ ?? []

    message.args = (parsedArgs._?.slice(0) ?? []).map((positional) => {
      if (/^(?:".+"|'.+')$/.test(positional))
        return positional.slice(1, positional.length - 1)
      return positional
    })

    // handle help argument
    if (parsedArgs.help || parsedArgs.h)
      return app.sendCommandDetails(message, cmd, prefix)

    // coolDown
    if (cmd.coolDown) {
      const slug = app.slug("coolDown", cmd.name, message.channel.id)
      const coolDown = app.cache.ensure<app.CoolDown>(slug, {
        time: 0,
        trigger: false,
      })

      message.triggerCoolDown = () => {
        app.cache.set(slug, {
          time: Date.now(),
          trigger: true,
        })
      }

      if (coolDown.trigger) {
        const coolDownTime = await app.scrap(cmd.coolDown, message)

        if (Date.now() > coolDown.time + coolDownTime) {
          app.cache.set(slug, {
            time: 0,
            trigger: false,
          })
        } else {
          return message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(
                `Please wait ${Math.ceil(
                  (coolDown.time + coolDownTime - Date.now()) / 1000
                )} seconds...`,
                message.client.user?.displayAvatarURL()
              )
          )
        }
      }
    } else {
      message.triggerCoolDown = () => {
        app.warn(
          `You must setup the cooldown of the "${cmd.name}" command before using the "triggerCoolDown" method`,
          "system"
        )
      }
    }

    if (app.isGuildMessage(message)) {
      if (app.scrap(cmd.dmChannelOnly, message))
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "This command must be used in DM.",
              message.client.user?.displayAvatarURL()
            )
        )

      if (app.scrap(cmd.guildOwnerOnly, message))
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

      if (cmd.botPermissions) {
        const botPermissions = await app.scrap(cmd.botPermissions, message)

        for (const permission of botPermissions)
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
      }

      if (cmd.userPermissions) {
        const userPermissions = await app.scrap(cmd.userPermissions, message)

        for (const permission of userPermissions)
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
    }

    if (await app.scrap(cmd.guildChannelOnly, message)) {
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

    if (await app.scrap(cmd.botOwnerOnly, message))
      if (process.env.OWNER !== message.author.id)
        return await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be my owner.",
              message.client.user?.displayAvatarURL()
            )
        )

    if (cmd.middlewares) {
      const middlewares = await app.scrap(cmd.middlewares, message)

      for (const middleware of middlewares) {
        const result: string | boolean = await middleware(message)

        if (typeof result === "string")
          return await message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(result, message.client.user?.displayAvatarURL())
          )
      }
    }

    if (cmd.positional) {
      const positionalList = await app.scrap(cmd.positional, message)

      for (const positional of positionalList) {
        const index = positionalList.indexOf(positional)
        let value = parsedArgs._[index]
        const given = value !== undefined

        const set = (v: any) => {
          message.args[positional.name] = v
          message.args[index] = v
          value = v
        }

        set(value)

        if (!given) {
          if (await app.scrap(positional.required, message)) {
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
                    : `Run the following command to learn more: ${app.code.stringify(
                        {
                          content: `${key} --help`,
                        }
                      )}`
                )
            )
          } else if (positional.default !== undefined) {
            set(await app.scrap(positional.default, message))
          } else {
            set(null)
          }
        } else if (positional.checkValue) {
          const checked = await app.checkValue(
            positional,
            "positional",
            value,
            message
          )

          if (!checked) return
        }

        if (positional.castValue) {
          const casted = await app.castValue(
            positional,
            "positional",
            value,
            message,
            set
          )

          if (!casted) return
        }

        restPositional.shift()
      }
    }

    if (cmd.options) {
      const options = await app.scrap(cmd.options, message)

      for (const option of options) {
        let { given, value } = app.resolveGivenArgument(parsedArgs, option)

        const set = (v: any) => {
          message.args[option.name] = v
          value = v
        }

        if (value === true) value = undefined

        if ((await app.scrap(option.required, message)) && !given)
          return await message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(
                `Missing argument "${option.name}"`,
                message.client.user?.displayAvatarURL()
              )
              .setDescription(
                option.description
                  ? "Description: " + option.description
                  : `Example: \`--${option.name}=someValue\``
              )
          )

        set(value)

        if (value === undefined) {
          if (option.default !== undefined) {
            set(await app.scrap(option.default, message))
          } else if (option.castValue !== "array") {
            set(null)
          }
        } else if (option.checkValue) {
          const checked = await app.checkValue(
            option,
            "argument",
            value,
            message
          )

          if (!checked) return
        }

        if (value !== null && option.castValue) {
          const casted = await app.castValue(
            option,
            "argument",
            value,
            message,
            set
          )

          if (!casted) return
        }
      }
    }

    if (cmd.flags) {
      for (const flag of cmd.flags) {
        let { given, value } = app.resolveGivenArgument(parsedArgs, flag)

        const set = (v: boolean) => {
          message.args[flag.name] = v
          value = v
        }

        if (!given) set(false)
        else if (typeof value === "boolean") set(value)
        else if (/^(?:true|1|on|yes|oui)$/.test(value)) set(true)
        else if (/^(?:false|0|off|no|non)$/.test(value)) set(false)
        else {
          set(true)
          restPositional.unshift(value)
        }
      }
    }

    message.rest = restPositional.join(" ")

    if (cmd.rest) {
      const rest = await app.scrap(cmd.rest, message)

      if (rest.all) message.rest = baseContent

      if (message.rest.length === 0) {
        if (await app.scrap(rest.required, message)) {
          return await message.channel.send(
            new app.MessageEmbed()
              .setColor("RED")
              .setAuthor(
                `Missing rest "${rest.name}"`,
                message.client.user?.displayAvatarURL()
              )
              .setDescription(
                rest.description ??
                  "Please use `--help` flag for more information."
              )
          )
        } else if (rest.default) {
          message.args[rest.name] = await app.scrap(rest.default, message)
        }
      } else {
        message.args[rest.name] = message.rest
      }
    }

    try {
      await cmd.run(message)
    } catch (error) {
      app.error(error, "handler", true)
      message.channel
        .send(
          app.code.stringify({
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
