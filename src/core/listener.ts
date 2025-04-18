// system file, please don't modify it

import path from "node:path"
import url from "node:url"
import type apiTypes from "discord-api-types/v10"
import discord from "discord.js"

import * as handler from "@ghom/handler"

import client from "#core/client"
import logger from "#core/logger"
import * as util from "#core/util"

import { styleText } from "node:util"

const readyListeners = new discord.Collection<Listener<"ready">, boolean>()

export const listenerHandler = new handler.Handler<Listener<any>>(
	util.srcPath("listeners"),
	{
		pattern: /\.[jt]s$/,
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

			const isNative = /.native.[jt]s$/.test(filepath)

			const category = path
				.basename(filepath.replace(/.[jt]s$/, ""))
				.replace(`${listener.options.event}.`, "")
				.split(".")
				.filter((x) => x !== "native" && x !== listener.options.event)
				.join(" ")

			Object.defineProperty(listener.options.run, "name", {
				value: util.generateDebugName({
					name: listener.options.event,
					type: "listener",
					category,
				}),
			})

			logger.log(
				`loaded listener ${styleText("magenta", category)} ${styleText(
					"yellow",
					listener.options.once ? "once" : "on",
				)} ${styleText("blueBright", listener.options.event)}${
					isNative ? ` ${styleText("green", "native")}` : ""
				} ${styleText("grey", listener.options.description)}`,
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
