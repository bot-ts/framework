import { logger, Logger } from "@ghom/logger"
import { getConfig } from "./config.ts"

const { logger: loggerOptions } = getConfig()

export const systemLogger = loggerOptions ? new Logger(loggerOptions) : logger

const log = systemLogger.log.bind(systemLogger)
const warn = systemLogger.warn.bind(systemLogger)
const error = systemLogger.error.bind(systemLogger)
const success = systemLogger.success.bind(systemLogger)

export { log, warn, error, success }

export {
  Logger,
  LoggerLevels,
  defaultLoggerRenders,
  defaultLoggerColors,
  defaultLoggerPattern,
  loggerLevelName,
} from "@ghom/logger"

export type * from "@ghom/logger"
