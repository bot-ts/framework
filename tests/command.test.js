export async function test(app, testerChannel, testedChannel) {
  for (const [name, command] of app.commands) {
    if (!command.tests) continue

    try {
      for (const test of command.tests) {
        const result = await test.run(testerChannel, testedChannel)

        if (typeof result === "string") app.error(result, `command: ${name}`)
        else app.log("✔", `command: ${name}`)
      }
    } catch (error) {
      app.error(error, "command.test", true)
    }
  }
}
