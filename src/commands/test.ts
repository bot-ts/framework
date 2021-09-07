import * as app from "../app.js"

export default new app.Command({
  name: "test",
  description: "The test command",
  channelType: "all",
  options: [
    {
      name: "toCast",
      description: "Option to cast",
      castValue: "number",
      required: true,
      checkCastedValue: (casted: number) => {
        return casted > 3 || "Not better than 3"
      },
    },
  ],
  async run(message) {
    return message.send("success")
  },
})
