import * as app from "../app.js"

export type SlashDeployment = { guilds?: string[]; global: boolean }
export type SlashBuilder = app.ApplicationCommandData
export type SlashType = {
  builder: SlashBuilder
  deploy: SlashDeployment
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

  let globalCmds = []
  let guildCmds: {
    cmds: SlashBuilder[]
    guildId: string
  }[] = []

  for (const slashCmd of slashCommands) {
    if (slashCmd.deploy.global) {
      globalCmds.push(slashCmd.builder)
    } else {
      if (slashCmd.deploy.guilds) {
        slashCmd.deploy.guilds.map((guild) => {
          const guildCmd = guildCmds.find((g) => g.guildId === guild)

          if (!guildCmd) {
            guildCmds.push({
              cmds: [slashCmd.builder],
              guildId: guild,
            })
          } else {
            guildCmd.cmds.push(slashCmd.builder)
          }
        })
      }
    }

    client.application.commands.set(globalCmds)
    guildCmds.map((guildCmd) => {
      client.application.commands.set(guildCmd.cmds, guildCmd.guildId)
    })

    app.log(`loaded slash commands for all`)
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
  return app.commands.map((cmd) => cmd.options.slash).filter(app.isDefined)
}
