import discord from "discord.js"
import rest from "@discordjs/rest"
import api from "discord-api-types/v9.js"

import * as core from "./core.js"
import * as logger from "./logger.js"

export function getRestClient() {
  return new rest.REST({ version: "9" }).setToken(
    process.env.BOT_TOKEN as string
  )
}

export async function reloadSlashCommands(
  client: core.FullClient,
  guild: discord.Guild,
  commands: api.APIApplicationCommand[],
  restClient?: rest.REST
) {
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
