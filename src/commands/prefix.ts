import * as app from "../app"

const command: app.Command<app.GuildMessage> = {
  name: "prefix",
  guildOwner: true,
  guildOnly: true,
  description: "Edit or show the bot prefix",
  positional: [
    {
      name: "prefix",
      checkValue: (value) => value.length < 10 && /^\S/.test(value),
      description: "The new prefix",
    },
  ],
  async run(message) {
    const prefix = message.positional.prefix

    if (!prefix)
      return message.channel.send(
        `My current prefix for "**${message.guild}**" is \`${await app.prefix(
          message.guild
        )}\``
      )

    await app.prefixes.set(message.guild.id, prefix)

    await message.channel.send(
      `My new prefix for "**${message.guild}**" is \`${prefix}\``
    )
  },
}

module.exports = command
