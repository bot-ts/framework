import * as app from "../app"
import cp from "child_process"

interface Process {
  logs: string[]
  process: cp.ChildProcess
  lastUpdate: number
  message?: app.Message
  embed: app.MessageEmbed
}

const processes = new app.Collection<number, Process>()

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

    const args: string[] = message.args.cmd.split(/\s+/)

    const current: Process = {
      logs: [],
      lastUpdate: Date.now(),
      process: cp.spawn(args[0], args.slice(1), { cwd: process.cwd() }),
      embed: new app.MessageEmbed().setColor("BLURPLE"),
    }

    current.embed.setTitle(
      `\`[${current.process.pid}]\` The process is ${
        message.args.muted ? "started" : "running"
      }.`
    )

    current.message = await message.channel.send(current.embed)

    const sendLogs = () => {
      current.message?.edit(
        current.embed.setDescription(
          app.code.stringify({
            content: current.logs.join("\n").trim() || "No log",
          })
        )
      )
        .catch(() => {
          message.channel.send(current.embed).catch()
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
        current.embed.setFooter(
          "❌ " + (error.name || "") + (error.message || "An error occurred")
        ).setColor("RED")

        sendLogs()
      }
    })

    const onCloseOrExit = (code: number | null) => {
      processes.delete(current.process.pid)
      console.log("close")

      if (!message.args.muted) {
        if (code && code !== 0) current.embed.setColor("RED")

        current.embed.setTitle(
          `\`[${current.process.pid}]\` Process ended with exit code: ${code}`
        )

        sendLogs()
      }
    }

    current.process.on("close", onCloseOrExit)
    current.process.on("exit", onCloseOrExit)

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
      async run(message) {
        if(!message.args.pid) {
          processes.forEach(p => p.process.kill(0))
        } else {
          const target = processes.get(message.args.pid)
          if(target){
            target.process.kill(0)
          }
        }
        return
      },
    },
    {
      name: "list",
      aliases: ["ls", "all"],
      botOwnerOnly: true,
      description: "List watched processes",
      async run(message) {
        return message.channel.send(app.code.stringify({
          lang: "yaml",
          content: processes.map((p, pid) => `${pid}: ${p.logs.length} lines of logs`).join("\n") || "No process"
        }))
      },
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
