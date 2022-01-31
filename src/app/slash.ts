import * as discord from "discord.js"
import * as api from "discord-api-types/v9"
import axios from "axios"

import * as core from "./core.js"
import * as logger from "./logger.js"
import * as command from "./command.js"
import { handler } from "../app.native.js"
import path from "path"

const apiURL = "https://discord.com/api/v9"

export interface ApplicationCommandOptions {
  type: number
  name: string
  description: string
  required?: boolean
  choices?: string[] | number[]
  autocomplete?: boolean
  options?: ApplicationCommandOptions
  channel_types?: number
}

export interface ApplicationCommandSlash {
  name: string
  description: string
  options?: object | ApplicationCommandOptions
  default_permission?: boolean
  type?: number
}

export async function createSlashCommand(
  clientId: string,
  command: ApplicationCommandSlash,
  guildId?: string
) {
  guildId
    ? await axios.post(
        apiURL + `/applications/${clientId}/guilds/${guildId}/commands`,
        command,
        { headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` } }
      )
    : await axios.post(apiURL + `/applications/${clientId}/commands`, command, {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      })
  // Rajout du body de la command (name, desc, ect...)
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
