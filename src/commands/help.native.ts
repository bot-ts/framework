import * as app from "../app.js"
import * as core from "../app/core.js"

export default new app.Command({
  name: "help",
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  channelType: "all",
  aliases: ["h", "usage", "detail", "details"],
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
        await message.channel.send({
          embeds: [
            new core.SafeMessageEmbed()
              .setColor("RED")
              .setAuthor(
                `Unknown command "${message.args.command}"`,
                message.client.user?.displayAvatarURL()
              ),
          ],
        })
      }
    } else {
      new app.StaticPaginator({
        pages: await app.divider(
          (
            await Promise.all(
              app.commands.map(async (cmd) => {
                const prepared = await app.prepareCommand(message, cmd)
                if (prepared !== true) return ""
                return app.commandToListItem(message, cmd)
              })
            )
          ).filter((line) => line.length > 0),
          10,
          (page) => {
            return new app.SafeMessageEmbed()
              .setColor()
              .setAuthor(
                "Command list",
                message.client.user?.displayAvatarURL()
              )
              .setDescription(page.join("\n"))
              .setFooter(`${message.usedPrefix}help <command>`)
          }
        ),
        filter: (reaction, user) => user.id === message.author.id,
        channel: message.channel,
      })
    }
  },
})
