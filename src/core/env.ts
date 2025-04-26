import dotenv from "dotenv"

import fs from "node:fs"
import util from "node:util"
import { z } from "zod"

import { config } from "#config"
import * as logger from "#core/logger"
import { rootPath } from "#core/util"

dotenv.config({
	path: rootPath(".env"),
	override: false,
})

const localeList: { key: string; name: string }[] = JSON.parse(
	fs.readFileSync(rootPath("node_modules", "dayjs", "locale.json"), "utf-8"),
)

const localeKeys = localeList.map((locale) => locale.key) as [
	string,
	...string[],
]

const timezones = Intl.supportedValuesOf("timeZone") as [string, ...string[]]

const envSchema = z.object({
	BOT_TOKEN: z.string({
		message: `You need to add your ${util.styleText(
			"bold",
			"BOT_TOKEN",
		)} in the .env file. You can found this token on this page in the "Bot" tab: ${
			process.env.BOT_ID
				? `https://discord.com/developers/applications/${process.env.BOT_ID}/information`
				: "https://discord.com/developers/applications"
		}`,
	}),
	BOT_PREFIX: z.string({
		message: `You need to add a ${util.styleText(
			"bold",
			"BOT_PREFIX",
		)} in the .env file, for example: BOT_PREFIX="!"`,
	}),
	BOT_OWNER: z.string({
		message: `You need to add your ${util.styleText(
			"bold",
			"BOT_OWNER",
		)} Discord ID in the .env file, for example: BOT_OWNER="123456789012345678"`,
	}),
	BOT_ID: z.string({
		message: `You need to add the ${util.styleText(
			"bold",
			"BOT_ID",
		)} in the .env file. You can found this ID on this page in the "General Information" tab: ${
			process.env.BOT_ID
				? `https://discord.com/developers/applications/${process.env.BOT_ID}/information`
				: "https://discord.com/developers/applications"
		}`,
	}),
	BOT_NAME: z.string({
		message: `You need to add a ${util.styleText(
			"bold",
			"BOT_NAME",
		)} in the .env file, for example: BOT_NAME="my-discord-bot"`,
	}),
	BOT_MODE: z.enum(["factory", "test", "development", "production"], {
		message: `You need to add a ${util.styleText(
			"bold",
			"BOT_MODE",
		)} in the .env file, for example: BOT_MODE="development"`,
	}),
	BOT_GUILD: z.string().optional(),
	BOT_LOCALE: z
		.enum(localeKeys, {
			message: `Your ${util.styleText(
				"bold",
				"BOT_LOCALE",
			)} in the .env file is not valid. You can choose between this list:\n=> ${localeKeys.join(
				", ",
			)}`,
		})
		.optional(),
	BOT_TIMEZONE: z
		.enum(timezones, {
			message: `Your ${util.styleText(
				"bold",
				"BOT_TIMEZONE",
			)} in the .env file is not valid. You can choose between this list:\n=> ${timezones.join(
				", ",
			)}`,
		})
		.optional(),
	DB_PORT: z.coerce
		.number({
			message: `The ${util.styleText(
				"bold",
				"DB_PORT",
			)} must be a valid port number between 0 and 65535`,
		})
		.max(
			65535,
			`The ${util.styleText(
				"bold",
				"DB_PORT",
			)} must be a valid port number between 0 and 65535`,
		)
		.optional(),
	DB_HOST: z.string().optional(),
	DB_USER: z.string().optional(),
	DB_PASSWORD: z.string().optional(),
	DB_DATABASE: z.string().optional(),
	RUNTIME: z.enum(["node", "deno", "bun"], {
		message: `You need to add a ${util.styleText(
			"bold",
			"RUNTIME",
		)} in the .env file, for example: RUNTIME="node". You can choose between this list:\n=> node, deno, bun`,
	}),
	PACKAGE_MANAGER: z.enum(["npm", "yarn", "pnpm", "bun", "deno"], {
		message: `You need to add a ${util.styleText(
			"bold",
			"PACKAGE_MANAGER",
		)} in the .env file, for example: PACKAGE_MANAGER="yarn". You can choose between this list:\n=> npm, yarn, pnpm, bun`,
	}),
})

type CustomSchema = (typeof config)["options"]["envSchema"]

type Env = z.infer<typeof envSchema> & z.infer<CustomSchema>

let env: Env

if (process.env.BOT_MODE !== "test") {
	try {
		env = {
			...envSchema.parse(process.env),
			...("envSchema" in config.options
				? config.options.envSchema?.parse(process.env)
				: {}),
		} as Env
	} catch (error) {
		const { errors } = error as z.ZodError
		errors.forEach((err) => logger.error(err.message, ".env"))
		process.exit(1)
	}
} else {
	env = process.env as unknown as Env
}

export default env
