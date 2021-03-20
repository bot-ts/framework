import * as app from "../app"
import prefixes from "../tables/prefixes"

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
    const prefix = message.args.prefix

    if (!prefix)
      return message.channel.send(
        `My current prefix for "**${message.guild}**" is \`${await app.prefix(
          message.guild
        )}\``
      )

    await prefixes.query
      .insert({
        guild_id: message.guild.id,
        prefix: prefix,
      })
      .onConflict("guild_id")
      .merge()

    await message.channel.send(
      `My new prefix for "**${message.guild}**" is \`${prefix}\``
    )
  },
}

module.exports = command
