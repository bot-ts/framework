// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "../app.js"

export default new app.Command({
  name: "help",
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  channelType: "all",
  aliases: ["h", "usage", "detail", "details"],
  positional: [
    {
      name: "command",
      type: "command",
      description: "The target command name.",
    },
  ],
  async run(message) {
    if (message.args.command) {
      const cmd = message.args.command

      if (cmd) {
        return app.sendCommandDetails(message, cmd)
      } else {
        await message.channel.send({
          embeds: [
            new app.MessageEmbed().setColor("RED").setAuthor({
              name: `Unknown command "${message.args.command}"`,
              iconURL: message.client.user?.displayAvatarURL(),
            }),
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
              }),
            )
          ).filter((line) => line.length > 0),
          10,
          (page) => {
            return new app.MessageEmbed()
              .setColor("BLURPLE")
              .setAuthor({
                name: "Command list",
                iconURL: message.client.user?.displayAvatarURL(),
              })
              .setDescription(page.join("\n"))
              .setFooter({ text: `${message.usedPrefix}help <command>` })
          },
        ),
        filter: (reaction, user) => user.id === message.author.id,
        channel: message.channel,
      })
    }
  },
})
