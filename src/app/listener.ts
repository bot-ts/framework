import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8"
import * as discordButtons from "discord-buttons"

import * as logger from "./logger"
import * as handler from "./handler"

export const listenerHandler = new handler.Handler(
  process.env.BOT_LISTENERS_PATH ??
    path.join(process.cwd(), "dist", "listeners")
)

listenerHandler.once("finish", (pathList, client) => {
  pathList.forEach((filepath) => {
    const listener = require(filepath)
    client[listener.once ? "once" : "on"](listener.event, async (...args) => {
      try {
        await listener.run.bind(client)(...args)
      } catch (error) {
        logger.error(error, "handler")
      }
    })
    logger.log(
      `loaded listener ${chalk.yellow(
        listener.once ? "once" : "on"
      )} ${chalk.blueBright(listener.event)}`,
      "handler"
    )
  })
})

export interface MoreClientEvents {
  raw: [packet: apiTypes.GatewayDispatchPayload]
  clickButton: [button: discordButtons.MessageComponent]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type Listener<EventName extends keyof AllClientEvents> = {
  event: EventName
  run: (this: discord.Client, ...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
