import * as app from "../app"

const command: app.Command = {
  name: "prefix",
  guildOwner: true,
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
        `My current prefix in "**${message.guild}**" is \`${await app.prefix(
          message.guild
        )}\``
      )

    await app.prefixes.set(message.guild.id, prefix)

    await message.channel.send(
      `The new prefix of "**${message.guild}**" is \`${prefix}\``
    )
  },
}

module.exports = command
