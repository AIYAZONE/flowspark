'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.GoalEntryRow = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var card_1 = require("@/components/ui/card");
var button_1 = require("@/components/ui/button");
var actions_1 = require("@/app/(authenticated)/goals/entries/actions");
var ConvertGoalEntryToActionDialog_1 = require("@/components/ConvertGoalEntryToActionDialog");
var EditGoalEntryDialog_1 = require("@/components/EditGoalEntryDialog");
var ConfirmDeleteGoalEntryDialog_1 = require("@/components/ConfirmDeleteGoalEntryDialog");
var GoalEntryDetailsSheet_1 = require("@/components/GoalEntryDetailsSheet");
var RichTextContentView_1 = require("@/components/RichTextContentView");
var RichTextImagePreviewDialog_1 = require("@/components/RichTextImagePreviewDialog");
var utils_1 = require("@/lib/utils");
var HoverLabel = react_1.forwardRef(function (_a, ref) {
    var label = _a.label, children = _a.children, className = _a.className, props = __rest(_a, ["label", "children", "className"]);
    return (React.createElement("div", __assign({ ref: ref, className: utils_1.cn('relative group/hoverlabel', className) }, props),
        children,
        React.createElement("div", { className: "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-2 py-1 text-[11px] text-foreground opacity-0 shadow-sm transition-opacity group-hover/hoverlabel:opacity-100" }, label)));
});
HoverLabel.displayName = 'HoverLabel';
function GoalEntryRow(_a) {
    var entry = _a.entry, goalId = _a.goalId, dict = _a.dict, startDefault = _a.startDefault, endDefault = _a.endDefault;
    var _b = react_1.useState(null), previewImageUrl = _b[0], setPreviewImageUrl = _b[1];
    var _c = react_1.useState(false), detailsOpen = _c[0], setDetailsOpen = _c[1];
    var isJourney = entry.kind === 'journey';
    var isArchived = entry.status === 'archived';
    var kindLabel = isJourney ? dict.goals.detail.tabJourney : dict.goals.detail.tabInspiration;
    var dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(entry.created_at));
    var timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at));
    var locale = String(dict.common.locale || '').toLowerCase();
    var noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes');
    function shouldIgnoreMobileOpen(target, currentTarget) {
        if (!(target instanceof Element))
            return false;
        if (target.closest('img, a, button, input, textarea, select, [data-richtext-image="true"]'))
            return true;
        var nestedButton = target.closest('[role="button"]');
        return Boolean(nestedButton && nestedButton !== currentTarget);
    }
    function openMobileDetails(event) {
        if (shouldIgnoreMobileOpen(event.target, event.currentTarget))
            return;
        setDetailsOpen(true);
    }
    function handleEntryActivate(event) {
        if (event.key !== 'Enter' && event.key !== ' ')
            return;
        event.preventDefault();
        setDetailsOpen(true);
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(card_1.Card, { className: utils_1.cn('group relative isolate overflow-hidden md:overflow-visible rounded-2xl border shadow-sm transition-colors', isJourney
                ? 'border-primary/15 bg-linear-to-br from-primary/8 via-background to-background'
                : 'border-amber-500/15 bg-linear-to-br from-amber-500/[0.07] via-background to-background', isArchived ? 'opacity-80' : null) },
            React.createElement(card_1.CardContent, { className: "p-0" },
                React.createElement("div", { className: "p-5" },
                    React.createElement("div", { role: "button", tabIndex: 0, onClick: openMobileDetails, onKeyDown: handleEntryActivate, className: "space-y-4 rounded-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:cursor-default" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement("div", { className: "flex flex-wrap items-center gap-2 pr-14 md:pr-14" },
                                React.createElement("div", { className: utils_1.cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium', isJourney ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300') },
                                    isJourney ? React.createElement(lucide_react_1.Sparkles, { className: "h-3.5 w-3.5" }) : React.createElement(lucide_react_1.Lightbulb, { className: "h-3.5 w-3.5" }),
                                    kindLabel),
                                React.createElement("div", { className: "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground" },
                                    React.createElement(lucide_react_1.CalendarDays, { className: "h-3.5 w-3.5" }),
                                    dateText,
                                    " ",
                                    timeText),
                                isArchived ? (React.createElement("div", { className: "rounded-full border border-border/60 bg-muted px-2.5 py-1 text-[11px] text-muted-foreground" }, dict.goals.status.archived)) : null),
                            React.createElement("div", { className: "md:hidden pt-1 text-muted-foreground/60" },
                                React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4" })),
                            React.createElement("div", { className: "hidden md:flex absolute right-4 top-4 z-50 pointer-events-auto items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100" },
                                isArchived ? (React.createElement("form", { action: actions_1.unarchiveGoalEntry },
                                    React.createElement("input", { type: "hidden", name: "id", value: entry.id }),
                                    React.createElement("input", { type: "hidden", name: "goal_id", value: goalId }),
                                    React.createElement(HoverLabel, { label: dict.goals.detail.unarchiveAction },
                                        React.createElement(button_1.Button, { type: "submit", variant: "ghost", size: "icon", title: dict.goals.detail.unarchiveAction, "aria-label": dict.goals.detail.unarchiveAction },
                                            React.createElement(lucide_react_1.Undo2, { className: "h-4 w-4" }))))) : (React.createElement(React.Fragment, null,
                                    React.createElement(EditGoalEntryDialog_1.EditGoalEntryDialog, { entry: { id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }, goalId: goalId, dict: dict, trigger: React.createElement(HoverLabel, { label: dict.common.edit },
                                            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", title: dict.common.edit, "aria-label": dict.common.edit },
                                                React.createElement(lucide_react_1.Pencil, { className: "h-4 w-4" }))) }),
                                    React.createElement(ConvertGoalEntryToActionDialog_1.ConvertGoalEntryToActionDialog, { entry: { id: entry.id, content: entry.content, note: entry.note }, goalId: goalId, dict: dict, startDefault: startDefault, endDefault: endDefault, trigger: React.createElement(HoverLabel, { label: dict.goals.detail.convertToAction },
                                            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", title: dict.goals.detail.convertToAction, "aria-label": dict.goals.detail.convertToAction },
                                                React.createElement(lucide_react_1.ListChecks, { className: "h-4 w-4" }))) }),
                                    React.createElement("form", { action: actions_1.archiveGoalEntry },
                                        React.createElement("input", { type: "hidden", name: "id", value: entry.id }),
                                        React.createElement("input", { type: "hidden", name: "goal_id", value: goalId }),
                                        React.createElement(HoverLabel, { label: dict.goals.detail.archiveEntry },
                                            React.createElement(button_1.Button, { type: "submit", variant: "ghost", size: "icon", title: dict.goals.detail.archiveEntry, "aria-label": dict.goals.detail.archiveEntry },
                                                React.createElement(lucide_react_1.Archive, { className: "h-4 w-4" })))))),
                                React.createElement(ConfirmDeleteGoalEntryDialog_1.ConfirmDeleteGoalEntryDialog, { id: entry.id, goalId: goalId, dict: dict, trigger: React.createElement(HoverLabel, { label: dict.common["delete"] },
                                        React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", title: dict.common["delete"], "aria-label": dict.common["delete"], className: "text-muted-foreground hover:text-destructive" },
                                            React.createElement(lucide_react_1.Trash2, { className: "h-4 w-4" }))) }))),
                        React.createElement("div", { className: "rounded-2xl border border-border/60 bg-background/85 px-4 py-3" },
                            React.createElement(RichTextContentView_1.RichTextContentView, { html: entry.content, onImageClick: setPreviewImageUrl })),
                        entry.note ? (React.createElement("div", { className: utils_1.cn('rounded-2xl border px-4 py-3', isJourney ? 'border-primary/12 bg-primary/4' : 'border-amber-500/12 bg-amber-500/4') },
                            React.createElement("div", { className: "mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground" }, noteLabel),
                            React.createElement("div", { className: "whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground" }, entry.note))) : null)))),
        React.createElement(GoalEntryDetailsSheet_1.GoalEntryDetailsSheet, { open: detailsOpen, onOpenChange: setDetailsOpen, entry: entry, goalId: goalId, dict: dict, startDefault: startDefault, endDefault: endDefault }),
        React.createElement(RichTextImagePreviewDialog_1.RichTextImagePreviewDialog, { open: Boolean(previewImageUrl), imageUrl: previewImageUrl, title: dict.common.imagePreviewTitle, openOriginalLabel: dict.common.openOriginal, onOpenChange: function (open) {
                if (!open)
                    setPreviewImageUrl(null);
            } })));
}
exports.GoalEntryRow = GoalEntryRow;
