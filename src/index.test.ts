/*global process*/

process.env.BOT_MODE = "test"

import database from "#core/database"
import { cronHandler } from "#core/cron"
import { buttonHandler } from "#core/button"
import { commandHandler } from "#core/command"
import { slashCommandHandler } from "#core/slash"
import { listenerHandler } from "#core/listener"
import { initPagination } from "#core/pagination"
import { checkUpdates } from "#core/util"
import logger from "#core/logger"

try {
  await cronHandler.init()
  await database.handler.init()
  await buttonHandler.init()
  await commandHandler.init()
  await slashCommandHandler.init()
  await listenerHandler.init()
  await initPagination()
  await checkUpdates()

  logger.success("no bugs found")
  process.exit(0)
} catch (error: any) {
  logger.error(error, "src/index.test.ts", true)
  process.exit(1)
}
