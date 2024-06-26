import "dotenv/config"

import { z, ZodError } from "zod"
import fs from "fs"
import path from "path"
import chalk from "chalk"

import * as logger from "./logger.ts"

const localeList: { key: string; name: string }[] = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "node_modules", "dayjs", "locale.json"),
    "utf-8",
  ),
)

const localeKeys = localeList.map((locale) => locale.key) as [
  string,
  ...string[],
]

const timezones = Intl.supportedValuesOf("timeZone") as [string, ...string[]]

const envSchema = z.object({
  BOT_TOKEN: z.string({
    message: `You need to add your ${chalk.bold("BOT_TOKEN")} in the .env file. You can found this token on this page in the "Bot" tab: ${
      process.env.BOT_ID
        ? `https://discord.com/developers/applications/${process.env.BOT_ID}/information`
        : "https://discord.com/developers/applications"
    }`,
  }),
  BOT_PREFIX: z.string({
    message: `You need to add a ${chalk.bold("BOT_PREFIX")} in the .env file, for example: BOT_PREFIX="!"`,
  }),
  BOT_OWNER: z.string({
    message: `You need to add your ${chalk.bold("BOT_OWNER")} Discord ID in the .env file, for example: BOT_OWNER="123456789012345678"`,
  }),
  BOT_ID: z.string({
    message: `You need to add the ${chalk.bold("BOT_ID")} in the .env file. You can found this ID on this page in the "General Information" tab: ${
      process.env.BOT_ID
        ? `https://discord.com/developers/applications/${process.env.BOT_ID}/information`
        : "https://discord.com/developers/applications"
    }`,
  }),
  BOT_MODE: z.enum(["factory", "test", "development", "production"], {
    message: `You need to add a ${chalk.bold("BOT_MODE")} in the .env file, for example: BOT_MODE="development"`,
  }),
  BOT_LOCALE: z
    .enum(localeKeys, {
      message: `Your ${chalk.bold("BOT_LOCALE")} in the .env file is not valid. You can choose between this list:\n=> ${localeKeys.join(", ")}`,
    })
    .optional(),
  BOT_TIMEZONE: z
    .enum(timezones, {
      message: `Your ${chalk.bold("BOT_TIMEZONE")} in the .env file is not valid. You can choose between this list:\n=> ${timezones.join(", ")}`,
    })
    .optional(),
  DB_PORT: z.coerce
    .number({
      message: `The ${chalk.bold("DB_PORT")} must be a valid port number between 0 and 65535`,
    })
    .max(
      65535,
      `The ${chalk.bold("DB_PORT")} must be a valid port number between 0 and 65535`,
    )
    .optional(),
  DB_HOST: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_DATABASE: z.string().optional(),
})

let env: z.infer<typeof envSchema>

if (process.env.BOT_MODE !== "test") {
  try {
    env = envSchema.parse(process.env)
  } catch (error) {
    const { errors } = error as ZodError
    errors.forEach((err) => logger.error(err.message, ".env"))
    process.exit(1)
  }
} else {
  env = process.env as unknown as z.infer<typeof envSchema>
}

export default env
