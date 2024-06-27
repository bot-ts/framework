// eslint-disable-next-line no-undef
process.env.BOT_MODE = "test"

const app = await import("#app")

try {
  await app.database.handler.init()
  await app.commandHandler.init()
  await app.slashCommandHandler.init()
  await app.listenerHandler.init()
  await app.initPagination()
  await app.checkUpdates()

  app.log("correctly started")
  // eslint-disable-next-line no-undef
  process.exit(0)
} catch (error) {
  app.error(error, "index", true)
  // eslint-disable-next-line no-undef
  process.exit(1)
}
