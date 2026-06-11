'use client';
"use strict";
exports.__esModule = true;
exports.DesktopQuickAccess = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var navigation_1 = require("next/navigation");
var AddGoalDialog_1 = require("@/components/AddGoalDialog");
var AddActionDialog_1 = require("@/components/AddActionDialog");
var QuickCaptureDialog_1 = require("@/components/QuickCaptureDialog");
var AITodayPlanButton_1 = require("@/components/AITodayPlanButton");
var responsive_classes_1 = require("@/components/responsive-classes");
var button_1 = require("@/components/ui/button");
var DESKTOP_QUICK_ACCESS_OPEN_KEY = 'desktop-quick-access-open-v1';
var DESKTOP_QUICK_ACCESS_EVENT = 'desktop-quick-access-open-change';
function subscribeDesktopQuickAccess(onStoreChange) {
    var handleStorage = function (event) {
        if (event.key === null || event.key === DESKTOP_QUICK_ACCESS_OPEN_KEY) {
            onStoreChange();
        }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(DESKTOP_QUICK_ACCESS_EVENT, onStoreChange);
    return function () {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(DESKTOP_QUICK_ACCESS_EVENT, onStoreChange);
    };
}
function getDesktopQuickAccessSnapshot() {
    return window.localStorage.getItem(DESKTOP_QUICK_ACCESS_OPEN_KEY) === '1';
}
function getDesktopQuickAccessServerSnapshot() {
    return false;
}
function DesktopQuickAccess(_a) {
    var dict = _a.dict, activeGoals = _a.activeGoals, tz = _a.tz, today = _a.today;
    var open = react_1.useSyncExternalStore(subscribeDesktopQuickAccess, getDesktopQuickAccessSnapshot, getDesktopQuickAccessServerSnapshot);
    var pathname = navigation_1.usePathname();
    var showAddGoalEntry = pathname === '/goals' || pathname.startsWith('/goals/');
    var setOpen = react_1.useCallback(function (nextOpen) {
        window.localStorage.setItem(DESKTOP_QUICK_ACCESS_OPEN_KEY, nextOpen ? '1' : '0');
        window.dispatchEvent(new Event(DESKTOP_QUICK_ACCESS_EVENT));
    }, []);
    react_1.useEffect(function () {
        if (!open)
            return;
        var onKeyDown = function (e) {
            if (e.key === 'Escape')
                setOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return function () { return window.removeEventListener('keydown', onKeyDown); };
    }, [open, setOpen]);
    return (React.createElement(React.Fragment, null,
        open ? React.createElement("div", { className: "fixed inset-0 z-30 " + responsive_classes_1.TABLET_AND_UP_CLASS, onClick: function () { return setOpen(false); } }) : null,
        React.createElement("div", { className: "fixed bottom-6 right-6 z-40 " + responsive_classes_1.TABLET_AND_UP_CLASS }, open ? (React.createElement("div", { className: "w-[320px] rounded-3xl border border-border/60 bg-background/92 p-4 shadow-2xl backdrop-blur" },
            React.createElement("div", { className: "mb-3 flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-sm font-semibold text-foreground" }, dict.quickCapture.fabLabel),
                    React.createElement("div", { className: "text-xs text-muted-foreground" }, "Quick shortcuts")),
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("div", { className: "inline-flex rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary" }, "AI + Quick Actions"),
                    React.createElement(button_1.Button, { type: "button", size: "icon", variant: "ghost", className: "h-8 w-8 rounded-full", onClick: function () { return setOpen(false); } },
                        React.createElement(lucide_react_1.Plus, { className: "h-4 w-4 rotate-45" })))),
            React.createElement("div", { className: "grid gap-2" },
                showAddGoalEntry ? (React.createElement(AddGoalDialog_1.AddGoalDialog, { dict: dict, trigger: React.createElement(button_1.Button, { type: "button", variant: "outline", className: "w-full justify-start gap-2 rounded-2xl" },
                        React.createElement(lucide_react_1.Target, { className: "h-4 w-4" }),
                        dict.goals.newGoal) })) : null,
                React.createElement(AddActionDialog_1.AddActionDialog, { activeGoals: activeGoals, dict: dict, tz: tz, trigger: React.createElement(button_1.Button, { type: "button", variant: "outline", className: "w-full justify-start gap-2 rounded-2xl" },
                        React.createElement(lucide_react_1.Plus, { className: "h-4 w-4" }),
                        dict.quickCapture.addAction) }),
                React.createElement(QuickCaptureDialog_1.QuickCaptureDialog, { dict: dict, trigger: React.createElement(button_1.Button, { type: "button", variant: "outline", className: "w-full justify-start gap-2 rounded-2xl" },
                        React.createElement(lucide_react_1.Lightbulb, { className: "h-4 w-4" }),
                        dict.quickCapture.addIdea) }),
                React.createElement(AITodayPlanButton_1.AITodayPlanButton, { dict: dict, goals: activeGoals, defaultDate: today, source: "today", trigger: React.createElement(button_1.Button, { type: "button", className: "w-full justify-start gap-2 rounded-2xl" },
                        React.createElement(lucide_react_1.Bot, { className: "h-4 w-4" }),
                        dict.dashboard.planning.aiPlanBtn) })))) : (React.createElement(button_1.Button, { type: "button", size: "icon", className: "h-14 w-14 rounded-full shadow-lg", "aria-label": dict.quickCapture.fabLabel, onClick: function () { return setOpen(true); } },
            React.createElement(lucide_react_1.Plus, { className: "h-6 w-6" }))))));
}
exports.DesktopQuickAccess = DesktopQuickAccess;
