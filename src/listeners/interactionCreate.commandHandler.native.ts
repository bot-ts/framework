import * as app from "../app.js"
import path from "path"

const __filename = app.filename(import.meta)

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle slash commands",
  async run(interaction) {
    if (!interaction.isApplicationCommand()) return

    let cmd = (
      await import(
        "file://" +
          path.join(
            process.cwd(),
            "dist",
            "slash",
            `${interaction.commandName}.js`
          )
      )
    ).default

    if (!cmd)
      return interaction.reply(
        `The "${interaction.commandName}" slash command is not yet implemented.`
      )

    if (interaction.isCommand()) {
      const subCommand = interaction.options.getSubcommand(false)

      if (cmd.options.subs && subCommand)
        for (const sub of cmd.options.subs)
          if (sub.name == subCommand) {
            sub.run.bind(cmd)(interaction)
            return
          }
    }

    try {
      await cmd.options.run.bind(cmd)(interaction)
    } catch (error: any) {
      app.error(error, cmd.filepath ?? __filename, true)
      interaction
        .reply(
          app.code.stringify({
            content: `${error.name ?? "Error"}: ${
              error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"
            }`,
            lang: "js",
          })
        )
        .catch((error) => {
          app.error(error, cmd?.filepath ?? __filename, true)
        })
    }
  },
}

export default listener
