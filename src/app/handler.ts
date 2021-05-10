import { EventEmitter } from "events"
import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import fs from "fs/promises"

import * as logger from "./logger"

export interface HandlerEvents<T> {
  success: [item: T, path: string]
  error: [error: Error, path: string]
  finish: [items: T[]]
}

export class Handler<T> extends EventEmitter.EventEmitter {
  constructor(private path: string) {
    super()
  }

  async load(client: discord.Client) {
    const dir = await fs.readdir(this.path)
  }

  on<EventName extends keyof HandlerEvents<T>>(
    event: EventName,
    callback: (...args: HandlerEvents<T>[EventName]) => void
  ): this {
    // @ts-ignore
    super.on(event, callback)
    return this
  }
}

// export async function loadFiles(this: discord.Client) {
//   // init handlers path
//   const tablesPath =
//     process.env.TABLES_PATH ?? path.join(process.cwd(), "dist", "tables")
//   const commandsPath =
//     process.env.COMMANDS_PATH ?? path.join(process.cwd(), "dist", "commands")
//   const listenersPath =
//     process.env.LISTENERS_PATH ?? path.join(process.cwd(), "dist", "listeners")
//
//   // load tables
//   await fs.readdir(tablesPath).then(async (files) => {
//     const tables = await Promise.all(
//       files.map(async (filename) => {
//         const tableFile = await import(path.join(tablesPath, filename))
//         return tableFile.default
//       })
//     )
//     return Promise.all(
//       tables
//         .sort((a, b) => {
//           return (b.options.priority ?? 0) - (a.options.priority ?? 0)
//         })
//         .map(async (table) => {
//           database.tables.set(table.options.name, await table.make())
//         })
//     )
//   })
//
//   // load commands
//   await fs
//     .readdir(commandsPath)
//     .then((files) =>
//       Promise.all(
//         files.map((filename) =>
//           command.commands.add(require(path.join(commandsPath, filename)))
//         )
//       )
//     )
//
//   // load listeners
//   await fs.readdir(listenersPath).then((files) =>
//     files.forEach((filename) => {
//       const listener = require(path.join(listenersPath, filename))
//       this[listener.once ? "once" : "on"](listener.event, listener.run)
//       logger.log(
//         `loaded listener ${chalk.yellow(
//           listener.once ? "once" : "on"
//         )} ${chalk.blueBright(listener.event)}`,
//         "handler"
//       )
//     })
//   )
// }
