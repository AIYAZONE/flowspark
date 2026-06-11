'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ConvertInboxToActionDialog = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var dialog_1 = require("@/components/ui/dialog");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var textarea_1 = require("@/components/ui/textarea");
var DateRangeFields_1 = require("@/components/DateRangeFields");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var actions_1 = require("@/app/(authenticated)/inbox/actions");
var select_1 = require("@/components/ui/select");
var use_mobile_input_visible_1 = require("@/components/ui/use-mobile-input-visible");
var utils_1 = require("@/lib/utils");
var responsive_classes_1 = require("@/components/responsive-classes");
function ConvertInboxToActionDialog(_a) {
    var item = _a.item, activeGoals = _a.activeGoals, dict = _a.dict, startDefault = _a.startDefault, endDefault = _a.endDefault, trigger = _a.trigger, onSuccess = _a.onSuccess;
    var _b = react_1.useState(false), open = _b[0], setOpen = _b[1];
    var _c = react_1.useState(false), isDesktopFullscreen = _c[0], setIsDesktopFullscreen = _c[1];
    var _d = react_1.useTransition(), isPending = _d[0], startTransition = _d[1];
    var _e = react_1.useState(null), error = _e[0], setError = _e[1];
    var titleRef = react_1.useRef(null);
    var initialDescription = react_1.useMemo(function () {
        var parts = [];
        if (item.note)
            parts.push(item.note);
        if (item.tags.length > 0)
            parts.push(item.tags.map(function (t) { return "#" + t; }).join(' '));
        return parts.join('\n\n');
    }, [item.note, item.tags]);
    var _f = react_1.useState(''), goalId = _f[0], setGoalId = _f[1];
    var _g = react_1.useState(item.content), title = _g[0], setTitle = _g[1];
    var _h = react_1.useState(initialDescription), description = _h[0], setDescription = _h[1];
    var _j = react_1.useState('core'), type = _j[0], setType = _j[1];
    var _k = react_1.useState('medium'), priority = _k[0], setPriority = _k[1];
    function handleOpenChange(next) {
        var _a;
        setOpen(next);
        if (!next) {
            setIsDesktopFullscreen(false);
            return;
        }
        setError(null);
        setGoalId(((_a = activeGoals[0]) === null || _a === void 0 ? void 0 : _a.id) || '');
        setTitle(item.content);
        setDescription(initialDescription);
        setType('core');
        setPriority('medium');
    }
    use_mobile_input_visible_1.useMobileInputVisible(open, titleRef);
    var keyboardInset = use_mobile_input_visible_1.useMobileKeyboardInset(open);
    function handleSubmit(formData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                setError(null);
                startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_1, key, errors;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, actions_1.convertInboxItemToAction(formData)];
                            case 1:
                                _a.sent();
                                setOpen(false);
                                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
                                return [3 /*break*/, 3];
                            case 2:
                                err_1 = _a.sent();
                                key = err_1 instanceof Error ? err_1.message : 'operation_failed';
                                errors = dict.common.errors;
                                setError(errors[key] || dict.common.errors.operation_failed);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    }
    return (React.createElement(dialog_1.Dialog, { open: open, onOpenChange: handleOpenChange },
        React.createElement(dialog_1.DialogTrigger, { asChild: true }, trigger),
        React.createElement(dialog_1.DialogFormContent, { mobileMode: "fullscreen", hideCloseButton: true, className: utils_1.cn('p-0', responsive_classes_1.DESKTOP_MODAL_SHELL_CLASS, isDesktopFullscreen
                ? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
                : 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border!') },
            React.createElement("div", { className: utils_1.cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]') },
                React.createElement(dialog_1.DialogHeader, { className: "border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6" },
                    React.createElement("div", { className: "flex items-start justify-between gap-3" },
                        React.createElement(dialog_1.DialogTitle, { className: "min-w-0 flex-1 text-left leading-snug" }, dict.inbox.convertTitle),
                        React.createElement("div", { className: "flex shrink-0 items-center gap-1" },
                            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground", onClick: function () { return setIsDesktopFullscreen(function (value) { return !value; }); } },
                                isDesktopFullscreen ? React.createElement(lucide_react_1.Minimize2, { className: "h-4 w-4" }) : React.createElement(lucide_react_1.Maximize2, { className: "h-4 w-4" }),
                                React.createElement("span", { className: "sr-only" }, isDesktopFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen)),
                            React.createElement(dialog_1.DialogClose, { asChild: true },
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" },
                                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" }),
                                    React.createElement("span", { className: "sr-only" }, "Close")))))),
                React.createElement("form", { action: handleSubmit, className: "flex min-h-0 flex-1 flex-col" },
                    React.createElement("input", { type: "hidden", name: "inbox_id", value: item.id }),
                    React.createElement("div", { className: "min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6", style: { paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined } },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "goal-" + item.id }, dict.inbox.goalLabel),
                            React.createElement(select_1.Select, { value: goalId, onValueChange: setGoalId },
                                React.createElement(select_1.SelectTrigger, { id: "goal-" + item.id },
                                    React.createElement(select_1.SelectValue, { placeholder: dict.inbox.goalPlaceholder })),
                                React.createElement(select_1.SelectContent, null, activeGoals.map(function (g) { return (React.createElement(select_1.SelectItem, { key: g.id, value: g.id }, g.title)); }))),
                            React.createElement("input", { type: "hidden", name: "goal_id", value: goalId })),
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "title-" + item.id }, dict.inbox.actionTitleLabel),
                            React.createElement(input_1.Input, { ref: titleRef, id: "title-" + item.id, name: "title", value: title, onChange: function (e) { return setTitle(e.target.value); }, required: true })),
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "desc-" + item.id }, dict.inbox.actionDescLabel),
                            React.createElement(textarea_1.Textarea, { id: "desc-" + item.id, name: "description", value: description, onChange: function (e) { return setDescription(e.target.value); }, rows: 8, className: "min-h-[28dvh] md:min-h-[220px]" })),
                        React.createElement(DateRangeFields_1.DateRangeFields, { defaultStart: startDefault, defaultEnd: endDefault, className: "grid-cols-1 md:grid-cols-2", labels: {
                                start: dict.today.startTime,
                                end: dict.today.endTime,
                                error: dict.common.dateRangeInvalid
                            } }),
                        React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, null, dict.today.typeLabel),
                                React.createElement(select_1.Select, { value: type, onValueChange: setType },
                                    React.createElement(select_1.SelectTrigger, null,
                                        React.createElement(select_1.SelectValue, null)),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "core" }, dict.today.types.core),
                                        React.createElement(select_1.SelectItem, { value: "maintenance" }, dict.today.types.maintenance),
                                        React.createElement(select_1.SelectItem, { value: "learning" }, dict.today.types.learning),
                                        React.createElement(select_1.SelectItem, { value: "review" }, dict.today.types.review),
                                        React.createElement(select_1.SelectItem, { value: "rest" }, dict.today.types.rest))),
                                React.createElement("input", { type: "hidden", name: "type", value: type })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, null, dict.today.priorityLabel),
                                React.createElement(select_1.Select, { value: priority, onValueChange: setPriority },
                                    React.createElement(select_1.SelectTrigger, null,
                                        React.createElement(select_1.SelectValue, null)),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "high" }, dict.goals.priority.high),
                                        React.createElement(select_1.SelectItem, { value: "medium" }, dict.goals.priority.medium),
                                        React.createElement(select_1.SelectItem, { value: "low" }, dict.goals.priority.low))),
                                React.createElement("input", { type: "hidden", name: "priority", value: priority }))),
                        error ? React.createElement("div", { className: "text-sm text-destructive" }, error) : null),
                    React.createElement("div", { className: "border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:bg-background/95 md:px-6 md:py-4", style: { paddingBottom: open && keyboardInset > 0 ? "calc(env(safe-area-inset-bottom) + " + keyboardInset + "px)" : undefined } },
                        React.createElement("div", { className: "flex items-center justify-end gap-2" },
                            React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return setOpen(false); }, disabled: isPending }, dict.common.cancel),
                            React.createElement(button_1.Button, { type: "submit", disabled: isPending || !goalId || !title.trim() }, isPending ? (React.createElement(React.Fragment, null,
                                React.createElement(loading_spinner_1.LoadingSpinner, { className: "mr-2 h-4 w-4 text-current" }),
                                dict.common.saving)) : (dict.inbox.convertCta)))))))));
}
exports.ConvertInboxToActionDialog = ConvertInboxToActionDialog;
