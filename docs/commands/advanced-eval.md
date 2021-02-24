# Advanced eval command

How to use [eval](https://github.com/CamilleAbella/bot.ts/blob/master/src/commands/eval.ts) command ?

## Pattern:

In the Discord server where you invited the bot, use the following command pattern in a channel accessible by the bot:

```shell
[your_prefix]eval your_js_code
```

For example:

```shell
.eval
return 42 + "0"
```

If you type your entire command on one line, you can ignore the keyword `return`. It will be added automatically.

```shell
.eval 42 + "0"
```

You also have the possibility to encode your code between markdown tags in order to have the indentation.

````shell
.eval ```js
return 42 + "0"
```
`````

If your code contains `async/await`, it works at top level like on Deno!

```shell
.eval await fetch("https://api.mathjs.org/v4/?expr=42+0")
```

## Arguments:

You can install and use NPM packages in your eval with the `--use` argument. You can then use the imported packages via the `req` object:

```shell
.eval --use prettier,esbuild,make-bot.ts
req.prettier // ok
req["make-bot.ts"] // ok
return 42 + "0"
```

If you want to run your code in silence, use the `--muted` flag (or just `-m`).

```shell
.eval --muted
return 42 + "0"
```