"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.createLogger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class ConsoleLogger {
    level;
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    debug(message, ...args) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
    info(message, ...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    error(message, ...args) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}
const createLogger = (level = LogLevel.INFO) => {
    return new ConsoleLogger(level);
};
exports.createLogger = createLogger;
// Default logger instance
exports.logger = (0, exports.createLogger)();
