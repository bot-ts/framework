import url from "url"
import chalk from "chalk"
import axios, { AxiosResponse } from "axios"

import API from "discord-api-types/v8"
import discord from "discord.js"

import * as core from "./core"
import * as logger from "./logger"
import * as _command from "./command"

export const slashState: {
  usable: boolean
  accessToken: string | null
  refreshInterval: NodeJS.Timeout | null
} = {
  usable: true,
  accessToken: null,
  refreshInterval: null,
}

export const slashCommandNames = new Set<string>()

export const slashCommandHandler = {
  load: async (client: core.FullClient) => {
    await initSlashState(client)

    if (!slashState.usable) return

    for (const [name, command] of _command.commands) {
      let slashCommand = command.slash

      if (command.isSlash && !slashCommand)
        if (slashState.usable) {
          if (!slashCommandNames.has(name) && !command.path)
            slashCommand = {
              id: discord.SnowflakeUtil.generate() as `${bigint}`,
              application_id: client.user.id,
              name: command.name,
              description: command.description,
              options: [],
            }
        } else {
          logger.warn(
            `slash command system is used on ${chalk.bold(
              ((command.path ? command.path + " " : "") + command.name).replace(
                /\s+/g,
                "/"
              )
            )} command!`,
            "handler"
          )
        }

      if (!slashCommand) return

      if (command.flags)
        for (const flag of command.flags)
          slashCommand.options?.push({
            name: flag.name,
            description: flag.description,
            type: API.ApplicationCommandOptionType.BOOLEAN,
          })

      for (const option of [
        ...(command.options ?? []),
        ...(command.positional ?? []),
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

      if (command.subs)
        for (const sub of command.subs)
          if (slashCommand) {
            const options = subCommandsToSlashCommandOptions(command)
            if (options) slashCommand.options?.push(...options)
          }

      command.slash = slashCommand

      await postSlashCommand(client.user.id, slashCommand)
    }
  },
}

export async function initSlashState(client: core.FullClient) {
  if (!process.env.SECRET || /^{{.+}}$/.test(process.env.SECRET as string)) {
    slashState.usable = false
    logger.warn(
      `slash commands are disabled because the ${chalk.bold(
        "SECRET"
      )} environment variable is missing.`,
      "handler"
    )
  } else {
    slashState.accessToken = await getSlashCommandsToken(
      client.user.id,
      process.env.SECRET
    )
    ;(await getAlreadyInitSlashCommandNames(client.user.id)).forEach((name) => {
      slashCommandNames.add(name)
    })
  }
}

export function getSlashCommandsToken(
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

export async function getAlreadyInitSlashCommandNames(clientId: string) {
  return axios(`https://discord.com/api/v8/applications/${clientId}/commands`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${slashState.accessToken}`,
    },
  }).then((res: AxiosResponse<API.APIApplicationCommand[]>) =>
    res.data.map((cmd) => cmd.name)
  )
}

export async function postSlashCommand(
  clientId: `${bigint}`,
  slashCommand: API.APIApplicationCommand
) {
  axios
    .post(
      `https://discord.com/api/v8/applications/${clientId}/commands`,
      slashCommand,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${slashState.accessToken}`,
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
  Message extends _command.CommandMessage
>(
  cmd: _command.Command<Message>,
  depth: number = 0,
  parent?: API.APIApplicationCommandOption
): API.APIApplicationCommandOption[] | undefined {
  const output: API.APIApplicationCommandOption[] = []
  if (cmd.subs) {
    for (const sub of cmd.subs) {
      const option: API.APIApplicationCommandOption = {
        name: sub.name,
        description: sub.description,
        type: API.ApplicationCommandOptionType.SUB_COMMAND_GROUP,
      }

      option.options = subCommandsToSlashCommandOptions(sub, depth + 1, option)

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
