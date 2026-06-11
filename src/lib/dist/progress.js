"use strict";
exports.__esModule = true;
exports.getPaceStatus = exports.calcTimeProgressPercent = exports.getUrgencyProgressColor = exports.calcDaysLeft = exports.calcCompletionPercent = void 0;
function calcCompletionPercent(completed, total) {
    if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0)
        return 0;
    var raw = (completed / total) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
}
exports.calcCompletionPercent = calcCompletionPercent;
function calcDaysLeft(endDate) {
    if (!endDate)
        return null;
    return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}
exports.calcDaysLeft = calcDaysLeft;
function getUrgencyProgressColor(daysLeft) {
    if (daysLeft == null)
        return 'bg-primary';
    if (daysLeft < 0)
        return 'bg-destructive';
    if (daysLeft <= 7)
        return 'bg-orange-500';
    return 'bg-primary';
}
exports.getUrgencyProgressColor = getUrgencyProgressColor;
function calcTimeProgressPercent(startDate, endDate) {
    if (!startDate || !endDate)
        return null;
    var start = new Date(startDate).getTime();
    var end = new Date(endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
        return null;
    var now = Date.now();
    var total = end - start;
    var elapsed = Math.max(0, Math.min(total, now - start));
    var raw = (elapsed / total) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
}
exports.calcTimeProgressPercent = calcTimeProgressPercent;
function getPaceStatus(actionProgress, timeProgress) {
    var delta = actionProgress - timeProgress;
    if (delta >= 10)
        return 'ahead';
    if (delta <= -10)
        return 'behind';
    return 'onTrack';
}
exports.getPaceStatus = getPaceStatus;
