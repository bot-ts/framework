---
description: Bot.ts package.json npm scripts.
---

# Overview

Use these scripts via `yarn` or`npm run` to manage your project.

| Name | Script | Description |
| :--- | :--- | :--- |
| [build](build.md) | `gulp build` | Compile TypeScript from `./src` to `./dist` directory |
| [start](start.md) | `gulp build && node .` | Build and run the bot from `./dist` |
| [format](format.md) | `prettier --write src` | Beatify files in `./src` using a `--no-semi` config |
| [watch](watch.md) | `gulp watch` | Build, run and watch files |
| [test](test.md) | `tsc --noEmit` | Check if TypeScript types are valids |
| [update](update.md) | `gulp update` | Update core/native files of bot.ts |

