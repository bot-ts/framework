import * as app from "../app.js"

import { REST } from "@discordjs/rest"

import chalk from "chalk"

const rest = new REST({ version: "9" }).setToken(
  process.env.BOT_TOKEN as string
)

export async function reloadSlashCommands(client: app.Client<true>) {
  const slashCommands = await getSlashCommands()
  const guilds = Array.from(client.guilds.cache.values())
  let failCount = 0

  for (const guild of guilds) {
    try {
      await rest.put(
        app.api.Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: slashCommands }
      )

      app.log(`loaded slash commands for "${chalk.blueBright(guild.name)}"`)
    } catch (error) {
      failCount++
    }
  }

  app.log(
    `loaded ${chalk.blueBright(
      slashCommands.length
    )} slash commands for ${chalk.blueBright(
      guilds.length - failCount
    )} guilds (${chalk.red(failCount)} fails)`
  )
}

export async function getSlashCommands() {
  return app.commands
    .map((cmd) => cmd.options.slash)
    .filter(app.isDefined)
    .filter(
      (
        slash
      ): slash is
        | app.SlashCommandBuilder
        | app.SlashCommandSubcommandBuilder
        | app.SlashCommandSubcommandGroupBuilder
        | app.SlashCommandOptionsOnlyBuilder => slash !== true
    )
    .map((slash) => slash.toJSON())
}
