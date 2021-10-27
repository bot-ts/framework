import * as app from "../app.js"

import guilds from "../tables/guilds.native.js"

export default new app.Command({
  name: "prefix",
  guildOwnerOnly: true,
  channelType: "guild",
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

    await guilds.query
      .insert({
        id: message.guild.id,
        prefix: prefix,
      })
      .onConflict("id")
      .merge()

    await message.channel.send(
      `My new prefix for "**${message.guild}**" is \`${prefix}\``
    )
  },
})
