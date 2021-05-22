import * as app from "../app"
import cp from "child_process"

let sp: cp.ChildProcess | null = null

const command: app.Command = {
  name: "terminal",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  description: "Run shell command from Discord",
  botOwnerOnly: true,
  coolDown: 5000,
  rest: {
    all: true,
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    message.triggerCoolDown()

    const toEdit = await message.channel.send(
      new app.MessageEmbed().setTitle("The process is running...")
    )

    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const output = err
        ? err.stack ?? err.message
        : stderr.trim() || stdout || null

      const embed = new app.MessageEmbed().setTitle(
        err ? "\\❌ An error has occurred." : "\\✔ Successfully executed."
      )

      if (output)
        embed.setDescription(
          app.code.stringify({
            content: output
              .split("")
              .reverse()
              .slice(0, 2000)
              .reverse()
              .join(""),
          })
        )

      toEdit.edit(embed).catch(() => {
        message.channel.send(embed).catch()
      })
    })
  },
  subs: [
    {
      name: "spawn",
      aliases: ["sp", "watch"],
      description: "Watch shell command",
      rest: {
        all: true,
        name: "cmd",
        description: "The cmd to run",
        required: true,
      },
      async run(message) {
        message.triggerCoolDown()

        const embed = new app.MessageEmbed().setTitle("The process is running...")
        const toEdit = await message.channel.send(embed)

        const editInterval = 2000
        const logs: string[] = []
        let lastEdit = Date.now()

        const edit = async (e = embed) => {
          return toEdit.edit(e).catch(() => message.channel.send(e).catch())
        }

        sp = cp.spawn(message.rest, [], { cwd: process.cwd(), shell: true })

        sp.stdout.on("data", (data) => {
          logs.push(`log: ${data}`.trim())
        })

        sp.stderr.on("data", (data) => {
          logs.push(`err: ${data}`.trim())
        })

        sp.on("close", (code) => {
          edit(embed.setTitle(
            (code !== null && code > 0) ? "\\❌ An error has occurred." : "\\✔ Successfully executed."
          ))
        })
      }
    },
    {
      name: "kill",
      aliases: ["exit", "stop"],
      description: "Stop the spawned process",
      async run(message){

      }
    },
  ]
}

module.exports = command
