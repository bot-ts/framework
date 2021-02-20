import * as app from "../app"

const listener: app.Listener<"ready"> = {
  event: "ready",
  once: true,
  async call() {
    app.log("Ok i'm ready!")
    app.warn("A warn message", "section")
    app.error("An error message", "section")
    app.success("Successful test logger!")
  },
}

module.exports = listener
