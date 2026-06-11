'use client';
"use strict";
exports.__esModule = true;
exports.NewGoalDialogShell = void 0;
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var utils_1 = require("@/lib/utils");
var dialog_1 = require("@/components/ui/dialog");
var responsive_classes_1 = require("@/components/responsive-classes");
function NewGoalDialogShell(_a) {
    var open = _a.open, onOpenChange = _a.onOpenChange, title = _a.title, children = _a.children;
    return (React.createElement(dialog_1.Dialog, { open: open, onOpenChange: onOpenChange },
        React.createElement(dialog_1.DialogFormContent, { mobileMode: "fullscreen", hideCloseButton: true, className: utils_1.cn('p-0', responsive_classes_1.DESKTOP_MODAL_SHELL_CLASS, 'md:left-[50%] md:top-[50%] md:bottom-auto md:right-auto md:h-auto md:w-full md:max-w-4xl md:max-h-[85vh] md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border') },
            React.createElement("div", { className: "flex h-dvh flex-col md:h-[85vh]" },
                React.createElement("div", { className: "sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur px-4 py-3 md:px-6" },
                    React.createElement(dialog_1.DialogHeader, { className: "space-y-0 text-left" },
                        React.createElement("div", { className: "flex items-center justify-between gap-4" },
                            React.createElement(dialog_1.DialogTitle, null, title),
                            React.createElement(dialog_1.DialogClose, { asChild: true },
                                React.createElement(button_1.Button, { type: "button", size: "icon", variant: "ghost", className: "h-9 w-9 rounded-full" },
                                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))))),
                React.createElement("div", { className: "min-h-0 flex flex-1 flex-col" }, children)))));
}
exports.NewGoalDialogShell = NewGoalDialogShell;
