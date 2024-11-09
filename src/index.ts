import * as button from "#core/button.ts"
import client from "#core/client.ts"
import * as command from "#core/command.ts"
import * as cron from "#core/cron.ts"
import database from "#core/database.ts"
import env from "#core/env.ts"
import * as listener from "#core/listener.ts"
import logger from "#core/logger.ts"
import * as pagination from "#core/pagination.ts"
import * as slash from "#core/slash.ts"
import * as util from "#core/util.ts"

try {
  await cron.cronHandler.init()
  await database.init()
  await button.buttonHandler.init()
  await command.commandHandler.init()
  await slash.slashCommandHandler.init()
  await listener.listenerHandler.init()
  await pagination.initPagination()
  await util.checkUpdates()
  await client.login(env.BOT_TOKEN)
} catch (error: any) {
  logger.error(error, "src/index.js", true)
  process.exit(1)
}
