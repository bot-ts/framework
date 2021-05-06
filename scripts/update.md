---
description: The bot.ts core files updater command.
---

# Update

{% hint style="danger" %}
**This script overwrite your files**, please read the entierty of this page before using this script!
{% endhint %}

## Usage

```bash
# npm
npm run update

# yarn
yarn update

# gulp
gulp update
```

## Which files are update?

All files in the `src/app` folder are affected by the update. But also all the files which correspond with the following glob pattern are affected too: `src/**/*.native.ts`

Here is a list of special files that will always be updated.

```bash
.gitattributes
.gitignore
Gulpfile.js
tsconfig.json
src/index.ts
```

## Customize native file and ignore it during an update

If you want to customize a native file \(`*.native.ts`\), the first step is to **disable updates** on this file. It's easy, **just remove the `native` part of file name**. \(e.g. `eval.native.ts` becomes `eval.ts`\)

