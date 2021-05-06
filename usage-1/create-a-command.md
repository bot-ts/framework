# Command

## Create a command

To create a command it is recommended to use the [CLI](https://www.npmjs.com/package/make-bot.ts) to correctly generate the body of the command.

### CLI pattern

By typing `make command -h` you will get this following information.

```bash
make command <name>

Positionals:
  name       # command name                                             [required]

Options:
  --version  # Show version number                                       [boolean]
  --help     # Show help                                                 [boolean]
```

### Example

For a "ping" command, type the following command.

```bash
make command "ping"
```

Then, the `src/commands/ping.ts` file will be ready to be implemented.

## Define message origin

Once your command is created, **If you want handle messages from GuildChannels only or from DMChannel only**, follow these steps.

{% tabs %}
{% tab title="GuildChannel only" %}
* Add `app.GuildMessage` generic to command type \(line: 3\)
* Add the `guildChannelOnly` flag setted to `true` \(line: 5\)

```typescript
import * as app from "../app"

const command: app.Command<app.GuildMessage> = {

  guildChannelOnly: true,

  // ...some properties
}

module.exports = command
```
{% endtab %}

{% tab title="DMChannel only" %}
* Add `app.DirectMessage` generic to command type \(line: 3\)
* Add the `dmChannelOnly` flag setted to `true` \(line: 5\)

```typescript
import * as app from "../app"

const command: app.Command<app.DirectMessage> = {

  dmChannelOnly: true,

  // ...some properties
}

module.exports = command
```
{% endtab %}
{% endtabs %}

## Setup a cooldown

## Arguments

{% hint style="warning" %}
The `\n` character **is not a valid argument separator**. If you want to break the line before putting an argument, add a space at the start of argument. \(_future issue url here_\)
{% endhint %}

### Options

### Positional

### Flags

