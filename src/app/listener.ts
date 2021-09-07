import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8"

import * as logger from "./logger.js"
import * as handler from "./handler.js"

export const listenerHandler = new handler.Handler(
  process.env.BOT_LISTENERS_PATH ??
    path.join(process.cwd(), "dist", "listeners")
)

listenerHandler.on("load", async (filepath, client) => {
  const file = await import("file://" + filepath)
  const listener = file.default as Listener<any>
  client[listener.once ? "once" : "on"](listener.event, async (...args) => {
    try {
      await listener.run.bind(client)(...args)
    } catch (error: any) {
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

export interface MoreClientEvents {
  raw: [packet: apiTypes.GatewayDispatchPayload]
  clickButton: [button: discord.MessageComponent]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type Listener<EventName extends keyof AllClientEvents> = {
  event: EventName
  run: (this: discord.Client, ...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
