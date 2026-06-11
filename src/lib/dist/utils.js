"use strict";
exports.__esModule = true;
exports.stripHtmlToPlainText = exports.cn = void 0;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return tailwind_merge_1.twMerge(clsx_1.clsx(inputs));
}
exports.cn = cn;
function stripHtmlToPlainText(input, options) {
    if (!input)
        return "";
    var normalized = input
        .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
        .replace(/<li\b[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
    if (options === null || options === void 0 ? void 0 : options.preserveLineBreaks) {
        return normalized
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " ")
            .trim();
    }
    return normalized.replace(/\s+/g, " ").trim();
}
exports.stripHtmlToPlainText = stripHtmlToPlainText;
