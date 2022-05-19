import * as app from "../app.js"
import yargsParser from "yargs-parser"
import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

const listener: app.Listener<"messageCreate"> = {
  event: "messageCreate",
  description: "Handle message for commands",
  async run(message) {
    if (!app.isNormalMessage(message)) return

    const prefix = await app.prefix(message.guild ?? undefined)

    if (new RegExp(`^<@!?${message.client.user.id}>$`).test(message.content))
      return message.channel
        .send({
          embeds: [
            new app.SafeMessageEmbed()
              .setColor()
              .setDescription(`My prefix is \`${prefix}\``),
          ],
        })
        .catch()

    message.usedAsDefault = false

    message.send = async function (
      this: app.NormalMessage,
      sent: app.SentItem
    ) {
      return this.channel.send(sent)
    }.bind(message)

    message.sendTimeout = async function (
      this: app.NormalMessage,
      timeout: number,
      sent: app.SentItem
    ) {
      const m = await this.channel.send(sent)
      setTimeout(
        function (this: app.NormalMessage) {
          if (!this.deleted) this.delete().catch()
        }.bind(this),
        timeout
      )
      return m
    }.bind(message)

    message.isFromBotOwner =
      message.author.id === (await app.getBotOwnerId(message))

    app.emitMessage(message.channel, message)
    app.emitMessage(message.author, message)

    if (app.isGuildMessage(message)) {
      message.isFromGuildOwner =
        message.isFromBotOwner || message.guild.ownerId === message.author.id

      app.emitMessage(message.guild, message)
      app.emitMessage(message.member, message)
    }

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
    const restPositional = (parsedArgs._?.slice() ?? []).map(String)

    message.args = restPositional.map((positional) => {
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

    if (typeof prepared !== "boolean")
      return message.channel.send({ embeds: [prepared] }).catch()

    if (!prepared) return

    try {
      await cmd.options.run.bind(cmd)(message)
    } catch (error: any) {
      app.error(error, cmd.filepath ?? __filename, true)
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
          app.error(error, cmd.filepath ?? __filename, true)
        })
    }
  },
}

export default listener
