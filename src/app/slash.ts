import * as discord from "discord.js"
import * as rest from "@discordjs/rest"
import * as api from "discord-api-types/v9"

import * as core from "./core.js"
import * as logger from "./logger.js"
import * as command from "./command.js"

export function getRestClient() {
  return new rest.REST({ version: "9" }).setToken(
    process.env.BOT_TOKEN as string
  )
}

export function getSlashCommands(data: {
  clientId: string
}): api.APIApplicationCommand[] {
  const slashCommands: api.APIApplicationCommand[] = []
  const commands = Array.from(command.commands.values()).filter(
    (c) => c.options.isSlash
  )

  // todo: make recursive search for sub-slash-commands
  for (const command of commands) {
    slashCommands.push({
      id: command.options.name,
      name: command.options.name,
      description: command.options.description,
      application_id: data.clientId,
      type: api.ApplicationCommandType.Message,
      version: "1.0.0",
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
  if (!commands) commands = getSlashCommands({ clientId: client.user.id })
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
