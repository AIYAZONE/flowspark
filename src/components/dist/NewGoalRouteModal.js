'use client';
"use strict";
exports.__esModule = true;
exports.NewGoalRouteModal = void 0;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var NewGoalDialogShell_1 = require("@/components/NewGoalDialogShell");
var NewGoalForm_1 = require("@/components/NewGoalForm");
var actions_1 = require("@/app/(authenticated)/goals/actions");
function NewGoalRouteModal(_a) {
    var dict = _a.dict;
    var router = navigation_1.useRouter();
    var _b = react_1.useState(true), open = _b[0], setOpen = _b[1];
    return (React.createElement(NewGoalDialogShell_1.NewGoalDialogShell, { open: open, title: dict.goals.newGoal, onOpenChange: function (next) {
            setOpen(next);
            if (!next)
                router.back();
        } },
        React.createElement(NewGoalForm_1.NewGoalForm, { dict: dict, fixedFooter: true, action: actions_1.createGoalModal, onSuccess: function () {
                setOpen(false);
                router.back();
            } })));
}
exports.NewGoalRouteModal = NewGoalRouteModal;
