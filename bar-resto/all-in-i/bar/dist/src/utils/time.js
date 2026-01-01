"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtcNow = exports.getUtcDateOffset = void 0;
const luxon_1 = require("luxon");
// utcOffsetInMinutes is +120 for Kigali
const getUtcDateOffset = (offsetMinutes) => {
    return luxon_1.DateTime.utc().plus({ minutes: offsetMinutes }).toJSDate();
};
exports.getUtcDateOffset = getUtcDateOffset;
const getUtcNow = () => {
    return luxon_1.DateTime.utc().toJSDate();
};
exports.getUtcNow = getUtcNow;
