import * as app from "../app"

export interface Guild {
  id: string
  prefix: string
}

const table = new app.Table<Guild>({
  name: "guilds",
  setup: (table) => {
    table.string("id").unique()
    table.string("prefix").nullable()
  },
})

export default table
