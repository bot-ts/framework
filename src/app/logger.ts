import chalk from "chalk"
import dayjs from "dayjs"

export type LogLevel = "warn" | "info" | "success" | "error"
export const logLevelColors = {
  warn: "#ffa600",
  error: "#ff0000",
  info: "#00ffff",
  success: "#00ff00",
}

export const loggerPattern = (
  text: string,
  level: LogLevel,
  section?: string
) => {
  return `${chalk.grey(dayjs().format("DD/MM/YY HH:mm"))} ${chalk.hex(
    logLevelColors[level]
  )(level.toUpperCase())}${
    section ? " " + chalk.magentaBright(`${section}`) : ""
  } ${text}`
}

export function log(text: string, section?: string) {
  console.log(loggerPattern(text, "info", section))
}

export function error(text: string, section?: string) {
  console.error(loggerPattern(text, "error", section))
}

export function warn(text: string, section?: string) {
  console.warn(loggerPattern(text, "warn", section))
}

export function success(text: string, section?: string) {
  console.log(loggerPattern(text, "success", section))
}

export function createLogger(section?: string) {
  return {
    log: (text: string) => log(text, section),
    error: (text: string) => error(text, section),
    warn: (text: string) => warn(text, section),
    success: (text: string) => success(text, section),
  }
}
