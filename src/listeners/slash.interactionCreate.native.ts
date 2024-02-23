import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "A interactionCreate listener",
  async run(interaction) {
    if (!interaction.isCommand()) return

    const cmd = app.slashCommands.get(interaction.commandName)

    if (!cmd) return interaction.reply("Command not found")

    const prepared = await app.prepareSlashCommand(interaction, cmd)

    if (typeof prepared !== "boolean")
      return interaction.reply({ embeds: [prepared] }).catch()

    if (!prepared) return

    try {
      await cmd.options.run.bind(interaction)(interaction)
    } catch (error: any) {
      app.error(error, cmd.filepath!, true)

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          content: app.code.stringify({
            content: `Error: ${
              error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"
            }`,
            lang: "js",
          }),
          ephemeral: true,
        })
      } else {
        interaction
          .reply({
            content: app.code.stringify({
              content: `Error: ${
                error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"
              }`,
              lang: "js",
            }),
            ephemeral: true,
          })
          .catch((error) => {
            app.error(error, cmd!.filepath!, true)
          })
      }
    }
  },
}

export default listener
