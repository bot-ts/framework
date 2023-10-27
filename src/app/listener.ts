// system file, please don't modify it

import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8.js"

import * as handler from "@ghom/handler"

import * as logger from "./logger.js"
import client from "./client.js"

export const listenerHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "listeners"),
  {
    pattern: /\.js$/,
    onLoad: async (filepath) => {
      const file = await import("file://" + filepath)
      const listener: Listener<any> = file.default

      client[listener.once ? "once" : "on"](listener.event, async (...args) => {
        try {
          await listener.run(...args)
        } catch (error: any) {
          logger.error(error, filepath, true)
        }
      })

      const isNative = filepath.includes(".native.")

      const category = path
        .basename(filepath, ".js")
        .replace(`${listener.event}.`, "")
        .split(".")
        .filter((x) => x !== "native" && x !== listener.event)
        .join(" ")

      logger.log(
        `loaded listener ${chalk.magenta(category)} ${chalk.yellow(
          listener.once ? "once" : "on",
        )} ${chalk.blueBright(listener.event)}${
          isNative ? ` ${chalk.green("native")}` : ""
        } ${chalk.grey(listener.description)}`,
      )
    },
  },
)

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
