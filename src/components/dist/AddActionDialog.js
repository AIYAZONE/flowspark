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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.AddActionDialog = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var DateRangeFields_1 = require("@/components/DateRangeFields");
var framer_motion_1 = require("framer-motion");
var dialog_1 = require("@/components/ui/dialog");
var select_1 = require("@/components/ui/select");
var actions_1 = require("@/app/(authenticated)/goals/actions");
var NewGoalForm_1 = require("./NewGoalForm");
var actions_2 = require("@/app/(authenticated)/goals/actions");
var analytics_1 = require("@/lib/analytics");
var GoalRequiredIntroCard_1 = require("./GoalRequiredIntroCard");
var use_mobile_input_visible_1 = require("@/components/ui/use-mobile-input-visible");
var client_1 = require("@/lib/supabase/client");
var ActionDescriptionEditor_1 = require("@/components/ActionDescriptionEditor");
var ModalActionFooter_1 = require("@/components/ModalActionFooter");
var ModalHeaderActions_1 = require("@/components/ModalHeaderActions");
var responsive_classes_1 = require("@/components/responsive-classes");
var utils_1 = require("@/lib/utils");
function makeDraftId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        return crypto.randomUUID();
    return Date.now() + "-" + Math.random().toString(16).slice(2);
}
function AddActionDialog(_a) {
    var goalId = _a.goalId, activeGoals = _a.activeGoals, dict = _a.dict, _b = _a.tz, tz = _b === void 0 ? 'Asia/Shanghai' : _b, trigger = _a.trigger;
    var _c = react_1.useState(false), open = _c[0], setOpen = _c[1];
    var _d = react_1.useState(false), isFullscreen = _d[0], setIsFullscreen = _d[1];
    var _e = react_1.useTransition(), isPending = _e[0], startTransition = _e[1];
    var _f = react_1.useState(true), valid = _f[0], setValid = _f[1];
    var _g = react_1.useState(null), error = _g[0], setError = _g[1];
    var _h = react_1.useState('action'), step = _h[0], setStep = _h[1];
    var _j = react_1.useState(activeGoals || []), goals = _j[0], setGoals = _j[1];
    var _k = react_1.useState(goalId || undefined), selectedGoalId = _k[0], setSelectedGoalId = _k[1];
    var _l = react_1.useState(false), submitted = _l[0], setSubmitted = _l[1];
    var _m = react_1.useState(false), showGoalCreatedBanner = _m[0], setShowGoalCreatedBanner = _m[1];
    var _o = react_1.useState(''), actionTitle = _o[0], setActionTitle = _o[1];
    var _p = react_1.useState(''), actionDescription = _p[0], setActionDescription = _p[1];
    var _q = react_1.useState('core'), actionType = _q[0], setActionType = _q[1];
    var _r = react_1.useState('medium'), actionPriority = _r[0], setActionPriority = _r[1];
    var _s = react_1.useState('none'), actionRepeatRule = _s[0], setActionRepeatRule = _s[1];
    var _t = react_1.useState(''), actionStartDate = _t[0], setActionStartDate = _t[1];
    var _u = react_1.useState(''), actionEndDate = _u[0], setActionEndDate = _u[1];
    var _v = react_1.useState(false), aiLoading = _v[0], setAiLoading = _v[1];
    var _w = react_1.useState(null), aiError = _w[0], setAiError = _w[1];
    var _x = react_1.useState([]), aiDrafts = _x[0], setAiDrafts = _x[1];
    var _y = react_1.useState([]), subItemsDraft = _y[0], setSubItemsDraft = _y[1];
    var _z = react_1.useState([]), attachmentsDraft = _z[0], setAttachmentsDraft = _z[1];
    var _0 = react_1.useState(false), descriptionUploading = _0[0], setDescriptionUploading = _0[1];
    var _1 = react_1.useState(''), uploadUserId = _1[0], setUploadUserId = _1[1];
    var titleRef = react_1.useRef(null);
    var todayText = dict.today;
    var goalNewText = dict.goals["new"];
    var commonErrors = dict.common.errors;
    function handleOpenChange(next) {
        setOpen(next);
        if (next) {
            setIsFullscreen(false);
            setSubmitted(false);
            setError(null);
            setShowGoalCreatedBanner(false);
            setActionTitle('');
            setActionDescription('');
            setActionType('core');
            setActionPriority('medium');
            setActionRepeatRule('none');
            setAiLoading(false);
            setAiError(null);
            setAiDrafts([]);
            setSubItemsDraft([]);
            setAttachmentsDraft([]);
            setDescriptionUploading(false);
            analytics_1.logEvent('action_click_open');
            if (!goalId && (!activeGoals || activeGoals.length === 0)) {
                setStep('intro');
                analytics_1.logEvent('intro_shown', { reason: 'no_goals' });
            }
            else {
                setStep('action');
            }
        }
        else {
            setIsFullscreen(false);
            if (!submitted) {
                analytics_1.logEvent('dialog_close_without_submit', { step: step });
            }
        }
    }
    function handleSubmit(formData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                setError(null);
                startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
                    var normalizedSubItems, error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                normalizedSubItems = subItemsDraft
                                    .map(function (item, idx) { return ({ title: item.title.trim(), sort_order: idx }); })
                                    .filter(function (item) { return item.title.length > 0; });
                                formData.set('sub_items', JSON.stringify(normalizedSubItems));
                                return [4 /*yield*/, actions_1.createActionWithSubItems(formData)];
                            case 1:
                                _a.sent();
                                setSubmitted(true);
                                analytics_1.logEvent('action_create_success', { goalId: goalId || selectedGoalId });
                                setOpen(false);
                                return [3 /*break*/, 3];
                            case 2:
                                error_1 = _a.sent();
                                console.error(error_1);
                                setError(error_1 instanceof Error ? error_1.message : 'Failed to create action');
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    }
    var today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    react_1.useEffect(function () {
        if (!open)
            return;
        if (step !== 'action')
            return;
        setActionStartDate(today);
        setActionEndDate(today);
    }, [open, step, today]);
    function handleAISplitAction() {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var targetGoalId, goalTitle, locale, res, json, key, drafts, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setAiError(null);
                        setAiDrafts([]);
                        targetGoalId = goalId || selectedGoalId || '';
                        goalTitle = ((_a = goals.find(function (g) { return g.id === targetGoalId; })) === null || _a === void 0 ? void 0 : _a.title) || actionTitle.trim();
                        locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
                        if (!targetGoalId || !actionTitle.trim()) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        setAiLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/ai/breakdown', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    goalTitle: goalTitle,
                                    goalDescription: actionTitle.trim(),
                                    startDate: actionStartDate || today,
                                    endDate: actionEndDate || today,
                                    locale: locale
                                })
                            })];
                    case 2:
                        res = _c.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_c.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            setAiError(commonErrors[key] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        drafts = Array.isArray(json.actions) ? json.actions : [];
                        if (drafts.length === 0) {
                            setAiError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setAiDrafts(drafts.slice(0, 5));
                        return [3 /*break*/, 6];
                    case 4:
                        _b = _c.sent();
                        setAiError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 6];
                    case 5:
                        setAiLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function applyAIDraft(draft) {
        var title = draft.title.trim();
        if (!title)
            return;
        setSubItemsDraft(function (prev) {
            if (prev.some(function (item) { return item.title.trim() === title; }))
                return prev;
            return __spreadArrays(prev, [{ id: makeDraftId(), title: title }]);
        });
        setAiError(null);
    }
    function importAllAIDraftsAsSubItems() {
        if (aiDrafts.length === 0)
            return;
        setSubItemsDraft(function (prev) {
            var existing = new Set(prev.map(function (item) { return item.title.trim(); }));
            var imported = aiDrafts
                .map(function (draft) { return draft.title.trim(); })
                .filter(function (title) { return title && !existing.has(title); })
                .map(function (title) { return ({ id: makeDraftId(), title: title }); });
            return __spreadArrays(prev, imported);
        });
    }
    react_1.useEffect(function () {
        if (!open)
            return;
        if (step !== 'action')
            return;
        if (showGoalCreatedBanner) {
            var id_1 = window.setTimeout(function () { return setShowGoalCreatedBanner(false); }, 1500);
            return function () { return window.clearTimeout(id_1); };
        }
    }, [open, step, showGoalCreatedBanner]);
    react_1.useEffect(function () {
        if (!open)
            return;
        var supabase = client_1.createClient();
        void supabase.auth.getUser().then(function (_a) {
            var _b;
            var data = _a.data;
            var uid = ((_b = data.user) === null || _b === void 0 ? void 0 : _b.id) || '';
            setUploadUserId(uid);
        });
    }, [open]);
    use_mobile_input_visible_1.useMobileInputVisible(open && step === 'action', titleRef);
    var keyboardInset = use_mobile_input_visible_1.useMobileKeyboardInset(open && step === 'action');
    return (React.createElement(dialog_1.Dialog, { open: open, onOpenChange: handleOpenChange },
        React.createElement(dialog_1.DialogTrigger, { asChild: true }, trigger ? trigger : (React.createElement(button_1.Button, { size: "sm", className: "gap-1" },
            React.createElement(lucide_react_1.Plus, { className: "h-4 w-4" }),
            dict.goals.detail.addAction))),
        React.createElement(dialog_1.DialogFormContent, { mobileMode: isFullscreen ? 'fullscreen' : 'sheet', hideCloseButton: true, className: utils_1.cn('p-0', responsive_classes_1.DESKTOP_MODAL_SHELL_CLASS, !isFullscreen && 'md:max-w-[600px] md:max-h-[85vh]') }, step === 'intro' ? (React.createElement("div", { className: "relative h-full w-full overflow-hidden bg-linear-to-br from-primary/10 via-background to-background px-6 pb-8 pt-10" },
            React.createElement("div", { className: "pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" }),
            React.createElement("div", { className: "pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" }),
            React.createElement(framer_motion_1.AnimatePresence, { mode: "wait" },
                React.createElement(framer_motion_1.motion.div, { key: "intro", initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.16 } },
                    React.createElement(dialog_1.DialogHeader, null,
                        React.createElement(dialog_1.DialogTitle, { className: "sr-only" }, dict.today.addActionIntroTitle)),
                    React.createElement(GoalRequiredIntroCard_1.GoalRequiredIntroCard, { title: dict.today.addActionIntroTitle, description: dict.today.addActionIntroDesc, points: dict.today.addActionIntroPoints, icon: React.createElement(lucide_react_1.Target, { className: "h-5 w-5" }), primaryLabel: dict.today.createGoalAndContinue, secondaryLabel: dict.today.later, onPrimary: function () { setStep('goal'); analytics_1.logEvent('intro_continue'); }, onSecondary: function () { setOpen(false); analytics_1.logEvent('intro_cancel'); } }))))) : (React.createElement("div", { className: utils_1.cn('flex min-h-0 flex-1 flex-col', isFullscreen ? 'h-full' : 'md:max-h-[85dvh]') },
            React.createElement(framer_motion_1.AnimatePresence, { mode: "wait" },
                React.createElement(framer_motion_1.motion.div, { key: step, className: "flex min-h-0 flex-1 flex-col", initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.16 } }, step === 'goal' ? (React.createElement(React.Fragment, null,
                    React.createElement(dialog_1.DialogHeader, { className: "border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement(dialog_1.DialogTitle, { className: "min-w-0 flex-1 text-left leading-snug" }, dict.goals["new"].title),
                            React.createElement(ModalHeaderActions_1.ModalHeaderActions, { isFullscreen: isFullscreen, onToggleFullscreen: function () { return setIsFullscreen(function (value) { return !value; }); }, fullscreenLabel: dict.common.fullscreen, exitFullscreenLabel: dict.common.exitFullscreen, hideFullscreenOnMobile: true, renderCloseButton: function (button) { return React.createElement(dialog_1.DialogClose, { asChild: true }, button); } }))),
                    React.createElement(NewGoalForm_1.NewGoalForm, { dict: dict, fixedFooter: true, action: actions_2.createGoalModal, onSuccess: function (created) {
                            if ((created === null || created === void 0 ? void 0 : created.id) && created.title) {
                                setGoals(function (prev) { return __spreadArrays(prev, [{ id: created.id, title: created.title }]); });
                                setSelectedGoalId(created.id);
                                setShowGoalCreatedBanner(true);
                                analytics_1.logEvent('goal_create_success_from_action_flow', { goalId: created.id });
                                analytics_1.logEvent('goal_create_success_banner');
                            }
                            setStep('action');
                        } }))) : (React.createElement(React.Fragment, null,
                    React.createElement(dialog_1.DialogHeader, { className: "border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement(dialog_1.DialogTitle, { className: "min-w-0 flex-1 text-left leading-snug" }, dict.goals.detail.addAction),
                            React.createElement(ModalHeaderActions_1.ModalHeaderActions, { isFullscreen: isFullscreen, onToggleFullscreen: function () { return setIsFullscreen(function (value) { return !value; }); }, fullscreenLabel: dict.common.fullscreen, exitFullscreenLabel: dict.common.exitFullscreen, hideFullscreenOnMobile: true, renderCloseButton: function (button) { return React.createElement(dialog_1.DialogClose, { asChild: true }, button); } }))),
                    React.createElement("form", { action: handleSubmit, className: "flex min-h-0 flex-1 flex-col" },
                        React.createElement("div", { className: utils_1.cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6', isFullscreen && 'pr-1'), style: { paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined } },
                            showGoalCreatedBanner && (React.createElement("div", { className: "rounded-md border bg-muted/30 px-3 py-2 text-sm", role: "status" }, dict.today.goalCreatedAutoselected)),
                            goalId ? (React.createElement("input", { type: "hidden", name: "goal_id", value: goalId })) : (React.createElement("div", { className: "grid gap-2" },
                                React.createElement(label_1.Label, { htmlFor: "goal_id", required: true }, dict.today.goalLabel),
                                React.createElement(select_1.Select, { name: "goal_id", value: selectedGoalId, onValueChange: setSelectedGoalId, required: true },
                                    React.createElement(select_1.SelectTrigger, { className: "w-full" },
                                        React.createElement(select_1.SelectValue, { placeholder: dict.today.selectGoal })),
                                    React.createElement(select_1.SelectContent, null, goals === null || goals === void 0 ? void 0 : goals.map(function (goal) { return (React.createElement(select_1.SelectItem, { key: goal.id, value: goal.id }, goal.title)); }))),
                                (!goals || goals.length === 0) && (React.createElement(button_1.Button, { type: "button", variant: "link", className: "px-0 text-primary underline", onClick: function () { return setStep('goal'); } }, dict.goals.newGoal)))),
                            React.createElement("div", { className: "grid gap-2" },
                                React.createElement(label_1.Label, { htmlFor: "title", required: true }, dict.today.actionTitleLabel),
                                React.createElement(input_1.Input, { ref: titleRef, id: "title", name: "title", placeholder: dict.today.actionTitlePlaceholder, required: true, value: actionTitle, onChange: function (e) { return setActionTitle(e.target.value); } }),
                                React.createElement("div", { className: "flex justify-end" },
                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: handleAISplitAction, disabled: aiLoading || !actionTitle.trim() || (!goalId && !selectedGoalId) }, aiLoading ? dict.common.loading : dict.goals["new"].aiSplitButton)),
                                aiError ? (React.createElement("div", { className: "text-sm text-destructive" }, aiError)) : null),
                            React.createElement("div", { className: "grid gap-2" }, uploadUserId ? (React.createElement(ActionDescriptionEditor_1.ActionDescriptionEditor, { userId: uploadUserId, value: actionDescription, onChange: setActionDescription, attachments: attachmentsDraft, onAttachmentsChange: setAttachmentsDraft, onUploadingChange: setDescriptionUploading, dict: dict })) : (React.createElement("div", { className: "text-xs text-muted-foreground" }, dict.common.loading))),
                            React.createElement("div", { className: "grid gap-2" },
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement(label_1.Label, null, goalNewText.subItemsLabel || '子行动'),
                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: function () { return setSubItemsDraft(function (prev) { return __spreadArrays(prev, [{ id: makeDraftId(), title: '' }]); }); } }, goalNewText.subItemsAdd || '新增子行动')),
                                subItemsDraft.length === 0 ? (React.createElement("div", { className: "text-xs text-muted-foreground" }, goalNewText.subItemsEmptyHint || '可手动添加，或使用 AI 拆解后导入为子行动')) : (React.createElement("div", { className: "space-y-2" }, subItemsDraft.map(function (item, idx) { return (React.createElement("div", { key: item.id, className: "flex items-center gap-2" },
                                    React.createElement(input_1.Input, { value: item.title, placeholder: (goalNewText.subItemsPlaceholder || '子行动') + " " + (idx + 1), onChange: function (e) {
                                            var nextTitle = e.target.value;
                                            setSubItemsDraft(function (prev) { return prev.map(function (x) { return x.id === item.id ? __assign(__assign({}, x), { title: nextTitle }) : x; }); });
                                        } }),
                                    React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", onClick: function () { return setSubItemsDraft(function (prev) { return prev.filter(function (x) { return x.id !== item.id; }); }); } }, (dict.common["delete"] || '删除')))); })))),
                            React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                                React.createElement("div", { className: "grid gap-2" },
                                    React.createElement(label_1.Label, { htmlFor: "type" }, dict.today.typeLabel),
                                    React.createElement(select_1.Select, { name: "type", value: actionType, onValueChange: setActionType },
                                        React.createElement(select_1.SelectTrigger, { className: "w-full" },
                                            React.createElement(select_1.SelectValue, { placeholder: dict.today.typeLabel })),
                                        React.createElement(select_1.SelectContent, null,
                                            React.createElement(select_1.SelectItem, { value: "core" }, dict.today.types.core),
                                            React.createElement(select_1.SelectItem, { value: "maintenance" }, dict.today.types.maintenance),
                                            React.createElement(select_1.SelectItem, { value: "learning" }, dict.today.types.learning),
                                            React.createElement(select_1.SelectItem, { value: "review" }, dict.today.types.review),
                                            React.createElement(select_1.SelectItem, { value: "rest" }, dict.today.types.rest)))),
                                React.createElement("div", { className: "grid gap-2" },
                                    React.createElement(label_1.Label, { htmlFor: "priority" }, dict.today.priorityLabel),
                                    React.createElement(select_1.Select, { name: "priority", value: actionPriority, onValueChange: setActionPriority },
                                        React.createElement(select_1.SelectTrigger, { className: "w-full" },
                                            React.createElement(select_1.SelectValue, { placeholder: dict.goals.priority.label })),
                                        React.createElement(select_1.SelectContent, null,
                                            React.createElement(select_1.SelectItem, { value: "high" }, dict.goals.priority.high),
                                            React.createElement(select_1.SelectItem, { value: "medium" }, dict.goals.priority.medium),
                                            React.createElement(select_1.SelectItem, { value: "low" }, dict.goals.priority.low))))),
                            React.createElement("div", { className: "grid gap-2" },
                                React.createElement(label_1.Label, { htmlFor: "repeat_rule" }, todayText.repeatLabel || '重复规则'),
                                React.createElement("input", { type: "hidden", name: "repeat_rule", value: actionRepeatRule }),
                                React.createElement(select_1.Select, { value: actionRepeatRule, onValueChange: function (value) { return setActionRepeatRule(value); } },
                                    React.createElement(select_1.SelectTrigger, { id: "repeat_rule", className: "w-full" },
                                        React.createElement(select_1.SelectValue, { placeholder: todayText.repeatLabel || '重复规则' })),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "none" }, todayText.repeatNone || '不重复'),
                                        React.createElement(select_1.SelectItem, { value: "daily" }, todayText.repeatDaily || '每天'),
                                        React.createElement(select_1.SelectItem, { value: "weekly" }, todayText.repeatWeekly || '每周'),
                                        React.createElement(select_1.SelectItem, { value: "monthly" }, todayText.repeatMonthly || '每月')))),
                            React.createElement(DateRangeFields_1.DateRangeFields, { key: actionStartDate + "-" + actionEndDate, defaultStart: actionStartDate || today, defaultEnd: actionEndDate || today, labels: {
                                    start: dict.today.startTime,
                                    end: dict.today.endTime,
                                    error: dict.common.dateRangeInvalid
                                }, onValidityChange: setValid }),
                            aiDrafts.length > 0 ? (React.createElement("div", { className: "space-y-2 rounded-md border border-border/60 bg-muted/20 p-3" },
                                React.createElement("div", { className: "flex items-center justify-between gap-2" },
                                    React.createElement("div", { className: "text-sm font-medium" }, dict.goals["new"].aiSuggestionsTitle),
                                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: importAllAIDraftsAsSubItems }, goalNewText.aiImportSubItems || '全部导入为子行动')),
                                React.createElement("div", { className: "space-y-2" }, aiDrafts.map(function (draft, idx) { return (React.createElement("button", { key: draft.title + "-" + idx, type: "button", onClick: function () { return applyAIDraft(draft); }, className: "w-full rounded-md border border-border/60 bg-background/70 p-2 text-left hover:bg-muted/40 transition-colors" },
                                    React.createElement("div", { className: "text-sm font-medium" }, draft.title),
                                    draft.description ? (React.createElement("div", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground" }, draft.description)) : null,
                                    React.createElement("div", { className: "mt-1 text-[11px] text-primary" }, goalNewText.aiImportOneSubItem || '点击导入为子行动'))); })))) : null,
                            error ? React.createElement("div", { className: "text-sm text-destructive" }, error) : null,
                            descriptionUploading ? (React.createElement("div", { className: "text-xs text-muted-foreground" }, goalNewText.wait_upload_complete || '图片上传中，请稍后提交。')) : null),
                        React.createElement(ModalActionFooter_1.ModalActionFooter, { insetBottom: open && keyboardInset > 0 ? "calc(env(safe-area-inset-bottom) + " + keyboardInset + "px)" : undefined },
                            React.createElement("div", { className: "flex items-center justify-end gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return setOpen(false); }, disabled: isPending }, dict.common.cancel),
                                React.createElement(button_1.Button, { type: "submit", disabled: isPending || !valid || (!goalId && !selectedGoalId) || descriptionUploading }, isPending ? (React.createElement(React.Fragment, null,
                                    React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-current" }),
                                    dict.common.saving)) : (React.createElement(React.Fragment, null,
                                    React.createElement(lucide_react_1.Plus, { className: "mr-2 h-4 w-4" }),
                                    dict.goals.detail.addAction)))))))))))))));
}
exports.AddActionDialog = AddActionDialog;
