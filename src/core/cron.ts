import * as handler from "@ghom/handler"

import url from "node:url"
import discord from "discord.js"
import cron from "node-cron"

import env from "#core/env"
import logger from "#core/logger"
import * as util from "#core/util"

import { styleText } from "node:util"

export class CRON_Error extends Error {
	constructor(message: string) {
		super(message)
		this.name = "CRON_Error"
	}
}

export const cronHandler = new handler.Handler<Cron>(util.srcPath("cron"), {
	pattern: /\.[tj]s$/,
	loader: async (filepath) => {
		const file = await import(url.pathToFileURL(filepath).href)
		if (file.default instanceof Cron) return file.default
		throw new CRON_Error(`${filepath}: default export must be a Cron instance`)
	},
	onLoad: async (filepath, button) => {
		button.native = /.native.[jt]s$/.test(filepath)
		button.filepath = filepath
		cronList.add(button)
	},
})

export const cronList = new (class CronCollection extends discord.Collection<
	string,
	Cron
> {
	add(cron: Cron): this {
		this.validate(cron)
		return this.set(cron.options.name, cron)
	}

	validate(cron: Cron): void | never {
		// cron has good format
		cronConfigToPattern(cron.options.schedule)

		Object.defineProperty(cron.options.run, "name", {
			value: util.generateDebugName({
				name: cron.options.name,
				type: "cron",
			}),
		})

		logger.log(
			`loaded cron ${styleText("blueBright", cron.options.name)}${
				cron.native ? ` ${styleText("green", "native")}` : ""
			} ${styleText("grey", cron.options.description)}`,
		)
	}
})()

export interface CronOptions {
	name: string
	description: string
	schedule: CronIntervalKey | CronIntervalSimple | CronIntervalAdvanced
	runOnStart?: boolean
	run(this: Cron): unknown
}

export class Cron {
	task?: cron.ScheduledTask
	native?: boolean
	filepath?: string

	ranCount = 0

	constructor(public options: CronOptions) {}

	stop() {
		if (this.task) this.task.stop()
	}

	start() {
		if (this.task) this.task.start()
		else
			this.task = cron.schedule(
				cronConfigToPattern(this.options.schedule),
				() => {
					this.options.run.bind(this)()
					this.ranCount++
				},
				{
					name: this.options.name,
					timezone: env.BOT_TIMEZONE,
					runOnInit: this.options.runOnStart,
				},
			)
	}
}

export enum CronDayOfWeek {
	Sunday = 0,
	Monday = 1,
	Tuesday = 2,
	Wednesday = 3,
	Thursday = 4,
	Friday = 5,
	Saturday = 6,
}

export enum CronMonth {
	January = 1,
	February = 2,
	March = 3,
	April = 4,
	May = 5,
	June = 6,
	July = 7,
	August = 8,
	September = 9,
	October = 10,
	November = 11,
	December = 12,
}

export type CronIntervalKey =
	| "secondly"
	| "minutely"
	| "hourly"
	| "daily"
	| "weekly"
	| "monthly"
	| "yearly"

export interface CronIntervalSimple {
	type: "second" | "minute" | "hour" | "day" | "week" | "month" | "year"
	duration: number
}

/**
 * @property second from 0 to 59, or "*" for each
 * @property minute from 0 to 59, or "*" for each
 * @property hour from 0 to 23, or "*" for each
 * @property dayOfMonth from 1 to 31, or "*" for each
 * @property month from 1 to 12, or "*" for each
 * @property dayOfWeek from 0 (Sunday) to 6 (Saturday), or "*" for each
 */
export interface CronIntervalAdvanced {
	second?: number | "*"
	minute?: number | "*"
	hour?: number | "*"
	dayOfMonth?: number | "*"
	month?: CronMonth | "*"
	dayOfWeek?: CronDayOfWeek | "*"
}

export function cronConfigToPattern(config: CronOptions["schedule"]): string {
	if (typeof config === "string") return cronKeyToPattern(config)

	if ("type" in config) return cronSimpleToPattern(config)

	if (
		typeof config.dayOfMonth === "number" &&
		(config.dayOfMonth < 1 || config.dayOfMonth > 31)
	)
		throw new CRON_Error("Invalid day of month")

	if (typeof config.hour === "number" && (config.hour < 0 || config.hour > 23))
		throw new CRON_Error("Invalid hour")

	if (
		typeof config.minute === "number" &&
		(config.minute < 0 || config.minute > 59)
	)
		throw new CRON_Error("Invalid minute")

	if (
		typeof config.second === "number" &&
		(config.second < 0 || config.second > 59)
	)
		throw new CRON_Error("Invalid second")

	return `${config.second ?? "*"} ${config.minute ?? "*"} ${config.hour ?? "*"} ${
		config.dayOfMonth ?? "*"
	} ${config.month ?? "*"} ${config.dayOfWeek ?? "*"}`
}

export function cronKeyToPattern(key: CronIntervalKey): string {
	switch (key) {
		case "secondly":
			return "* * * * * *"
		case "minutely":
			return "0 * * * * *"
		case "hourly":
			return "0 0 * * * *"
		case "daily":
			return "0 0 0 * * *"
		case "weekly":
			return "0 0 0 * * 0"
		case "monthly":
			return "0 0 0 1 * *"
		case "yearly":
			return "0 0 0 1 1 *"
		default:
			throw new CRON_Error("Invalid cron key")
	}
}

export function cronSimpleToPattern(simple: CronIntervalSimple): string {
	if (!simple.duration || simple.duration < 0)
		throw new CRON_Error("Invalid cron's schedule duration")

	switch (simple.type) {
		case "second":
			return `*/${simple.duration} * * * * *`
		case "minute":
			return `0 */${simple.duration} * * * *`
		case "hour":
			return `0 0 */${simple.duration} * * *`
		case "day":
			return `0 0 0 */${simple.duration} * *`
		case "week":
			return `0 0 0 * * */${simple.duration}`
		case "month":
			return `0 0 0 1 */${simple.duration} *`
		case "year":
			return `0 0 0 1 1 */${simple.duration}`
		default:
			throw new CRON_Error("Invalid cron simple type")
	}
}
