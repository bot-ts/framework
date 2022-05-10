import * as app from "../app.js"

export type SlashDeployment = {guilds?: string [], global: boolean}
export type SlashBuilder =
  | app.api.RESTPostAPIApplicationCommandsJSONBody
  | app.ApplicationCommandData
  | app.SlashCommandBuilder
  | app.SlashCommandSubcommandBuilder
  | app.SlashCommandSubcommandGroupBuilder
  | app.SlashCommandOptionsOnlyBuilder
  | app.SlashCommandSubcommandsOnlyBuilder
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
  let cmds: {
    guildId: string
    commands: SlashType[]
  }[] = []

  for (const slashCmd of slashCommands) {
    if (slashCmd.deploy?.global) {
      try {
        await rest.put(
          app.api.Routes.applicationCommands(client.user.id),
          { body: [slashCommands] }
        )
  
        app.log(`loaded slash commands for all`)
      } catch (error) {
        failCount++
      }
    } else {
      cmds.map(cmd => {
        slashCmd.deploy?.guilds?.map(guild => {
          if (guild === cmd.guildId) {
            // push in cmds
            cmd.commands.push(slashCmd)
          }
        })
      })
    }
  }

  for (const cmd of cmds) {
    try {
      await rest.put(
        app.api.Routes.applicationGuildCommands(client.user.id, cmd.guildId),
        { body: cmd.commands }
      )

      app.log(`loaded slash commands for "${chalk.blueBright(client.guilds.cache.get(cmd.guildId)?.name)}"`)
    } catch (error) {
      console.log(error)
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
}
