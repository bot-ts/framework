<div align="center">
  <div>
    <a href="https://ghom.gitbook.io/bot-ts/">
      <img src="https://raw.githubusercontent.com/bot-ts/docs/master/.gitbook/assets/bot.ts-banner.png"/>
    </a>
  </div>
  <br/>
  <div>
    <a href="https://discord.gg/3vC2XWK"><img src="https://img.shields.io/discord/507389389098188820?color=7289da&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/make-bot.ts"><img src="https://img.shields.io/npm/v/make-bot.ts.svg?maxAge=3600" alt="CLI version" /></a>
    <a href="https://www.npmjs.com/package/make-bot.ts"><img src="https://img.shields.io/npm/dt/make-bot.ts.svg?maxAge=3600" alt="CLI downloads" /></a>
    <a href="https://github.com/bot-ts/framework/actions/workflows/tests.native.yml"><img src="https://github.com/bot-ts/framework/actions/workflows/tests.native.yml/badge.svg?branch=master" alt="Tests" /></a>
    <img alt="Dependency status" src="https://img.shields.io/librariesio/github/bot-ts/framework">
    <a href="https://github.com/bot-ts/framework"><img alt="Github stars" src="https://img.shields.io/github/stars/bot-ts/framework?color=black&logo=github"></a>
  </div>
</div>

<br/>

## What is bot.ts ?

**bot.ts** is a framework for [discord.js](https://discord.js.org/#/) designed in TypeScript for use in TypeScript. This framework includes all the features you need, here is a list:

* Advanced handler. \(for commands and listeners\)
* [CLI](https://www.npmjs.com/package/make-bot.ts) to generate all file types.
* Very practical file structure. \(all the app parts are includes and exported from [app.ts](https://github.com/bot-ts/framework/blob/master/src/app.ts)\)
* [Yargs](http://yargs.js.org/) based argument system for commands.
* Some essential [commands](https://github.com/bot-ts/framework/blob/master/src/commands) and [listeners](https://github.com/bot-ts/framework/blob/master/src/listeners). \(including an advanced "eval" command\)
* Some scripts in [package.json](https://github.com/bot-ts/framework/blob/master/package.json). \(including a TypeScript watcher\)
* [Knex](http://knexjs.org/) database provider [here](https://github.com/bot-ts/framework/blob/master/src/app/database.ts), configured by default with [sqlite3](https://www.npmjs.com/package/sqlite3). \(including data migrations\)
* Efficient [pagination](https://github.com/bot-ts/framework/blob/master/src/app/pagination.ts) system. \(example in [help](https://github.com/bot-ts/framework/blob/master/src/commands/help.native.ts#L34) command\)
* [ESBuild](https://esbuild.github.io) configuration for a build faster than 100ms.
* Faster [Gulp](https://gulpjs.com/) based file watcher.
* GitHub-Action checks for TypeScript typings [here](https://github.com/bot-ts/framework/blob/master/.github/workflows/test.yml).
* Beautiful console logger using [Chalk](https://github.com/chalk/chalk).
* [Gulp](https://gulpjs.com/) based framework updater.

## Why using bot.ts ?

Code faster and without the hassle. Choosing **bot.ts** is choosing control.

* It's not a lib! You can edit all files easily.
* All is already configured.
* I recommend it for learning TypeScript.
* It uses ESBuild for boosted productivity

## Annexes

* [Documentation](https://ghom.gitbook.io/bot-ts/)
* [CLI on NPN](https://www.npmjs.com/package/make-bot.ts)
* [Discord server](https://discord.gg/3vC2XWK)
* [use this template](https://github.com/bot-ts/framework/generate)
* [Follow tool NEWS](https://discord.gg/kYxDWWQJ8q)

![logs](https://user-images.githubusercontent.com/19586013/117373587-ce706a80-aecb-11eb-8e7b-4102094a50fa.png)
