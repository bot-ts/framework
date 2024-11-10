/*global process*/

process.env.BOT_MODE = "test"

import * as core from "#all"

try {
  await core.cronHandler.init()
  await core.database.handler.init()
  await core.buttonHandler.init()
  await core.commandHandler.init()
  await core.slashCommandHandler.init()
  await core.listenerHandler.init()
  await core.initPagination()
  await core.checkUpdates()

  core.success("no bugs found")
  process.exit(0)
} catch (error) {
  core.error(error, "index", true)
  process.exit(1)
}
