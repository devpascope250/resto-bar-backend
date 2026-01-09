"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = taxRounder;
function taxRounder(value) {
    // The CIS shall round values of tax on two decimals. (<5 - down, >=5 - up)
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
