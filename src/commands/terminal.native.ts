// native file, if you want edit it, remove the "native" suffix from the filename

import cp from "child_process"

import * as app from "#app"

export default new app.Command({
  name: "terminal",
  description: "Run shell command from Discord",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  channelType: "all",
  botOwnerOnly: true,
  cooldown: {
    duration: 5000,
    type: app.CooldownType.Global,
  },
  rest: {
    all: true,
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    message.triggerCoolDown()

    const toEdit = await message.channel.send(
      await app.getSystemMessage("loading", "The process is running..."),
    )

    let systemMessage: app.SystemMessage

    try {
      const output = cp.execSync(message.rest, {
        cwd: process.cwd(),
        encoding: "utf-8",
      })

      systemMessage = await app.getSystemMessage(
        "success",
        {
          header: "The process is done",
          body: output.split("").reverse().slice(0, 2000).reverse().join(""),
        },
        { code: true },
      )
    } catch (error: any) {
      systemMessage = await app.getSystemMessage("error", {
        header: "The process is errored",
        body: error,
      })
    }

    toEdit.edit(systemMessage).catch(() => {
      message.channel.send(systemMessage).catch()
    })
  },
})
