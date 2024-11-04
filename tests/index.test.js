// eslint-disable-next-line no-undef
process.env.BOT_MODE = "test"

const app = await import("#app")

try {
  await app.cronHandler.init()
  await app.database.handler.init()
  await app.buttonHandler.init()
  await app.commandHandler.init()
  await app.slashCommandHandler.init()
  await app.listenerHandler.init()
  await app.initPagination()
  await app.checkUpdates()

  app.success("no bugs found")
  // eslint-disable-next-line no-undef
  process.exit(0)
} catch (error) {
  app.error(error, "index", true)
  // eslint-disable-next-line no-undef
  process.exit(1)
}
