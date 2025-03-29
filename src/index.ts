import * as app from "#all"

try {
	await app.cronHandler.init()
	await app.database.init()
	await app.buttonHandler.init()
	await app.commandHandler.init()
	await app.slashCommandHandler.init()
	await app.listenerHandler.init()
	await app.initPagination()
	await app.checkUpdates()

	await app.client.login(app.env.BOT_TOKEN)
} catch (error: any) {
	app.error(error, "src/index.ts", true)
	process.exit(1)
}
