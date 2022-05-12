import * as app from "../app.js"

export type SlashDeployment = {guilds?: string [], global: boolean}
export type SlashBuilder = app.ApplicationCommandData
export type SlashType = {
  builder: SlashBuilder
  deploy?: SlashDeployment
}

import { REST } from "@discordjs/rest"

import chalk from "chalk"

const rest = new REST({ version: "9" }).setToken(
  process.env.BOT_TOKEN as string
)

export async function reloadSlashCommands(client: app.Client<true>) {
  const slashCommands = await getSlashCommands()
  const guilds = Array.from(client.guilds.cache.values())
  let failCount = 0

  for (const slashCmd of slashCommands) {
    if (slashCmd.deploy?.global) {
      try {
        client.application.commands.create(slashCmd.builder)
        client.application.commands.set([slashCmd.builder])
  
        app.log(`loaded slash commands for all`)
      } catch (error) {
        failCount++
      }
    } else {
      slashCmd.deploy?.guilds?.forEach((guildId) => {
        try {
          client.application.commands.create(slashCmd.builder, guildId)
          client.application.commands.set([slashCmd.builder], guildId)
          
          app.log(`loaded slash commands for "${chalk.blueBright(client.guilds.cache.get(guildId)?.name)}"`)
        } catch (error) {
          failCount++
        }
      })
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
}
