import path from "path"
import discord from "discord.js"
import rest from "@discordjs/rest"
import api from "discord-api-types/v9.js"

import * as core from "./core.js"
import * as logger from "./logger.js"
import * as command from "./command.js"

export function getRestClient() {
  return new rest.REST({ version: "9" }).setToken(
    process.env.BOT_TOKEN as string
  )
}

export function getSlashCommands(): api.APIApplicationCommand[] {
  const slashCommands: api.APIApplicationCommand[] = []
  const commands = Array.from(command.commands.values()).filter(
    (c) => c.options.isSlash
  )

  // todo: make recursive search for sub-slash-commands
  for (const command of commands) {
    slashCommands.push({
      name: command.options.name,
      description: command.options.description,
    })
  }

  return slashCommands
}

export async function reloadSlashCommands(
  client: core.FullClient,
  guild: discord.Guild,
  commands?: api.APIApplicationCommand[],
  restClient?: rest.REST
) {
  if (!commands) commands = getSlashCommands()
  if (!restClient) restClient = getRestClient()

  try {
    await restClient.put(
      api.Routes.applicationGuildCommands(client.user.id, guild.id),
      {
        body: commands,
      }
    )
  } catch (error: any) {
    logger.error(error, "slash:reloadSlashCommands", true)
  }
}
