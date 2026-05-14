Create a new cron job (scheduled task) for this bot.ts project.

The user will provide: a name, description, schedule, and the task to execute.

If the user hasn't provided details, ask for:
1. Cron job name (camelCase, e.g. `dailyReport`)
2. Short description
3. Schedule (see options below)
4. Should it run immediately on bot start? (yes/no)

Then create the file at `src/cron/<name>.ts` (Biome style: tabs, no semicolons, double quotes).

### Schedule options

**Interval key** (simplest):
```typescript
schedule: "minutely" // | "hourly" | "daily" | "weekly" | "monthly" | "yearly"
```

**Simple interval** (every N units):
```typescript
schedule: { type: "hour", duration: 6 } // every 6 hours
// type: "minute" | "hour" | "day" | "week" | "month" | "year"
```

**Advanced** (precise cron-style):
```typescript
import { Cron, CronDayOfWeek, CronMonth } from "#core/cron"

schedule: {
  minute: 30,              // 0-59 or "*"
  hour: 9,                 // 0-23 or "*"
  dayOfMonth: "*",         // 1-31 or "*"
  month: "*",              // 1-12 or CronMonth enum or "*"
  dayOfWeek: CronDayOfWeek.Monday, // 0-6 or CronDayOfWeek enum or "*"
}
```

### Basic example

```typescript
import { Cron } from "#core/cron"

export default new Cron({
  name: "daily-report",
  description: "Sends the daily activity report",
  schedule: "daily",
  runOnStart: false,
  async run() {
    // todo: implement report logic
  },
})
```

### Advanced example (every Monday at 9:30 AM)

```typescript
import { Cron, CronDayOfWeek } from "#core/cron"

export default new Cron({
  name: "weekly-digest",
  description: "Sends weekly digest every Monday at 9:30 AM",
  schedule: {
    minute: 30,
    hour: 9,
    dayOfWeek: CronDayOfWeek.Monday,
  },
  runOnStart: false,
  async run() {
    // todo: send weekly digest
  },
})
```

### Example accessing Discord client

```typescript
import { Cron } from "#core/cron"
import * as app from "#all"

export default new Cron({
  name: "status-update",
  description: "Updates bot status every hour",
  schedule: "hourly",
  runOnStart: true,
  async run() {
    app.client.user?.setActivity(`Serving ${app.client.guilds.cache.size} servers`)
  },
})
```

### Rules

- File name should match the cron `name` in kebab-case or camelCase
- Timezone is read from `BOT_TIMEZONE` env var — configure it in `.env`
- `runOnStart: true` triggers the cron immediately when the bot boots
- `this.ranCount` tracks how many times this cron has executed
- Import `* as app from "#all"` to access the client, env, logger, etc.
- Cron jobs start automatically when the bot is ready (via `cron.clientReady.native.ts`)

After creating the file, remind the user to run `bun run format`.
