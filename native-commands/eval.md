---
description: Advanced eval command for bot owner tests.
---

# Eval

## Command pattern

In the Discord server where you invited the bot, use the following command pattern in a channel accessible by the bot.

```bash
.eval <code> [--muted: <boolean>] [--use: <Array<string>>]
```

For example:

```bash
.eval
return 42 + "0"
```

## Automatic return

If you type your entire command on one line, you can ignore the keyword `return`. It will be added automatically.

```bash
.eval 42 + "0"
```

## Code blocks

You also have the possibility to encode your code between markdown tags in order to have the indentation.

```haskell
.eval ```js
return 42 + "0"
```
```

## Async / Await

If your code contains `async/await`, it works at top level like on Deno!

```javascript
.eval await fetch("https://api.mathjs.org/v4/?expr=42+0")
```

## Arguments

{% hint style="warning" %}
Check the [Command](../usage-1/create-a-command.md)/[Arguments](../usage-1/create-a-command.md#arguments) section if you have a problem.
{% endhint %}

### --use

You can install and use NPM packages in your eval with the `--use` argument. You can then use the imported packages via the `req` object. the NPM packages are removed after the command.

```bash
.eval --use prettier,esbuild,make-bot.ts
req.prettier // ok
req["make-bot.ts"] // ok
return 42 + "0"
```

### --muted

If you want to run your code in silence, use the `--muted` flag \(or just `-m`\).

```bash
.eval --muted
return 42 + "0"
```

## Annexes

* [Command file](https://github.com/CamilleAbella/bot.ts/blob/master/src/commands/eval.ts)
* [discord-eval.ts](https://www.npmjs.com/package/discord-eval.ts)

