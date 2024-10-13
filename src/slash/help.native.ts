import * as app from "#app"

export default new app.SlashCommand({
  name: "help",
  description: "Show slash command details or list all slash commands",
  guildOnly: true,
  build() {
    this.addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The target command name.")
        .setRequired(false),
    )
  },
  async run(interaction) {
    const commandName = interaction.options.getString("command")

    const commands = Array.from(
      (await interaction.client.application.commands.fetch()).values(),
    )

    commands.push(...(await interaction.guild.commands.fetch()).values())

    const command = commands.find((cmd) => cmd.name === commandName)

    if (command) return app.sendSlashCommandDetails(interaction, command)
    else {
      await interaction.deferReply()

      new app.StaticPaginator({
        pages: await app.divider(
          app.slashCommands
            .map((cmd) => {
              const command = commands.find((c) => c.name === cmd.options.name)

              if (!command) return `unknown command ${cmd.options.name}`

              return app.slashCommandToListItem(command)
            })
            .filter((line) => line.length > 0),
          10,
          (page) => {
            return app.getSystemMessage("default", {
              header: "Command list",
              body: page.join("\n"),
              footer: "/help <command>",
            })
          },
        ),
        filter: (reaction, user) => user.id === interaction.user.id,
        target: interaction,
      })
    }
  },
})
