import * as app from "../app.js"

export type SlashType = app.discord.ApplicationCommandData
export type SlashDeployment = {guilds?: string [], global: boolean}
export type SlashBuilder =
  | app.SlashCommandBuilder
  | app.SlashCommandSubcommandBuilder
  | app.SlashCommandSubcommandGroupBuilder
  | app.SlashCommandOptionsOnlyBuilder
  | app.SlashCommandSubcommandsOnlyBuilder

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
    let deploy = await getSlashDeployment(slashCmd.name)

    console.log(deploy)
    console.log(slashCmd)

    if (deploy) {
      if (deploy.global) {
        failCount = await deploySlashCommand(client, slashCmd)
      } else {
        failCount = await deploySlashCommand(client, slashCmd, deploy.guilds)
      }
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

async function deploySlashCommand(client: app.Client<true>, slashCommands: SlashType, guilds?: string[]) {
  let failCount = 0

  if (guilds) {
    for (const guild of guilds) {
      try {
        await rest.put(
          app.api.Routes.applicationGuildCommands(client.user.id, guild),
          { body: slashCommands }
        )
  
        app.log(`loaded slash commands for "${chalk.blueBright(client.guilds.cache.get(guild)?.name)}"`)
      } catch (error) {
        console.log(error)
        failCount++
      }
    }
  } else {
    try {
      await rest.put(
        app.api.Routes.applicationCommands(client.user.id),
        { body: slashCommands }
      )

      app.log(`loaded slash commands for all`)
    } catch (error) {
      failCount++
    }
  }

  return failCount
}

export async function getSlashCommands() {
  return app.commands
    .map((cmd) => cmd.options.slash)
    .filter(app.isDefined)
}

export async function getSlashDeployment(slashName: string) {
  return app.commands.map((cmd) => cmd.options.slash?.name === slashName ? cmd.options.deploy : undefined).filter(app.isDefined)[0]
}
