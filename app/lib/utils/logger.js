/**
 * 日志工具
 * @author kk
 */

class Logger {
    constructor(enabled = false) {
        this.enabled = enabled;
    }

    log(...args) {
        if (this.enabled) {
            console.log(...args);
        }
    }

    info(...args) {
        if (this.enabled) {
            console.info(...args);
        }
    }

    warn(...args) {
        if (this.enabled) {
            console.warn(...args);
        }
    }

    error(...args) {
        if (this.enabled) {
            console.error(...args);
        }
    }

    time(label) {
        if (this.enabled) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.enabled) {
            console.timeEnd(label);
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export default Logger;