import * as app from "../app"

const command: app.Command = {
  name: "prefix",
  async run(message) {
    if (!message.content)
      return message.channel.send(
        `My current prefix in "**${message.guild}**" is \`${app.prefix(
          message.guild
        )}\``
      )

    const prefix = message.content

    if (/\s/.test(prefix) || prefix.length > 10)
      return message.channel.send(
        `Invalid given prefix. (max 10 char and no space)`
      )

    app.prefixes.set(message.guild.id, prefix)

    await message.channel.send(
      `The new prefix of "**${message.guild}**" id \`${prefix}\``
    )
  },
}

module.exports = command
