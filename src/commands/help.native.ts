import * as app from "../app"

module.exports = new app.Command({
  name: "help",
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  channelType: "all",
  aliases: ["h", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  positional: [
    {
      name: "command",
      description: "The target command name.",
    },
  ],
  async run(message) {
    if (message.args.command) {
      const cmd = app.commands.resolve(message.args.command)

      if (cmd) {
        return app.sendCommandDetails(message, cmd)
      } else {
        await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Unknown command "${message.args.command}"`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
    } else {
      new app.Paginator({
        pages: app.Paginator.divider(
          (
            await Promise.all(
              app.commands.map(async (cmd) => {
                const prepared = await app.prepareCommand(message, cmd)
                if (prepared !== true) return ""
                return app.commandToListItem(message, cmd)
              })
            )
          ).filter((line) => line.length > 0),
          10
        ).map((page) => {
          return new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor("Command list", message.client.user?.displayAvatarURL())
            .setDescription(page.join("\n"))
            .setFooter(`${message.usedPrefix}help <command>`)
        }),
        filter: (reaction, user) => user.id === message.author.id,
        channel: message.channel,
      })
    }
  },
})
