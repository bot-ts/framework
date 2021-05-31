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

    message.usedAsDefault = false

    const prefix = await app.prefix(message.guild ?? undefined)

    let dynamicContent = message.content

    const cut = function (key: string) {
      dynamicContent = dynamicContent.slice(key.length).trim()
    }

    const mentionRegex = new RegExp(`^(<@!?${message.client.user.id}>) ?`)

    if (dynamicContent.startsWith(prefix)) {
      message.usedPrefix = prefix
      cut(prefix)
    } else if (mentionRegex.test(dynamicContent)) {
      const [match, used] = mentionRegex.exec(dynamicContent) as RegExpExecArray
      message.usedPrefix = `${used} `
      cut(match)
    } else return

    let key = dynamicContent.split(/\s+/)[0]

    // turn ON/OFF
    if (key !== "turn" && !app.cache.ensure<boolean>("turn", true)) return

    let cmd: app.Command<any> = app.commands.resolve(key) as app.Command<any>

    if (!cmd) {
      if (app.defaultCommand) {
        key = ""
        cmd = app.defaultCommand
        message.usedAsDefault = true
      } else return null
    }

    // check sub commands
    {
      let cursor = 0
      let depth = 0

      while (cmd.options.subs && cursor < cmd.options.subs.length) {
        const subKey = dynamicContent.split(/\s+/)[depth + 1]

        for (const sub of cmd.options.subs) {
          if (sub.options.name === subKey) {
            key += ` ${subKey}`
            cursor = 0
            cmd = sub
            depth++
            break
          } else if (sub.options.aliases) {
            for (const alias of sub.options.aliases) {
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

    cut(key.trim())

    const baseContent = dynamicContent

    // parse CommandMessage arguments
    const parsedArgs = yargsParser(dynamicContent)
    const restPositional = parsedArgs._.slice() ?? []

    message.args = (parsedArgs._?.slice(0) ?? []).map((positional) => {
      if (/^(?:".+"|'.+')$/.test(positional))
        return positional.slice(1, positional.length - 1)
      return positional
    })

    // handle help argument
    if (parsedArgs.help || parsedArgs.h)
      return app.sendCommandDetails(message, cmd)

    // prepare command
    const prepared = await app.prepareCommand(message, cmd, {
      restPositional,
      baseContent,
      parsedArgs,
      key,
    })
    if (typeof prepared !== "boolean") return message.channel.send(prepared)
    if (!prepared) return

    try {
      await cmd.options.run.bind(cmd)(message)
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
