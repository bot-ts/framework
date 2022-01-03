import knex from "knex"
import path from "path"
import fs from "fs"

const dataDirectory = path.join(process.cwd(), "data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

/**
 * Welcome to the database file!
 * You can get the docs of **knex** [here](http://knexjs.org/)
 */

export const db = knex({
  client: "sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: path.join(dataDirectory, "sqlite3.db"),
  },
})
