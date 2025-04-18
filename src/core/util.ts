// system file, please don't modify it

import EventEmitter from "node:events"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"
import util from "node:util"
import dayjs from "dayjs"
import * as discordEval from "discord-eval.ts"
import discord from "discord.js"
import simpleGit from "simple-git"

import type { PackageJson } from "types-package-json"

import relative from "dayjs/plugin/relativeTime.js"
import timezone from "dayjs/plugin/timezone.js"
import toObject from "dayjs/plugin/toObject.js"
import utc from "dayjs/plugin/utc.js"
import type v10 from "discord-api-types/v10"

import config from "#config"
import client from "#core/client"
import env from "#core/env"
import logger from "#core/logger"

export type PermissionsNames = keyof typeof v10.PermissionFlagsBits

export interface Compatibility {
	templates: Record<string, Record<string, string> | string>
	components: Record<string, Record<string, string>>
}

export function getCurrentFilename(importMeta: ImportMeta) {
	return url.fileURLToPath(importMeta.url)
}

export function getCurrentDirname(importMeta: ImportMeta) {
	return path.dirname(getCurrentFilename(importMeta))
}

/**
 * Make a path from root of project and return it
 */
export function relativeRootPath(..._path: string[]): string {
	return path.relative(rootPath(), path.join(..._path))
}

/**
 * Make a path from the "src" (or "dist") folder (or dist if compiled) and return it
 */
export function srcPath(..._path: string[]): string {
	return path.join(getCurrentDirname(import.meta), "..", ..._path)
}

export function rootPath(..._path: string[]): string {
	return path.join(getCurrentDirname(import.meta), "..", "..", ..._path)
}

export const packageJSON = JSON.parse(
	fs.readFileSync(rootPath("package.json"), "utf-8"),
) as PackageJson

export const compatibility = JSON.parse(
	fs.readFileSync(rootPath("compatibility.json"), "utf-8"),
) as Compatibility

export async function checkUpdates() {
	// fetch latest bot.ts codebase
	const remoteJSON: PackageJson = await fetch(
		"https://raw.githubusercontent.com/bot-ts/framework/master/package.json",
	).then((res) => res.json() as any)

	const versionValue = (version: string): number => {
		const [, major, minor, patch] = /(\d+)\.(\d+)\.(\d+)/
			.exec(version)!
			.map(Number)

		return (major << 16) + (minor << 8) + patch
	}

	const isOlder = (localVersion: string, remoteVersion: string) =>
		localVersion !== remoteVersion &&
		versionValue(localVersion) <= versionValue(remoteVersion)

	if (isOlder(packageJSON.version, remoteJSON.version)) {
		logger.warn(
			`a new major version of ${util.styleText(
				"blue",
				"@ghom/bot.ts",
			)} is available: ${util.styleText(
				"magenta",
				packageJSON.version,
			)} => ${util.styleText("magenta", remoteJSON.version)}`,
		)
		logger.warn(
			`you can update ${util.styleText(
				"blue",
				"@ghom/bot.ts",
			)} by running ${util.styleText("bold", `${compatibility.components.run} update`)}`,
		)
		logger.warn(util.styleText("bold", "this update may break your bot!"))
	} else if (
		packageJSON.devDependencies &&
		remoteJSON.devDependencies &&
		isOlder(
			packageJSON.devDependencies["@ghom/bot.ts-cli"],
			remoteJSON.devDependencies["@ghom/bot.ts-cli"],
		)
	) {
		logger.warn(
			`a new version of ${util.styleText(
				"blue",
				"@ghom/bot.ts-cli",
			)} is available: ${util.styleText(
				"blue",
				packageJSON.devDependencies["@ghom/bot.ts-cli"],
			)} => ${util.styleText(
				"blue",
				remoteJSON.devDependencies["@ghom/bot.ts-cli"],
			)}`,
		)
		logger.warn(
			`you can update ${util.styleText(
				"blue",
				"@ghom/bot.ts-cli",
			)} by running ${util.styleText("bold", `${compatibility.components.run} update`)}`,
		)
		logger.warn(util.styleText("bold", "this update may break your bot!"))
	} else {
		logger.log(
			`you are using the latest version of ${util.styleText(
				"blue",
				"@ghom/bot.ts",
			)} and ${util.styleText("blue", "@ghom/bot.ts-cli")}`,
		)
	}
}

