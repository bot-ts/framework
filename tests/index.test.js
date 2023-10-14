const app = await import("../dist/app.js")

try {
  await app.orm.init()
  await app.commandHandler.init()
  await app.listenerHandler.init()

  app.log("Correctly started")
  process.exit(0)
} catch (error) {
  app.error(error, "index", true)
  process.exit(1)
}
