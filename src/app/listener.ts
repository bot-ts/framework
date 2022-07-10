import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8.js"

import * as handler from "@ghom/handler"
import * as logger from "./logger.js"

import client from "./client.js"

export const listenerHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "listeners")
)

listenerHandler.on("load", async (filepath) => {
  const file = await import("file://" + filepath)
  const listener: Listener<any> = file.default

  client[listener.once ? "once" : "on"](listener.event, async (...args) => {
    try {
      await listener.run(...args)
    } catch (error: any) {
      logger.error(error, filepath, true)
    }
  })

  const sub = path.basename(filepath, ".js").replace(`${listener.event}.`, "")

  logger.log(
    `loaded listener ${chalk.yellow(
      listener.once ? "once" : "on"
    )} ${chalk.blueBright(listener.event)}${
      sub !== listener.event ? ` ${chalk.green(sub)}` : ""
    } ${chalk.grey(listener.description)}`
  )
})

export interface MoreClientEvents {
  raw: [packet: apiTypes.GatewayDispatchPayload]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type Listener<EventName extends keyof AllClientEvents> = {
  event: EventName
  description: string
  run: (...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
