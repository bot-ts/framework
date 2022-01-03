import * as app from "../app.js"

export interface Guild {
  id: string
  prefix: string
}

export default new app.Table<Guild>({
  name: "guilds",
  description: "Represent a guild",
  migrations: {
    1: (table) => {
      // you can use migrations for add columns to your created tables
    },
  },
  setup: (table) => {
    table.string("id").unique()
    table.string("prefix").nullable()
  },
})
