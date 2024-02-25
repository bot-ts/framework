process.env.BOT_MODE = "test"

const app = await import("../dist/app.js")

try {
  await app.orm.init()
  await app.commandHandler.init()
  await app.slashCommandHandler.init()
  await app.listenerHandler.init()
  await app.checkUpdates()

  app.log("correctly started")
  process.exit(0)
} catch (error) {
  app.error(error, "index", true)
  process.exit(1)
}