const locale = env.BOT_LOCALE

if (locale)
	import(`dayjs/locale/${locale ?? "en"}.js`)
		.then(() => dayjs.locale(locale ?? "en"))
		.catch(() =>
			logger.warn(
				`The ${util.styleText(
					"bold",
					locale,
				)} locale is incorrect, please use an existing locale code.`,
			),
		)

dayjs.extend(utc)
dayjs.extend(relative)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.utc(1)

if (env.BOT_TIMEZONE) dayjs.tz.setDefault(env.BOT_TIMEZONE)

export * from "tims"
export { dayjs }

export interface EventEmitters {
	messageCreate:
		| discord.TextBasedChannel
		| discord.User
		| discord.GuildMember
		| discord.Guild
}

export const messageEmitter = new EventEmitter()

export const startedAt = Date.now()

export function uptime(): number {
	return Date.now() - startedAt
}

export function onceMessage<
	Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>,
>(
	emitter: EventEmitters[Event],
	cb: (...args: discord.ClientEvents[Event]) => unknown,
) {
	messageEmitter.once(emitter.id, cb)
}

export function emitMessage<
	Event extends keyof Pick<discord.ClientEvents, keyof EventEmitters>,
>(emitter: EventEmitters[Event], ...args: discord.ClientEvents[Event]) {
	messageEmitter.emit(emitter.id, ...args)
}

export function divider<T, Out>(
	items: T[],
	itemCountByDivision: number,
	mapping: (section: T[], index: number, all: T[][]) => Promise<Out> | Out,
): Promise<Out[]>
export function divider<T>(items: T[], itemCountByDivision: number): T[][]
export function divider<T, Out>(
	items: T[],
	itemCountByDivision: number,
	mapping?: (section: T[], index: number, all: T[][]) => Out,
): T[][] | Promise<Out[]> {
	const divided: T[][] = []
	const divisionCount = Math.ceil(items.length / itemCountByDivision)
	for (let i = 0; i < divisionCount; i++) {
		divided.push(
			items.slice(itemCountByDivision * i, itemCountByDivision * (i + 1)),
		)
	}

	if (mapping) return Promise.all(divided.map(mapping))

	return divided
}

