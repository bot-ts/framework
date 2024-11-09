// system file, please don't modify it

import apiTypes from "discord-api-types/v8"
import discord from "discord.js"
import path from "path"
import url from "url"
import util from "util"

import * as handler from "@ghom/handler"

import client from "./client.ts"
import logger from "./logger.ts"

const readyListeners = new discord.Collection<Listener<"ready">, boolean>()

export const listenerHandler = new handler.Handler<Listener<any>>(
  path.join(process.cwd(), "dist", "listeners"),
  {
    pattern: /\.js$/,
    loader: async (filepath) => {
      const file = await import(url.pathToFileURL(filepath).href)
      if (file.default instanceof Listener) return file.default
      throw new Error(`${filepath}: default export must be a Listener instance`)
    },
    onLoad: async (filepath, listener) => {
      if (listener.options.event === "ready")
        readyListeners.set(listener, false)

      client[listener.options.once ? "once" : "on"](
        listener.options.event,
        async (...args) => {
          try {
            await listener.options.run(...args)

            if (listener.options.event === "ready") {
              readyListeners.set(listener, true)

              if (readyListeners.every((launched) => launched)) {
                client.emit("afterReady", ...args)
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
        .replace(`${listener.options.event}.`, "")
        .split(".")
        .filter((x) => x !== "native" && x !== listener.options.event)
        .join(" ")

      logger.log(
        `loaded listener ${util.styleText(
          "magenta",
          category,
        )} ${util.styleText(
          "yellow",
          listener.options.once ? "once" : "on",
        )} ${util.styleText("blueBright", listener.options.event)}${
          isNative ? ` ${util.styleText("green", "native")}` : ""
        } ${util.styleText("grey", listener.options.description)}`,
      )
    },
  },
)

export interface MoreClientEvents {
  raw: [packet: apiTypes.GatewayDispatchPayload]
  afterReady: [discord.Client<true>]
}

export type AllClientEvents = discord.ClientEvents & MoreClientEvents

export type ListenerOptions<EventName extends keyof AllClientEvents> = {
  event: EventName
  description: string
  run: (...args: AllClientEvents[EventName]) => unknown
  once?: boolean
}

export class Listener<EventName extends keyof AllClientEvents> {
  constructor(public options: ListenerOptions<EventName>) {}
}
