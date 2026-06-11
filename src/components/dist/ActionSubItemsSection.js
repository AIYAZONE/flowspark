'use client';
"use strict";
exports.__esModule = true;
exports.ActionSubItemsSection = void 0;
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
function ActionSubItemsSection(_a) {
    var items = _a.items, label = _a.label, completedCount = _a.completedCount, onToggleItem = _a.onToggleItem, busyId = _a.busyId, _b = _a.collapsible, collapsible = _b === void 0 ? false : _b, _c = _a.expanded, expanded = _c === void 0 ? true : _c, onExpandedChange = _a.onExpandedChange, _d = _a.showMoreLabel, showMoreLabel = _d === void 0 ? 'Show more' : _d, _e = _a.showLessLabel, showLessLabel = _e === void 0 ? 'Show less' : _e, className = _a.className, itemClassName = _a.itemClassName;
    if (items.length === 0)
        return null;
    var content = (React.createElement("div", { className: "space-y-1" }, items.map(function (item) {
        var interactive = Boolean(onToggleItem);
        var handleToggle = function () {
            if (!onToggleItem)
                return;
            onToggleItem(item.id, item.completed);
        };
        var itemBody = (React.createElement(React.Fragment, null,
            item.completed ? (React.createElement(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5 text-primary" })) : (React.createElement(lucide_react_1.Circle, { className: "h-3.5 w-3.5 text-muted-foreground" })),
            React.createElement("span", { className: item.completed ? 'line-through text-muted-foreground' : 'text-foreground' }, item.title)));
        return interactive ? (React.createElement("button", { key: item.id, type: "button", className: utils_1.cn('flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-background/50', itemClassName), onClick: handleToggle, disabled: busyId === item.id }, itemBody)) : (React.createElement("div", { key: item.id, className: utils_1.cn('flex items-center gap-2 rounded px-1 py-1 text-xs', itemClassName) }, itemBody));
    })));
    return (React.createElement("div", { className: utils_1.cn('rounded-md border border-border/40 bg-secondary/15 p-2', className) }, collapsible ? (React.createElement(React.Fragment, null,
        React.createElement("button", { type: "button", className: "flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:bg-background/60", onClick: function () { return onExpandedChange === null || onExpandedChange === void 0 ? void 0 : onExpandedChange(!expanded); } },
            React.createElement("span", { className: "font-medium" },
                label,
                " ",
                completedCount,
                "/",
                items.length),
            React.createElement("span", { className: "inline-flex items-center gap-1" },
                expanded ? showLessLabel : showMoreLabel,
                expanded ? React.createElement(lucide_react_1.ChevronDown, { className: "h-3.5 w-3.5" }) : React.createElement(lucide_react_1.ChevronRight, { className: "h-3.5 w-3.5" }))),
        expanded ? React.createElement("div", { className: "mt-2" }, content) : null)) : (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "mb-2 text-xs font-medium text-muted-foreground" },
            label,
            " ",
            completedCount,
            "/",
            items.length),
        content))));
}
exports.ActionSubItemsSection = ActionSubItemsSection;
