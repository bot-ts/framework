// system file, please don't modify it

import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8.js"

import * as handler from "@ghom/handler"

import * as logger from "./logger.js"
import client from "./client.js"

const readyListeners = new discord.Collection<Listener<"ready">, boolean>()
const allListeners = new discord.Collection<string, Listener<any>["run"]>()

export const listenerHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "listeners"),
  {
    pattern: /\.js$/,
    hotReload: true,
    loader: async (filepath) => {
      const file = await import("file://" + filepath)
      return file.default as Listener<any>
    },
    reloader: async (filepath) => {
      const file = await import(`file://${filepath}?update=${Date.now()}`)
      return file.default as Listener<any>
    },
    onLoad: async (filepath, listener) => {
      if (listener!.event === "ready") readyListeners.set(listener!, false)

      if (allListeners.has(filepath)) {
        client.removeListener(listener!.event, allListeners.get(filepath)!)
      }

      const run: Listener<any>["run"] = async (...args) => {
        try {
          await listener!.run(...args)

          if (listener!.event === "ready") {
            readyListeners.set(listener!, true)

            if (readyListeners.every((launched) => launched)) {
              client.emit("afterReady", ...args)
            }
          }
        } catch (error: any) {
          logger.error(error, filepath, true)
        }
      }

      allListeners.set(filepath, run)

      client[listener!.once ? "once" : "on"](
        listener!.event,
        allListeners.get(filepath) as any,
      )

      const isNative = filepath.includes(".native.")

      const category = path
        .basename(filepath, ".js")
        .replace(`${listener!.event}.`, "")
        .split(".")
        .filter((x) => x !== "native" && x !== listener!.event)
        .join(" ")

      logger.log(
        `loaded listener ${chalk.magenta(category)} ${chalk.yellow(
          listener!.once ? "once" : "on",
        )} ${chalk.blueBright(listener!.event)}${
          isNative ? ` ${chalk.green("native")}` : ""
        } ${chalk.grey(listener!.description)}`,
      )
    },
  },
)

export interface MoreClientEvents {
  raw: [packet: apiTypes.GatewayDispatchPayload]
  afterReady: [discord.Client<true>]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type Listener<EventName extends keyof AllClientEvents> = {
  event: EventName
  description: string
  run: (...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
