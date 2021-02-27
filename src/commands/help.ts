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
      description: "The target command to detail.",
    },
  ],
  async run(message) {
    const prefix = await app.prefix(message.guild ?? undefined)

    if (message.positional.command) {
      const cmd = app.commands.resolve(message.positional.command)

      if (cmd) {
        return app.sendCommandDetails(message, cmd, prefix)
      } else {
        await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Unknown command "${message.positional.command}"`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
    } else {
      new app.Paginator(
        app.Paginator.divider(
          app.commands.map((cmd) => {
            return `**${prefix}${cmd.name}** - ${
              cmd.description ?? "no description"
            }`
          }),
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
  subs: [
    {
      name: "count",
      examples: ["help count"],
      async run(message) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor("Command count", message.client.user?.displayAvatarURL())
            .setDescription(
              `There are currently ${
                app.commands.size
              } commands and ${app.commands.reduce<number>((acc, command) => {
                if (command && command.subs) return acc + command.subs.length
                return acc
              }, 0)} sub-commands`
            )
        )
      },
    },
  ],
}

module.exports = command
