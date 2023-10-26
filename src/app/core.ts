// system file, please don't modify it

import axios from "axios"
import dayjs from "dayjs"
import chalk from "chalk"
import utc from "dayjs/plugin/utc.js"
import relative from "dayjs/plugin/relativeTime.js"
import timezone from "dayjs/plugin/timezone.js"
import toObject from "dayjs/plugin/toObject.js"
import discord from "discord.js"
import EventEmitter from "events"

import * as logger from "./logger.js"
import * as util from "./util.js"

export async function checkUpdates() {
  // fetch latest bot.ts codebase
  const removeJSON = await axios
    .get(
      "https://raw.githubusercontent.com/bot-ts/framework/master/package.json"
    )
    .then((res) => res.data)

  if (util.packageJSON.version !== removeJSON.version) {
    logger.warn(
      `a new major version of ${chalk.blue(
        "bot.ts"
      )} is available: ${chalk.magenta(
        util.packageJSON.version
      )} => ${chalk.magenta(removeJSON.version)}`
    )
    logger.warn(
      `you can update ${chalk.blue("bot.ts")} by running ${chalk.bgWhite.black(
        `gulp update`
      )}`
    )
    logger.warn(chalk.bold(`this update may break your bot!`))
  } else if (
    util.packageJSON.devDependencies["make-bot.ts"] !==
    removeJSON.devDependencies["make-bot.ts"]
  ) {
    logger.warn(
      `a new version of ${chalk.blue("make-bot.ts")} is available: ${
        util.packageJSON.devDependencies["make-bot.ts"]
      } => ${chalk.blue(removeJSON.devDependencies["make-bot.ts"])}`
    )
    logger.warn(
      `you can update ${chalk.blue(
        "make-bot.ts"
      )} by running ${chalk.bgWhite.black(`gulp update`)}`
    )
    logger.warn(chalk.bold(`this update may break your bot!`))
  } else {
    logger.log(
      `you are using the latest version of ${chalk.blue(
        "bot.ts"
      )} and ${chalk.blue("make-bot.ts")}`
    )
  }
}

const locale = process.env.BOT_LOCALE

import(`dayjs/locale/${locale ?? "en"}.js`)
  .then(() => dayjs.locale(locale ?? "en"))
  .catch(() =>
    logger.warn(
      `The ${chalk.bold(
        locale
      )} locale is incorrect, please use an existing locale code.`
    )
  )

dayjs.extend(utc)
dayjs.extend(relative)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (process.env.BOT_TIMEZONE) dayjs.tz.setDefault(process.env.BOT_TIMEZONE)

export { dayjs }

export interface EventEmitters {
  message:
    | discord.TextBasedChannel
    | discord.User
    | discord.GuildMember
    | discord.Guild
}

export const messageEmitter = new EventEmitter()
