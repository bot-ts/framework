import * as app from "../app"

const table = new app.Table<{
  guild_id: string
  prefix: string
}>({
  name: "prefixes",
  colMaker: (table) => {
    table.string("guild_id").unique()
    table.string("prefix")
  },
})

export default table
