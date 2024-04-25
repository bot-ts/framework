// system file, please don't modify it

import url from "url"
import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import apiTypes from "discord-api-types/v8.js"

import * as handler from "@ghom/handler"

import * as logger from "./logger.js"
import * as client from "./client.js"

const readyListeners = new discord.Collection<Listener<"ready">, boolean>()

export const listenerHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "listeners"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import(url.pathToFileURL(filepath).href)
      return file.default as Listener<any>
    },
    onLoad: async (filepath, listener) => {
      const clientInstance = client.ClientSingleton.get()

      if (listener.event === "ready") readyListeners.set(listener, false)

      clientInstance[listener.once ? "once" : "on"](
        listener.event,
        async (...args) => {
          try {
            await listener.run(...args)

            if (listener.event === "ready") {
              readyListeners.set(listener, true)

              if (readyListeners.every((launched) => launched)) {
                clientInstance.emit("afterReady", ...args)
              }
            }
          } catch (error: any) {
            logger.error(error, filepath, true)
          }
        },
      )

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
  afterReady: [discord.Client<true>]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type Listener<EventName extends keyof AllClientEvents> = {
  event: EventName
  description: string
  run: (...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}
