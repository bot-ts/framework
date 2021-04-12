import * as app from "../app"

const command: app.Command = {
  name: "help",
  aliases: ["h", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  positional: [
    {
      name: "command",
      description: "The target command name.",
    },
  ],
  async run(message) {
    const prefix = await app.prefix(message.guild ?? undefined)

    if (message.args.command) {
      const cmd = app.commands.resolve(message.args.command)

      if (cmd) {
        return app.sendCommandDetails(message, cmd, prefix)
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
      new app.Paginator(
        app.Paginator.divider(
          await Promise.all(
            app.commands.map(async (cmd) => {
              return `**${prefix}${cmd.name}** - ${
                (await app.scrap(cmd.description, message)) ?? "no description"
              }`
            })
          ),
          10
        ).map((page) => {
          return new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor("Command list", message.client.user?.displayAvatarURL())
            .setDescription(page.join("\n"))
            .setFooter(`${prefix}help <command>`)
        }),
        message.channel,
        (reaction, user) => user.id === message.author.id
      )
    }
  },
}

module.exports = command
