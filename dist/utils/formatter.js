"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
function formatDuration(ms) {
    if (typeof ms !== "number" || ms < 0) {
        return "00:00:00:000";
    }
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor(((ms % 3600000) % 60000) / 1000);
    const milliseconds = ms % 1000;
    const pad = (num, size = 2) => num.toString().padStart(size, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${milliseconds
        .toString()
        .padStart(3, "0")}`;
}
