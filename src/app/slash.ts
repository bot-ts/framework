import url from "url"
import chalk from "chalk"
import axios, { AxiosResponse } from "axios"

import API from "discord-api-types/v8"

import * as core from "./core"
import * as logger from "./logger"
import * as _command from "./command"
import { CommandMessageType } from "./command"

export let usable = false
export let refreshInterval: any = null

export const slashCommandHandler = {
  load: async (client: core.FullClient) => {
    await reloadSLashCommands(client)
  },
}

export function getSlashCommandAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const data = new url.URLSearchParams()
  data.append("grant_type", "client_credentials")
  data.append("scope", "applications.commands.update")
  return axios({
    url: "https://discord.com/api/oauth2/token",
    method: "POST",
    data: data.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
    },
  }).then(
    (value: AxiosResponse<{ access_token: string }>) => value.data.access_token
  )
}

export async function fetchSlashCommands(
  clientId: `${bigint}`,
  accessToken: string
) {
  return axios
    .get<API.APIApplicationCommand[]>(
      `https://discord.com/api/v8/applications/${clientId}/commands`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    .then((res) => res.data)
}

export async function postSlashCommand(
  clientId: `${bigint}`,
  accessToken: string,
  slashCommand: API.RESTPostAPIApplicationCommandsJSONBody
) {
  axios
    .post(
      `https://discord.com/api/v8/applications/${clientId}/commands`,
      slashCommand,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    .then((res) =>
      logger.log(
        `loaded slash command ${slashCommand.name}: ${res.status} ${res.statusText}`,
        "handler"
      )
    )
    .catch((error) => {
      logger.error(error, "handler", true)
    })
}

function subCommandsToSlashCommandOptions<
  Type extends keyof CommandMessageType = keyof CommandMessageType
>(
  cmd: _command.Command<Type>,
  depth: number = 0,
  parent?: API.APIApplicationCommandOption
): API.APIApplicationCommandOption[] | undefined {
  const output: API.APIApplicationCommandOption[] = []
  if (cmd.options.subs) {
    for (const sub of cmd.options.subs) {
      const option: API.APIApplicationCommandOption = {
        name: sub.options.name,
        description: sub.options.description,
        type: API.ApplicationCommandOptionType.SUB_COMMAND_GROUP,
      }

      option.options = subCommandsToSlashCommandOptions(
        sub as any,
        depth + 1,
        option
      )

      output.push(option)
    }
    return output
  } else {
    if (parent) parent.type = API.ApplicationCommandOptionType.SUB_COMMAND
    return undefined
  }
}

function isApplicationCommandOptionType(
  str: any
): str is keyof typeof API.ApplicationCommandOptionType {
  return API.ApplicationCommandOptionType.hasOwnProperty(str)
}

export async function reloadSLashCommands(client: core.FullClient) {
  if (
    !process.env.BOT_SECRET ||
    /^{{.+}}$/.test(process.env.BOT_SECRET as string)
  )
    return logger.warn(
      `slash commands are disabled because the ${chalk.bold(
        "BOT_SECRET"
      )} environment variable is missing.`,
      "handler"
    )

  refreshInterval = setTimeout(() => {
    reloadSLashCommands(client).catch((error) => {
      clearTimeout(refreshInterval)
      logger.error(error, "handler", true)
    })
  }, 1000 * 60 * 60)

  usable = true

  const accessToken = await getSlashCommandAccessToken(
    client.user.id,
    process.env.BOT_SECRET
  )

  const slashCommands = await fetchSlashCommands(client.user.id, accessToken)

  for (const [name, command] of _command.commands) {
    if (
      !command.options.isSlash ||
      command.options.parent ||
      slashCommands.some((cmd) => cmd.name === name)
    )
      continue

    let slashCommand = command.options.slash ?? {
      name: command.options.name,
      description: command.options.description,
      options: [],
    }

    if (command.options.flags)
      for (const flag of command.options.flags)
        slashCommand.options?.push({
          name: flag.name,
          description: flag.description,
          type: API.ApplicationCommandOptionType.BOOLEAN,
        })

    for (const option of [
      ...(command.options.options ?? []),
      ...(command.options.positional ?? []),
    ]) {
      let type = API.ApplicationCommandOptionType.STRING

      if (typeof option.castValue === "string") {
        const temp = option.castValue.toUpperCase()
        if (isApplicationCommandOptionType(temp))
          // @ts-ignore
          type = API.ApplicationCommandOptionType[temp]
      }

      slashCommand.options?.push({
        name: option.name,
        description: option.description,
        type,
        required: await core.scrap(option.required),
        choices: Array.isArray(option.checkValue)
          ? option.checkValue.map((value) => {
              return { name: value, value }
            })
          : undefined,
      })
    }

    if (command.options.subs)
      for (const sub of command.options.subs)
        if (slashCommand) {
          const options = subCommandsToSlashCommandOptions(command)
          if (options) slashCommand.options?.push(...options)
        }

    command.options.slash = slashCommand

    await postSlashCommand(client.user.id, accessToken, slashCommand)
  }
}
