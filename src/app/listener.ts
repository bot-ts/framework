import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8.js"

import * as logger from "./logger.js"
import * as handler from "./handler.js"
import * as core from "./core.js"

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
  run: (this: core.FullClient, ...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
