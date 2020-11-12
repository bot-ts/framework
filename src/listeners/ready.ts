import * as app from "../app"

const listener: app.Listener<"ready"> = {
  event: "ready",
  once: true,
  async call() {
    console.log("Ok i'm ready!")
  },
}

module.exports = listener
