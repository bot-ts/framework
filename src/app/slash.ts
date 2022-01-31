import * as app from "../app.js"

const rest = new app.rest.REST({ version: "9" }).setToken(
  process.env.BOT_TOKEN as string
)

export async function reloadSlashCommands(client: app.Client<true>) {
  const slashCommands = await getSlashCommands()
  const guilds = Array.from(client.guilds.cache.values())

  for (const guild of guilds) {
    await rest.put(
      app.api.Routes.applicationGuildCommands(client.user.id, guild.id),
      { body: slashCommands }
    )
  }

  app.log(`loaded ${slashCommands.length} slash commands`)
}

export async function getSlashCommands() {
  return app.commands
    .filter(
      (
        cmd
      ): cmd is app.Command<any> & {
        options: { slash: app.SlashCommandBuilder }
      } => cmd.options.slash !== undefined
    )
    .map((cmd) => cmd.options.slash.toJSON())
}
