"use strict";
exports.__esModule = true;
exports.buildGoalCalendarICS = void 0;
var utils_1 = require("@/lib/utils");
function escapeICSText(input) {
    return input
        .replaceAll('\\', '\\\\')
        .replaceAll(';', '\\;')
        .replaceAll(',', '\\,')
        .replaceAll(/\r?\n/g, '\\n');
}
function toICSDate(date) {
    return date.replaceAll('-', '');
}
function addOneDay(date) {
    var base = new Date(date + "T00:00:00.000Z");
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString().slice(0, 10);
}
function slugifyFilename(input) {
    var normalized = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || 'flowspark-goal';
}
function buildGoalCalendarICS(params) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    var lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FlowSpark//Goal Calendar Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        "X-WR-CALNAME:" + escapeICSText(params.goalTitle),
    ];
    for (var _i = 0, _a = params.events; _i < _a.length; _i++) {
        var event = _a[_i];
        var startDate = event.startDate;
        var endDate = event.endDate || event.startDate;
        var descriptionParts = [
            event.type ? "Type: " + event.type : null,
            event.priority ? "Priority: " + event.priority : null,
            utils_1.stripHtmlToPlainText(event.description, { preserveLineBreaks: true }) || null,
        ].filter(Boolean);
        lines.push('BEGIN:VEVENT', "UID:" + event.id + "@flowspark.goal", "DTSTAMP:" + stamp, "SUMMARY:" + escapeICSText(event.title), "DTSTART;VALUE=DATE:" + toICSDate(startDate), "DTEND;VALUE=DATE:" + toICSDate(addOneDay(endDate)), "DESCRIPTION:" + escapeICSText(descriptionParts.join('\n')), 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return {
        filename: slugifyFilename(params.goalTitle) + ".ics",
        content: lines.join('\r\n') + "\r\n"
    };
}
exports.buildGoalCalendarICS = buildGoalCalendarICS;
