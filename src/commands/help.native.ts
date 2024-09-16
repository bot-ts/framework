// native file, if you want edit it, remove the "native" suffix from the filename

import * as app from "#app"

export default new app.Command({
  name: "help",
  description: "Help menu",
  longDescription: "Show command details or list all commands",
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
        await message.channel.send(
          await app.getSystemMessage(
            "error",
            `Unknown command "${message.args.command}"`,
          ),
        )
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
            return app.getSystemMessage("default", {
              header: "Command list",
              body: page.join("\n"),
              footer: `${message.usedPrefix}help <command>`,
            })
          },
        ),
        filter: (reaction, user) => user.id === message.author.id,
        target: message.channel,
      })
    }
  },
})
