"use strict";
exports.__esModule = true;
exports.GoalProgressList = void 0;
var card_1 = require("@/components/ui/card");
var lucide_react_1 = require("lucide-react");
var link_1 = require("next/link");
var progress_1 = require("@/lib/progress");
function GoalProgressList(_a) {
    var dict = _a.dict, goals = _a.goals;
    var getDaysLeftLabel = function (daysLeft) {
        if (daysLeft == null)
            return null;
        if (daysLeft < 0)
            return dict.dashboard.goals.overdue || 'Overdue';
        return (dict.dashboard.goals.daysLeft || '{days} days left').replace('{days}', daysLeft.toString());
    };
    var getRemainingLabel = function (remainingActions, totalActions) {
        if (totalActions <= 0)
            return dict.dashboard.goals.needsBreakdown || 'Needs breakdown';
        return (dict.dashboard.goals.remaining || 'Remaining {count}').replace('{count}', remainingActions.toString());
    };
    var getPaceLabel = function (paceStatus) {
        if (paceStatus === 'ahead')
            return dict.dashboard.goals.paceAhead || 'Ahead';
        if (paceStatus === 'behind')
            return dict.dashboard.goals.paceBehind || 'Behind';
        return dict.dashboard.goals.paceOnTrack || 'On track';
    };
    var getPaceBadgeClassName = function (paceStatus) {
        if (paceStatus === 'ahead')
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        if (paceStatus === 'behind')
            return 'border-rose-200 bg-rose-50 text-rose-700';
        return 'border-border/60 bg-background/60 text-muted-foreground';
    };
    return (React.createElement(card_1.Card, { className: "col-span-1 shadow-sm border-border/60 md:pb-6" },
        React.createElement(card_1.CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-4" },
            React.createElement("div", { className: "space-y-1" },
                React.createElement(card_1.CardTitle, { className: "text-lg font-semibold flex items-center gap-2" },
                    React.createElement(lucide_react_1.Target, { className: "h-5 w-5 text-primary" }),
                    dict.dashboard.goals.title),
                React.createElement("p", { className: "text-xs text-muted-foreground" }, dict.dashboard.goals.progressTip)),
            React.createElement(link_1["default"], { href: "/goals", className: "text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-muted" },
                dict.dashboard.goals.viewAll,
                " ",
                React.createElement(lucide_react_1.ArrowRight, { className: "h-3 w-3" }))),
        React.createElement(card_1.CardContent, { className: "grid gap-6 overflow-y-auto custom-scrollbar max-h-none md:max-h-[400px] md:pb-6" }, goals.length === 0 ? (React.createElement("div", { className: "text-center py-8 px-4 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center gap-2" },
            React.createElement("span", null, dict.dashboard.goals.noGoals || "No active goals to focus on."),
            React.createElement(link_1["default"], { href: "/goals", className: "text-primary hover:underline font-medium text-xs" }, dict.dashboard.goals.viewAll || "Go to Goals Library"))) : (goals.map(function (goal) { return ((function () {
            var daysLeftValue = progress_1.calcDaysLeft(goal.end_date);
            var daysLeftLabel = getDaysLeftLabel(daysLeftValue);
            var remainingLabel = getRemainingLabel(goal.remainingActions, goal.totalActions);
            var paceLabel = goal.paceStatus ? getPaceLabel(goal.paceStatus) : null;
            return (React.createElement(link_1["default"], { key: goal.id, href: "/goals/" + goal.id, className: "block rounded-xl p-3 -m-3 group hover:bg-muted/30 hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors", "aria-label": dict.dashboard.goals.title + ": " + goal.title },
                React.createElement("div", { className: "space-y-3" },
                    React.createElement("div", { className: "flex items-start justify-between text-sm gap-4" },
                        React.createElement("div", { className: "space-y-1 min-w-0 flex-1" },
                            React.createElement("div", { className: "font-semibold truncate text-foreground group-hover:text-foreground" }, goal.title),
                            React.createElement("div", { className: "flex items-center gap-2 text-xs text-muted-foreground" },
                                React.createElement("span", { className: goal.totalActions > 0 ? 'font-medium text-foreground/90' : '' }, remainingLabel),
                                goal.totalActions > 0 && (React.createElement(React.Fragment, null,
                                    React.createElement("span", { className: "w-0.5 h-0.5 bg-muted-foreground/50 rounded-full" }),
                                    React.createElement("span", null,
                                        goal.completedActions,
                                        " / ",
                                        goal.totalActions,
                                        " ",
                                        dict.dashboard.goals.actions))),
                                goal.end_date && (React.createElement(React.Fragment, null,
                                    React.createElement("span", { className: "w-0.5 h-0.5 bg-muted-foreground/50 rounded-full" }),
                                    React.createElement("span", { className: daysLeftValue != null && daysLeftValue < 0 ? 'text-destructive font-medium' : '' }, daysLeftLabel))))),
                        React.createElement("div", { className: "text-right shrink-0 w-[72px] flex flex-col items-end gap-0.5" },
                            React.createElement("span", { className: "text-sm font-bold font-mono text-foreground" }, goal.totalActions > 0 ? Math.round(goal.progress) + "%" : '—'),
                            paceLabel && goal.paceStatus ? (React.createElement("span", { className: "inline-flex items-center justify-end rounded-full border px-2 py-0.5 text-[10px] leading-none " + getPaceBadgeClassName(goal.paceStatus) }, paceLabel)) : null)),
                    React.createElement("div", { className: "h-2.5 w-full bg-muted/50 rounded-full overflow-hidden" },
                        React.createElement("div", { className: "h-full transition-all duration-500 ease-out rounded-full " + progress_1.getUrgencyProgressColor(daysLeftValue), style: { width: goal.progress + "%" } })))));
        })()); })))));
}
exports.GoalProgressList = GoalProgressList;
