import * as app from "#app"

const listener: app.Listener<"ready"> = {
  event: "ready",
  description: "Deploy slash commands everywhere",
  async run() {
    return app.registerSlashCommands()
  },
}

export default listener
