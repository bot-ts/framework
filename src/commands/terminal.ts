import * as app from "../app"
import cp from "child_process"

interface Process {
  logs: string[]
  process: cp.ChildProcess
  lastUpdate: number
}

const processes = new Map<number, Process>()

const logsUpdateInterval = 2000

const command: app.Command = {
  name: "terminal",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  description: "Run shell command from Discord",
  botOwnerOnly: true,
  coolDown: 5000,
  rest: {
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  flags: [
    {
      name: "muted",
      aliases: ["mute", "silent"],
      flag: "m",
      description: "Prevent logs",
    },
  ],
  async run(message) {
    message.triggerCoolDown()

    const current: Process = {
      logs: [],
      lastUpdate: Date.now(),
      process: cp.exec(message.args.cmd, { cwd: process.cwd() }),
    }

    const embed = new app.MessageEmbed()
      .setTitle(
        `\`[${current.process.pid}]\` The process is ${
          message.args.muted ? "started" : "running"
        }.`
      )
      .setColor("BLURPLE")

    const toEdit = await message.channel.send(embed)

    const sendLogs = () => {
      toEdit
        .edit(
          embed.setDescription(
            app.code.stringify({
              content: current.logs.join("\n").trim() || "No log",
            })
          )
        )
        .catch(() => {
          message.channel.send(embed).catch()
        })
    }

    const addLog = (data: any) => {
      current.logs.push(String(data))

      while (current.logs.join("\n").length > 2000) current.logs.shift()

      if (
        !message.args.muted &&
        Date.now() - current.lastUpdate > logsUpdateInterval
      ) {
        current.lastUpdate = Date.now()

        sendLogs()
      }
    }

    current.process.stdout?.on("data", addLog)
    current.process.stderr?.on("data", addLog)

    current.process.on("error", (error) => {
      console.log("error")

      if (!message.args.muted) {
        embed.setFooter(
          "❌ " + (error.name || "") + (error.message || "An error occurred")
        )

        sendLogs()
      }
    })

    current.process.on("close", (code) => {
      processes.delete(current.process.pid)
      console.log("close")

      if (!message.args.muted) {
        if (code && code !== 0) embed.setColor("RED")

        embed.setTitle(
          `\`[${current.process.pid}]\` Process ended with exit code: ${code}`
        )

        sendLogs()
      }
    })

    processes.set(current.process.pid, current)
  },
  subs: [
    {
      name: "kill",
      aliases: ["shutdown", "down", "teardown", "out", "end"],
      botOwnerOnly: true,
      description: "Kill the process",
      positional: [
        {
          name: "pid",
          description: "Process ID",
        },
      ],
      async run(message) {},
    },
    {
      name: "list",
      aliases: ["ls", "all"],
      botOwnerOnly: true,
      description: "List watched processes",
      async run(message) {},
    },
    {
      name: "logs",
      botOwnerOnly: true,
      description: "The last logs of process",
      positional: [
        {
          name: "pid",
          description: "Process ID",
        },
      ],
      async run(message) {},
    },
  ],
}

module.exports = command
