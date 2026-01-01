"use strict";
// src/utils/DateUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
class DateUtils {
    static parse(str) {
        if (!/^\d{8,14}$/.test(str))
            throw new Error("Invalid date format");
        const year = Number(str.slice(0, 4));
        const month = Number(str.slice(4, 6)) - 1;
        const day = Number(str.slice(6, 8));
        const hour = Number(str.slice(8, 10)) || 0;
        const minute = Number(str.slice(10, 12)) || 0;
        const second = Number(str.slice(12, 14)) || 0;
        const d = new Date(year, month, day, hour, minute, second);
        if (isNaN(d.getTime()))
            throw new Error("Invalid date value");
        return d;
    }
    /**
     * Format a JS Date object to "YYYYMMDDHHMMSS"
     */
    static format(date) {
        const pad = (n) => n.toString().padStart(2, "0");
        return (date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds()));
    }
    // format to yyyymmdd
    static formatToYYYYMMDD(date) {
        const pad = (n) => n.toString().padStart(2, "0");
        return (date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()));
    }
    static now() {
        return this.format(new Date());
    }
}
exports.DateUtils = DateUtils;
