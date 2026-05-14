Create a new textual (prefix) command for this bot.ts project.

The user will provide: command name, description, channel type (guild/dm/all), and optionally arguments (positional, options, flags, rest), cooldown, and botOwnerOnly flag.

If the user hasn't provided details, ask for:
1. Command name (kebab-case, e.g. `daily-reward`)
2. Short description
3. Channel type: `guild`, `dm`, or `all`
4. Arguments needed (if any)

Then create the file at `src/commands/<name>.ts` following this pattern exactly (Biome style: tabs, no semicolons, double quotes):

```typescript
import { Command } from "#core/command"

export default new Command({
  name: "<name>",
  description: "<description>",
  channelType: "<channelType>",
  async run(message) {
    // todo: implement
  },
})
```

### Rules to follow

- File name matches the command `name` exactly
- Use `CooldownType` from `#core/command` if a cooldown is requested
- Add `botOwnerOnly: true` only when explicitly requested
- For positional args: use `positional: [{ name, description, type, required }]`
- For option args: use `options: [{ name, description, type }]`
- For flag args: use `flags: [{ name, flag, description }]` (single letter for `flag`)
- For rest: use `rest: { name, description, required }`
- Available argument types: `string`, `number`, `boolean`, `regex`, `date`, `duration`, `json`, `array`, `string[]`, `number[]`, `boolean[]`, `date[]`, `user`, `member`, `channel`, `role`, `emote`, `invite`, `command`, `slashCommand`
- Custom types are defined in `src/types.ts`
- Access parsed args via `message.args.<argName>`
- `message.triggerCoolDown()` must be called inside `run` if a cooldown is defined

### Example with arguments and cooldown

```typescript
import { Command, CooldownType } from "#core/command"

export default new Command({
  name: "daily-reward",
  description: "Claim your daily reward",
  channelType: "guild",
  cooldown: {
    duration: 1000 * 60 * 60 * 24, // 24 hours
    type: CooldownType.Global,
  },
  async run(message) {
    message.triggerCoolDown()
    await message.channel.send(`${message.author} claimed their daily reward!`)
  },
})
```

After creating the file, remind the user that they can run `bun run format` to apply Biome formatting.