export const emojiRegex =
	// biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
	/\u{1F3F4}\u{E0067}\u{E0062}(?:\u{E0077}\u{E006C}\u{E0073}|\u{E0073}\u{E0063}\u{E0074}|\u{E0065}\u{E006E}\u{E0067})\u{E007F}|(?:\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}-\u{1F3FE}]|(?:\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F9D1}|\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}])[\u{1F3FC}-\u{1F3FF}]|\u{1F468}(?:\u{1F3FB}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u{1F91D}\u200D\u{1F468}[\u{1F3FC}-\u{1F3FF}]|[\u2695\u2696\u2708]\uFE0F|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]))?|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F468}|[\u{1F468}\u{1F469}]\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FE}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FE}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FD}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FC}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]|[\u{1F466}\u{1F467}])|\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC})?|(?:\u{1F469}(?:\u{1F3FB}\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}]))|\u{1F9D1}[\u{1F3FB}-\u{1F3FF}]\u200D\u{1F91D}\u200D\u{1F9D1})[\u{1F3FB}-\u{1F3FF}]|\u{1F469}\u200D\u{1F469}\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F469}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F9D1}(?:\u200D(?:\u{1F91D}\u200D\u{1F9D1}|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F469}\u200D\u{1F466}\u200D\u{1F466}|\u{1F469}\u200D\u{1F469}\u200D[\u{1F466}\u{1F467}]|\u{1F469}\u200D\u{1F467}\u200D[\u{1F466}\u{1F467}]|(?:\u{1F441}\uFE0F\u200D\u{1F5E8}|\u{1F9D1}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F469}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F636}\u200D\u{1F32B}|\u{1F3F3}\uFE0F\u200D\u26A7|\u{1F43B}\u200D\u2744|(?:[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\uFE0F\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u{1F3F4}\u200D\u2620|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F202}\u{1F237}\u{1F321}\u{1F324}-\u{1F32C}\u{1F336}\u{1F37D}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}\u{1F39F}\u{1F3CD}\u{1F3CE}\u{1F3D4}-\u{1F3DF}\u{1F3F5}\u{1F3F7}\u{1F43F}\u{1F4FD}\u{1F549}\u{1F54A}\u{1F56F}\u{1F570}\u{1F573}\u{1F576}-\u{1F579}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}\u{1F6CB}\u{1F6CD}-\u{1F6CF}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6F0}\u{1F6F3}])\uFE0F|\u{1F3F3}\uFE0F\u200D\u{1F308}|\u{1F469}\u200D\u{1F467}|\u{1F469}\u200D\u{1F466}|\u{1F635}\u200D\u{1F4AB}|\u{1F62E}\u200D\u{1F4A8}|\u{1F415}\u200D\u{1F9BA}|\u{1F9D1}[\u{1F3FF}\u{1F3FE}\u{1F3FD}\u{1F3FC}\u{1F3FB}]?|\u{1F469}[\u{1F3FF}\u{1F3FE}\u{1F3FD}\u{1F3FC}\u{1F3FB}]?|\u{1F1FD}\u{1F1F0}|\u{1F1F6}\u{1F1E6}|\u{1F1F4}\u{1F1F2}|\u{1F408}\u200D\u2B1B|\u2764\uFE0F\u200D[\u{1F525}\u{1FA79}]|\u{1F441}\uFE0F|\u{1F3F3}\uFE0F|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1F8}\u{1F1FA}\u{1F1FC}]|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1E6}[\u{1F1E8}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F2}\u{1F1F4}\u{1F1F6}-\u{1F1FA}\u{1F1FC}\u{1F1FD}\u{1F1FF}]|[#*0-9]\uFE0F\u20E3|\u2764\uFE0F|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\uFE0F\u{1F3FB}-\u{1F3FF}]|\u{1F3F4}|[\u270A\u270B\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F57A}\u{1F595}\u{1F596}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}][\u{1F3FB}-\u{1F3FF}]|[\u261D\u270C\u270D\u{1F574}\u{1F590}][\uFE0F\u{1F3FB}-\u{1F3FF}]|[\u270A\u270B\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F408}\u{1F415}\u{1F43B}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F57A}\u{1F595}\u{1F596}\u{1F62E}\u{1F635}\u{1F636}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F384}\u{1F386}-\u{1F393}\u{1F3A0}-\u{1F3C1}\u{1F3C5}\u{1F3C6}\u{1F3C8}\u{1F3C9}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F8}-\u{1F407}\u{1F409}-\u{1F414}\u{1F416}-\u{1F43A}\u{1F43C}-\u{1F43E}\u{1F440}\u{1F444}\u{1F445}\u{1F451}-\u{1F465}\u{1F46A}\u{1F479}-\u{1F47B}\u{1F47D}-\u{1F480}\u{1F484}\u{1F488}-\u{1F48E}\u{1F490}\u{1F492}-\u{1F4A9}\u{1F4AB}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F5A4}\u{1F5FB}-\u{1F62D}\u{1F62F}-\u{1F634}\u{1F637}-\u{1F644}\u{1F648}-\u{1F64A}\u{1F680}-\u{1F6A2}\u{1F6A4}-\u{1F6B3}\u{1F6B7}-\u{1F6BF}\u{1F6C1}-\u{1F6C5}\u{1F6D0}-\u{1F6D2}\u{1F6D5}-\u{1F6D7}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}\u{1F90D}\u{1F90E}\u{1F910}-\u{1F917}\u{1F91D}\u{1F920}-\u{1F925}\u{1F927}-\u{1F92F}\u{1F93A}\u{1F93F}-\u{1F945}\u{1F947}-\u{1F976}\u{1F978}\u{1F97A}-\u{1F9B4}\u{1F9B7}\u{1F9BA}\u{1F9BC}-\u{1F9CB}\u{1F9D0}\u{1F9E0}-\u{1F9FF}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}]/gu

export const blankChar = "\u200b"

export function getDatabaseDriverName() {
	if (packageJSON?.dependencies?.pg) return "pg"
	if (packageJSON?.dependencies?.mysql2) return "mysql2"
	if (packageJSON?.dependencies?.sqlite3) return "sqlite3"
	throw new Error("No database driver found in package.json")
}

export async function whileLoop<Value>(options: {
	resolveValue: (index: number) => Promise<Value>
	canIterate: (value: Value, tick: number) => boolean
	iteration: (value: Value, tick: number) => unknown
	after?: (value: Value, ticks: number) => unknown
}): Promise<Value> {
	const { resolveValue, canIterate, iteration } = options

	let value = await resolveValue(0)
	let tick = 0

	while (canIterate(value, tick)) {
		iteration(value, tick)
		value = await resolveValue(tick)
		tick++
	}

	options.after?.(value, tick)

	return value
}

export const MaxLength = {
	EmbedTitle: 256,
	EmbedDescription: 4096,
	EmbedFieldName: 256,
	EmbedFieldValue: 1024,
	EmbedFooterText: 2048,
	EmbedAuthorName: 256,
	MessageContent: 2000,
}

/**
 * Limit data to show in embeds or messages. Data can be an array, a string or anything else. <br>
 * For arrays, this method remove entries until the string is short enough and add a "..." at the end of the string if the data is too long. <br>
 * For strings, this method remove words until the string is short enough. <br>
 * For anything else, this method stringify the data and remove characters until the string is short enough. <br>
 * @param data
 * @param maxLength
 * @param transformation
 */
export async function limitDataToShow(
	data: any,
	maxLength: keyof typeof MaxLength | number,
	transformation: (data: any) => Promise<string> | string,
): Promise<string> {
	maxLength = typeof maxLength === "string" ? MaxLength[maxLength] : maxLength

	if (Array.isArray(data)) {
		const gap = 20

		return (
			await whileLoop({
				resolveValue: async () => transformation(data),
				canIterate: (value, tick) =>
					value.length > maxLength - gap && data.length > 1 && tick < 1000,
				iteration: () => data.pop(),
				after: (value, ticks) => {
					if (ticks >= 1) data.push(`... (+ ${ticks} more)`.slice(0, gap))
				},
			})
		).slice(0, maxLength)
	}

	if (typeof data === "string") {
		return (
			await whileLoop({
				resolveValue: async () => transformation(data),
				canIterate: (value, tick) =>
					value.length > maxLength - 3 && data.length > 1 && tick < 1000,
				iteration: () => (data = data.split(" ").slice(0, -1).join(" ")),
				after: (value, ticks) => {
					if (ticks >= 1) data += "..."
				},
			})
		).slice(0, maxLength)
	}

	const out = (await transformation(data)).slice(0, maxLength - 3)

	return `${out}...`
}

/**
 * @deprecated will be removed in v10 and can be replaced by `String.prototype.padStart` or `String.prototype.padEnd`
 */
export function forceTextSize(
	text: string | number,
	size: number,
	before = false,
): string {
	text = String(text)

	if (text.length < size) {
		return before
			? " ".repeat(size - text.length) + text
			: text + " ".repeat(size - text.length)
	}
	if (text.length > size) return text.slice(0, size)

	return text
}

export function capitalize(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

export function generateDebugName(data: {
	type: string
	name: string
	category?: string
	secondary?: string
}): string {
	return `${capitalize(data.type)}:${data.category ? `${capitalize(data.category)}/` : ""}${capitalize(data.name)}${data.secondary ? `(${data.secondary})` : ""}`
}

export const pathRegex =
	/(\w+:[\\/][\s\S]+?(?:$|\n))|(\/[\s\S]+?(?:$|\n))|(^(?:https?:)?\/\/(?:www\.)?[-\w@:%.+~#=]{1,256}\.[\w()]{1,6}\b[-\w()@:%+.~#?&\/=]*(?:$|\n))/g

export function beautifyJavaScriptError(callstack: string): string {
	callstack = callstack.replace(/at <anonymous> \((.+)\)/g, "at $1")
	callstack = callstack.replace(/file:\/\//g, "")

	// start all path from the rootPath and short the node_module paths with `module(MODULE_NAME):path/in/module`
	const nodeModules = "node_modules"
	callstack = callstack.replace(pathRegex, (match) => {
		if (match.includes(nodeModules)) {
			const [moduleName, ...path] = match
				.slice(match.lastIndexOf(nodeModules) + nodeModules.length)
				.split(/[\\/]+/)
			return `module(${moduleName}):${path.join("/")}`
		}
		return relativeRootPath(match)
	})

	return callstack
}

/**
 * Resolve `T` value from `T | (() => T)`
 * @param item - resolvable
 * @param args - parameters for resolvable function
 */
export function scrap<T, A extends any[] = []>(
	item: Scrap<T, A>,
	...args: A
): T | Promise<T> {
	// @ts-expect-error The type of `item` is `Scrap<T, A>`, so it can be a function
	return typeof item === "function" ? item(...args) : item
}

export type Scrap<T, A extends any[] = []> =
	| T
	| ((...args: A) => T | Promise<T>)

export function slug(...words: string[]): string {
	return words.join("-")
}

export function omit<T extends object, K extends keyof T>(
	item: T,
	...keys: K[]
): Omit<T, K> {
	const clone = { ...item }
	for (const key of keys) {
		delete clone[key]
	}
	return clone
}

export function pick<T extends object, K extends keyof T>(
	item: T,
	...keys: K[]
): Pick<T, K> {
	const clone = {} as Pick<T, K>
	for (const key of keys) {
		clone[key] = item[key]
	}
	return clone
}

/**
 * Simple cache for manage temporary values
 */
export const cache = new (class Cache {
	private data: { [key: string]: any } = {}

	get<T>(key: string): T | undefined {
		return this.data[key]
	}

	set(key: string, value: any) {
		this.data[key] = value
	}

	delete(key: string) {
		delete this.data[key]
	}

	ensure<T>(key: string, defaultValue: T): T {
		let value = this.get<T>(key)
		if (value === undefined) {
			value = defaultValue
			this.set(key, value)
		}
		return value
	}
})()

export function convertDistPathToSrc(path: string) {
	return path.replace(/dist([/\\])/, "src$1").replace(".js", ".ts")
}

export async function getGitURL(): Promise<string | undefined> {
	const git = simpleGit(rootPath())

	try {
		const remotes = await git.getRemotes(true)
		const remote = remotes.find(
			(remote) =>
				remote.name === "origin" &&
				remote.refs.fetch.startsWith("https://github.com/"),
		)

		return remote?.refs.fetch.replace(".git", "")
	} catch {}
}

export async function getFileGitURL(
	filepath: string,
): Promise<string | undefined> {
	const git = simpleGit(rootPath())

	try {
		const remotes = await git.getRemotes(true)
		const branchName = (await git.branch()).current

		const remote = remotes.find(
			(remote) =>
				remote.name === "origin" &&
				remote.refs.fetch.startsWith("https://github.com/"),
		)

		if (!remote) return

		return `${remote.refs.fetch.replace(
			".git",
			"",
		)}/blob/${branchName}/${convertDistPathToSrc(
			relativeRootPath(filepath),
		).replace(/\\/g, "/")}`
	} catch {}
}

export interface SystemEmojis {
	success: string
	error: string
	loading: string
	warning: string
}

const defaultSystemEmojis: SystemEmojis = {
	success: "✅",
	error: "❌",
	loading: "⏳",
	warning: "⚠️",
}

export const systemColors = {
	default: discord.Colors.Blurple,
	success: discord.Colors.Green,
	error: discord.Colors.Red,
	loading: discord.Colors.Blue,
	warning: discord.Colors.Yellow,
}

export function getSystemEmoji(name: keyof SystemEmojis): string {
	const rawEmoji = config.systemEmojis?.[name] ?? defaultSystemEmojis[name]

	return client.emojis.resolve(rawEmoji)?.toString() ?? rawEmoji
}

export interface SystemMessageOptions {
	header?: string
	body: string | Error
	footer?: string
	date?: Date
	url?: string
}

export type SystemMessage = Pick<
	discord.MessageCreateOptions,
	"embeds" | "content" | "files" | "allowedMentions" | "components"
>

export type SystemMessageType = "default" | keyof SystemEmojis

export interface GetSystemMessageOptions {
	/**
	 * js, json, ts, etc. <br>
	 * If given, a formatted code clock will be displayed. <br>
	 * If true, the code block will be displayed without lang.
	 */
	code?: boolean | string

	/**
	 * If true, the error stack will be displayed.
	 */
	stack?: boolean

	/**
	 * If the output is an embed, you can edit it in this callback. <br>
	 * The result of this callback will be returned as the final embed.
	 */
	editEmbed?: (embed: discord.EmbedBuilder) => discord.EmbedBuilder
}

export function isSystemMessage(message: any): message is SystemMessage {
	return (
		typeof message === "object" &&
		(Array.isArray(message.embeds) || typeof message.content === "string")
	)
}

export async function getSystemMessage(
	type: SystemMessageType,
	message: string | SystemMessageOptions | Error,
	options?: GetSystemMessageOptions,
): Promise<SystemMessage> {
	if (config.systemMessages) return config.systemMessages(type, message, client)

	const output: SystemMessage = {}

	// define the output content
	if (typeof message !== "string" && "body" in message) {
		output.content =
			message.body instanceof Error
				? beautifyJavaScriptError(
						options?.stack
							? (message.body.stack ?? message.body.message)
							: message.body.message,
					)
				: message.body
	} else if (message instanceof Error) {
		output.content = beautifyJavaScriptError(
			options?.stack ? (message.stack ?? message.message) : message.message,
		)
	} else {
		output.content = message
	}

	// if the message contains code, format it
	if (options?.code) {
		const lang =
			typeof options.code === "string"
				? options.code
				: options.code && undefined

		output.content = await discordEval.code.stringify({
			lang,
			content: output.content!,
		})
	}

	// if the input has a header or a footer, use an embed
	if (typeof message !== "string" && !(message instanceof Error)) {
		const embed = new discord.EmbedBuilder()
			.setURL(message.url ?? null)
			.setColor(systemColors[type])
			.setDescription(
				message.header
					? `### ${
							type === "default" ? "" : getSystemEmoji(type)
						} ${message.header}\n${output.content}`.trim()
					: output.content!,
			)
			.setFooter(message.footer ? { text: message.footer } : null)
			.setTimestamp(message.date ?? null)

		if (options?.editEmbed) options.editEmbed(embed)

		output.embeds = [embed.toJSON()]
		delete output.content
	} else if (type !== "default") {
		// else, add an emoji to the message
		output.content = `${getSystemEmoji(type)} ${output.content!}`
	}

	return output
}

export enum CooldownType {
	ByUser = "byUser",
	ByGuild = "byGuild",
	ByChannel = "byChannel",
	Global = "global",
}

export interface Cooldown {
	duration: number
	type: CooldownType
}

export interface CoolDownData {
	time: number
	trigger: boolean
}

export function validateCooldown(
	cooldown: Cooldown | undefined,
	method: any,
	key: string,
) {
	if (cooldown)
		if (!method.toString().includes("triggerCooldown"))
			logger.warn(
				`you forgot using ${util.styleText(
					"greenBright",
					"message.triggerCooldown()",
				)} in the ${util.styleText("blueBright", key)} command.`,
			)
}

export async function checkCooldown(
	cooldown: Cooldown | undefined,
	key: string,
	context: {
		authorId: discord.Snowflake
		guildId: discord.Snowflake | null
		channelId: discord.Snowflake | null
	},
	parentOfTrigger: {
		triggerCooldown: () => void
	},
) {
	// coolDown
	if (cooldown) {
		let _slug: string

		switch (cooldown.type) {
			case CooldownType.ByUser:
				_slug = slug("coolDown", key, context.authorId)
				break
			case CooldownType.ByGuild:
				if (context.guildId) _slug = slug("coolDown", key, context.guildId)
				else
					return getSystemMessage(
						"error",
						"You can't perform this action outside of a guild.",
					)
				break
			case CooldownType.ByChannel:
				if (context.channelId) _slug = slug("coolDown", key, context.channelId)
				else
					return getSystemMessage(
						"error",
						"You can't perform this action outside of a channel.",
					)
				break
			case CooldownType.Global:
				_slug = slug("coolDown", key, "global")
				break
			default:
				return getSystemMessage(
					"error",
					"Invalid coolDown type in command options.",
				)
		}

		const coolDown = cache.ensure<CoolDownData>(_slug, {
			time: 0,
			trigger: false,
		})

		parentOfTrigger.triggerCooldown = () => {
			cache.set(_slug, {
				time: Date.now(),
				trigger: true,
			})
		}

		if (coolDown.trigger) {
			const coolDownTime = cooldown.duration

			if (Date.now() > coolDown.time + coolDownTime) {
				cache.set(_slug, {
					time: 0,
					trigger: false,
				})
			} else {
				return getSystemMessage(
					"error",
					`Please wait ${Math.ceil(
						(coolDown.time + coolDownTime - Date.now()) / 1000,
					)} seconds before another try...`,
				)
			}
		}
	} else {
		parentOfTrigger.triggerCooldown = () => {
			logger.warn(
				`You must setup the coolDown of the "${key}" instance before using the "triggerCoolDown" method`,
			)
		}
	}
}
