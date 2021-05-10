import url from "url"
import axios, { AxiosResponse } from "axios"
import API from "discord-api-types/v8"
import discord from "discord.js"

import * as core from "./core"
import * as logger from "./logger"
import chalk from "chalk"

export const slashState: {
  usable: boolean
  accessToken: string | null
} = {
  usable: true,
  accessToken: null,
}

export const slashCommandNames = new Set<string>()

export async function initSlashState(client: discord.Client) {
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
      core.coreState.clientId,
      process.env.SECRET
    )
    ;(await getAlreadyInitSlashCommandNames(core.coreState.clientId)).forEach(
      (name) => {
        slashCommandNames.add(name)
      }
    )
  }
}

export function getSlashCommandsToken(
  clientID: string,
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
        `${clientID}:${clientSecret}`
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
  slashCommand: API.APIApplicationCommand
) {
  axios
    .post(
      `https://discord.com/api/v8/applications/${core.coreState.clientId}/commands`,
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
