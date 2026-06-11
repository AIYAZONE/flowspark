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
exports.__esModule = true;
exports.NewGoalForm = void 0;
var link_1 = require("next/link");
var react_1 = require("react");
var actions_1 = require("@/app/(authenticated)/goals/actions");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var textarea_1 = require("@/components/ui/textarea");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var select_1 = require("@/components/ui/select");
var DateRangeFields_1 = require("@/components/DateRangeFields");
var GoalCategorySelect_1 = require("@/components/GoalCategorySelect");
var SubmitButton_1 = require("@/components/SubmitButton");
var goalCategories_1 = require("@/lib/goalCategories");
var analytics_1 = require("@/lib/analytics");
var aiFeedback_1 = require("@/lib/aiFeedback");
var actionScheduling_1 = require("@/lib/actionScheduling");
var ModalActionFooter_1 = require("@/components/ModalActionFooter");
var utils_1 = require("@/lib/utils");
function makeId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        return crypto.randomUUID();
    return Date.now() + "-" + Math.random().toString(16).slice(2);
}
function NewGoalForm(_a) {
    var dict = _a.dict, onSuccess = _a.onSuccess, action = _a.action, _b = _a.fixedFooter, fixedFooter = _b === void 0 ? false : _b;
    var submitAction = action || actions_1.createGoal;
    var formRef = react_1.useRef(null);
    var newDict = dict.goals["new"];
    var commonErrors = dict.common.errors;
    var _c = react_1.useState('manual'), createMode = _c[0], setCreateMode = _c[1];
    var _d = react_1.useState(function () { return new Date().toISOString().slice(0, 10); }), goalStart = _d[0], setGoalStart = _d[1];
    var _e = react_1.useState(function () { return new Date().toISOString().slice(0, 10); }), goalEnd = _e[0], setGoalEnd = _e[1];
    var _f = react_1.useState('other'), category = _f[0], setCategory = _f[1];
    var _g = react_1.useState('medium'), priority = _g[0], setPriority = _g[1];
    var _h = react_1.useState(true), dateValid = _h[0], setDateValid = _h[1];
    var _j = react_1.useState(''), goalTitle = _j[0], setGoalTitle = _j[1];
    var _k = react_1.useState(false), aiLoading = _k[0], setAiLoading = _k[1];
    var _l = react_1.useState(null), aiError = _l[0], setAiError = _l[1];
    var _m = react_1.useState(null), submitError = _m[0], setSubmitError = _m[1];
    var _o = react_1.useState(null), aiStepA = _o[0], setAiStepA = _o[1];
    var _p = react_1.useState({}), aiAnswers = _p[0], setAiAnswers = _p[1];
    var _q = react_1.useState(null), aiStepB = _q[0], setAiStepB = _q[1];
    var _r = react_1.useState([]), draftActions = _r[0], setDraftActions = _r[1];
    var _s = react_1.useState(false), creatingActions = _s[0], setCreatingActions = _s[1];
    var hasEnabledDrafts = draftActions.some(function (a) { return a.enabled; });
    var _t = react_1.useState(''), successCriteriaText = _t[0], setSuccessCriteriaText = _t[1];
    var _u = react_1.useState(''), stopCriteriaText = _u[0], setStopCriteriaText = _u[1];
    function handleSubmit(formData) {
        return __awaiter(this, void 0, void 0, function () {
            var goalStartDate, goalEndDate, result, error_1, code, code, typed, goalId, enabledCount, _i, draftActions_1, a, start_date, end_date, actionData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSubmitError(null);
                        // 临时调试：确认提交值（稍后移除）
                        // console.log('NewGoalForm submit:', Object.fromEntries((formData as unknown as Iterable<[string, FormDataEntryValue]>)))
                        formData.set('category', goalCategories_1.normalizeCategoryInput(category));
                        formData.set('priority', priority);
                        goalStartDate = (formData.get('start_date') || '').trim();
                        goalEndDate = (formData.get('end_date') || '').trim();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, submitAction(formData)];
                    case 2:
                        result = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 &&
                            typeof error_1 === 'object' &&
                            'digest' in error_1 &&
                            typeof error_1.digest === 'string' &&
                            error_1.digest.startsWith('NEXT_REDIRECT')) {
                            throw error_1;
                        }
                        code = error_1 instanceof Error ? error_1.message : 'operation_failed';
                        setSubmitError(commonErrors[code] || commonErrors.operation_failed);
                        return [2 /*return*/];
                    case 4:
                        if (result && typeof result === 'object' && 'error' in result) {
                            code = typeof result.error === 'string'
                                ? result.error
                                : 'operation_failed';
                            setSubmitError(commonErrors[code] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        typed = result;
                        goalId = typed === null || typed === void 0 ? void 0 : typed.goalId;
                        if (!(goalId && draftActions.some(function (a) { return a.enabled; }))) return [3 /*break*/, 11];
                        setCreatingActions(true);
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, , 10, 11]);
                        enabledCount = draftActions.filter(function (a) { return a.enabled; }).length;
                        _i = 0, draftActions_1 = draftActions;
                        _a.label = 6;
                    case 6:
                        if (!(_i < draftActions_1.length)) return [3 /*break*/, 9];
                        a = draftActions_1[_i];
                        if (!a.enabled)
                            return [3 /*break*/, 8];
                        start_date = (a.start_date || goalStartDate).trim();
                        end_date = (a.end_date || start_date || goalEndDate).trim();
                        if (end_date && start_date && end_date < start_date)
                            end_date = start_date;
                        if (goalStartDate && start_date && start_date < goalStartDate)
                            start_date = goalStartDate;
                        if (goalEndDate && end_date && end_date > goalEndDate)
                            end_date = goalEndDate;
                        if (goalEndDate && start_date && start_date > goalEndDate)
                            start_date = goalEndDate;
                        if (goalStartDate && end_date && end_date < goalStartDate)
                            end_date = goalStartDate;
                        if (end_date && start_date && end_date < start_date)
                            end_date = start_date;
                        actionData = new FormData();
                        actionData.set('goal_id', goalId);
                        actionData.set('title', a.title);
                        actionData.set('type', a.type);
                        actionData.set('priority', a.priority);
                        actionData.set('description', a.description);
                        actionData.set('start_date', start_date);
                        actionData.set('end_date', end_date);
                        return [4 /*yield*/, actions_1.createAction(actionData)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9:
                        analytics_1.logEvent('ai_goal_setup_apply', { applied_actions: enabledCount, used_ai: !!aiStepB });
                        aiFeedback_1.sendAIFeedback('ai_goal_setup_apply', { applied_actions: enabledCount, used_ai: !!aiStepB });
                        return [3 /*break*/, 11];
                    case 10:
                        setCreatingActions(false);
                        return [7 /*endfinally*/];
                    case 11:
                        if (onSuccess) {
                            onSuccess(typed && typed.success ? { id: typed.goalId, title: typed.title } : undefined);
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    function buildGoalBrief(formData) {
        var title = (formData.get('title') || '').trim();
        var descriptionRaw = (formData.get('description') || '').trim();
        var start_date = (formData.get('start_date') || '').trim() || null;
        var end_date = (formData.get('end_date') || '').trim() || null;
        var success_criteria = (formData.get('success_criteria') || '').trim() || null;
        var stop_criteria = (formData.get('stop_criteria') || '').trim() || null;
        return {
            title: title,
            description: descriptionRaw || null,
            start_date: start_date,
            end_date: end_date,
            priority: priority || 'medium',
            category: goalCategories_1.normalizeCategoryInput(category),
            success_criteria: success_criteria,
            stop_criteria: stop_criteria,
            user_context: { time_budget_bucket: 'unknown', constraints: [], likely_frictions: [], preference: null }
        };
    }
    function mapStepBToDraftActions(stepB) {
        var _a, _b;
        var ifThenLines = stepB.if_then_plans
            .map(function (p) { return "If-Then: \u5982\u679C" + p["if"] + " \u90A3\u4E48" + p.then; })
            .join('\n');
        var ranges = actionScheduling_1.scheduleRangesWithinGoal({
            start: stepB.goal_draft.start_date,
            end: stepB.goal_draft.end_date,
            count: stepB.actions.length
        });
        var drafts = [];
        for (var _i = 0, _c = stepB.actions.entries(); _i < _c.length; _i++) {
            var _d = _c[_i], idx = _d[0], a = _d[1];
            var numberedTitle = /^\d+\./.test(a.title.trim()) ? a.title.trim() : idx + 1 + ". " + a.title;
            var descriptionParts = ["Why: " + a.why, "DoD: " + a.definition_of_done];
            if (ifThenLines)
                descriptionParts.push(ifThenLines);
            var r = ranges[idx];
            drafts.push({
                id: makeId(),
                enabled: true,
                title: numberedTitle,
                description: descriptionParts.join('\n'),
                type: a.action_type,
                priority: (a.priority || 'medium'),
                start_date: (_a = r === null || r === void 0 ? void 0 : r.start) !== null && _a !== void 0 ? _a : stepB.goal_draft.start_date,
                end_date: (_b = r === null || r === void 0 ? void 0 : r.end) !== null && _b !== void 0 ? _b : stepB.goal_draft.end_date,
                estimated_minutes: a.estimated_minutes
            });
        }
        return drafts;
    }
    function formatCriteriaMarkdown(stepB) {
        var successLines = stepB.success_criteria.map(function (c) { return "- " + (c.type === 'outcome' ? '结果型' : '过程型') + "\uFF1A" + c.text; });
        var stopLines = stepB.stop_criteria.map(function (c) { return "- " + (c.type === 'resource' ? '资源' : '方向') + "\uFF1A" + c.text; });
        return { success: successLines.join('\n'), stop: stopLines.join('\n') };
    }
    function handleAISplit() {
        return __awaiter(this, void 0, void 0, function () {
            var formData, startDate, endDate, locale, brief, res, json, key, result, initialAnswers, _i, _a, q, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setAiError(null);
                        if (!formRef.current)
                            return [2 /*return*/];
                        formData = new FormData(formRef.current);
                        startDate = (formData.get('start_date') || '').trim();
                        endDate = (formData.get('end_date') || '').trim();
                        locale = (dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
                        brief = buildGoalBrief(formData);
                        if (!brief.title) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        if (createMode === 'ai' && !brief.description) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        if (createMode === 'manual' && (!startDate || !endDate)) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        setAiLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, 5, 6]);
                        analytics_1.logEvent('ai_goal_setup_click', {
                            source: 'new_goal',
                            has_desc: !!brief.description,
                            desc_len: brief.description ? brief.description.length : 0
                        });
                        aiFeedback_1.sendAIFeedback('ai_goal_setup_click', {
                            source: 'new_goal',
                            has_desc: !!brief.description,
                            desc_len: brief.description ? brief.description.length : 0
                        });
                        setAiStepA(null);
                        setAiStepB(null);
                        setDraftActions([]);
                        setAiAnswers({});
                        return [4 /*yield*/, fetch('/api/ai/goal-setup/step-a', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ brief: brief, locale: locale, today: new Date().toISOString().slice(0, 10) })
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
                        result = json.result;
                        if (!result) {
                            setAiError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setAiStepA(result);
                        if (result.need_more_info.blocking) {
                            analytics_1.logEvent('ai_goal_setup_stepA_need_more', { missing: result.need_more_info.missing });
                            aiFeedback_1.sendAIFeedback('ai_goal_setup_stepA_need_more', { missing_count: result.need_more_info.missing.length });
                        }
                        else {
                            analytics_1.logEvent('ai_goal_setup_stepA_success', { questions: result.clarifying_questions.length });
                            aiFeedback_1.sendAIFeedback('ai_goal_setup_stepA_success', { questions: result.clarifying_questions.length });
                        }
                        if (!result.need_more_info.blocking) {
                            initialAnswers = {};
                            for (_i = 0, _a = result.clarifying_questions; _i < _a.length; _i++) {
                                q = _a[_i];
                                initialAnswers[q.id] = '';
                            }
                            setAiAnswers(initialAnswers);
                        }
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
    function handleAIGenerateDrafts() {
        return __awaiter(this, void 0, void 0, function () {
            var formData, startDate, endDate, locale, brief, res, json, key, result, drafts, criteria, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setAiError(null);
                        if (!formRef.current)
                            return [2 /*return*/];
                        if (!aiStepA || aiStepA.need_more_info.blocking)
                            return [2 /*return*/];
                        formData = new FormData(formRef.current);
                        startDate = (formData.get('start_date') || '').trim();
                        endDate = (formData.get('end_date') || '').trim();
                        locale = (dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
                        brief = buildGoalBrief(formData);
                        if (!brief.title) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        if (createMode === 'ai' && !brief.description) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        if (createMode === 'manual' && (!startDate || !endDate)) {
                            setAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        setAiLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/ai/goal-setup/step-b', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ brief: brief, answers: aiAnswers, locale: locale, today: new Date().toISOString().slice(0, 10) })
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_b.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            setAiError(commonErrors[key] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        result = json.result;
                        if (!result) {
                            setAiError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setAiStepB(result);
                        setCategory(result.goal_draft.category);
                        setPriority(result.goal_draft.priority);
                        setGoalStart(result.goal_draft.start_date);
                        setGoalEnd(result.goal_draft.end_date);
                        setDateValid(true);
                        analytics_1.logEvent('ai_goal_setup_stepB_success', { actions: result.actions.length, has_if_then: result.if_then_plans.length > 0 });
                        aiFeedback_1.sendAIFeedback('ai_goal_setup_stepB_success', { actions: result.actions.length, has_if_then: result.if_then_plans.length > 0 });
                        drafts = mapStepBToDraftActions(result);
                        setDraftActions(drafts);
                        criteria = formatCriteriaMarkdown(result);
                        setSuccessCriteriaText(criteria.success);
                        setStopCriteriaText(criteria.stop);
                        return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
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
    var actionButtons = (React.createElement("div", { className: "flex justify-end gap-4" },
        onSuccess ? (React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return onSuccess(); } }, dict.common.cancel)) : (React.createElement(link_1["default"], { href: "/goals" },
            React.createElement(button_1.Button, { type: "button", variant: "outline" }, dict.common.cancel))),
        React.createElement(SubmitButton_1.SubmitButton, { disabled: !dateValid || creatingActions || (createMode === 'ai' && !aiStepB) }, hasEnabledDrafts ? (dict.goals["new"].submitWithActions || dict.goals["new"].submit) : dict.goals["new"].submit)));
    return (React.createElement("form", { ref: formRef, action: handleSubmit, className: utils_1.cn(fixedFooter ? 'flex min-h-0 flex-1 flex-col' : 'space-y-6') },
        React.createElement("div", { className: utils_1.cn(fixedFooter ? 'min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 md:px-6' : 'space-y-6') },
            React.createElement("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2" },
                React.createElement("button", { type: "button", className: "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors " + (createMode === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'), onClick: function () { return setCreateMode('manual'); } }, newDict.manualCreate || '手动创建'),
                React.createElement("button", { type: "button", className: "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors " + (createMode === 'ai' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'), onClick: function () { return setCreateMode('ai'); } }, newDict.aiSplitCreate || 'AI 拆解创建')),
            submitError && (React.createElement("div", { className: "text-sm text-destructive", role: "alert" }, submitError)),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement(label_1.Label, { htmlFor: "title", required: true }, dict.goals["new"].titleLabel),
                React.createElement(input_1.Input, { id: "title", name: "title", placeholder: dict.goals["new"].titlePlaceholder, required: true, onChange: function (e) { return setGoalTitle(e.target.value); } })),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement(label_1.Label, { htmlFor: "description" }, dict.goals["new"].descriptionLabel),
                React.createElement(textarea_1.Textarea, { id: "description", name: "description", placeholder: dict.goals["new"].descriptionPlaceholder }),
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: handleAISplit, disabled: aiLoading || creatingActions || !goalTitle.trim() || (createMode === 'manual' && !dateValid) },
                        aiLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-current" }),
                        dict.goals["new"].aiSplitButton || 'AI 帮我拆解'),
                    React.createElement("div", { className: "text-xs text-muted-foreground" }, dict.goals["new"].aiSplitHint || '仅生成草案，不会创建目标；点击“创建目标”才会保存'),
                    creatingActions && (React.createElement("div", { className: "text-sm text-muted-foreground flex items-center" },
                        React.createElement(loading_spinner_1.LoadingSpinner, { size: 14, className: "mr-2 text-current" }),
                        dict.goals["new"].aiCreatingActions || '正在创建行动...'))),
                aiError && React.createElement("div", { className: "text-sm text-destructive" }, aiError)),
            aiStepA && (React.createElement("div", { className: "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("div", { className: "text-sm font-medium" }, newDict.aiUnderstandingTitle || 'AI 理解摘要（草案）'),
                    React.createElement("div", { className: "text-sm text-muted-foreground space-y-1" },
                        React.createElement("div", null, aiStepA.understanding.goal_summary),
                        aiStepA.understanding.key_constraints.length > 0 && (React.createElement("div", { className: "text-xs" },
                            React.createElement("div", { className: "font-medium text-foreground/80" }, newDict.aiConstraintsLabel || '关键约束'),
                            React.createElement("ul", { className: "list-disc pl-5" }, aiStepA.understanding.key_constraints.map(function (c, i) { return (React.createElement("li", { key: c + "-" + i }, c)); })))),
                        aiStepA.understanding.likely_failure_reasons.length > 0 && (React.createElement("div", { className: "text-xs" },
                            React.createElement("div", { className: "font-medium text-foreground/80" }, newDict.aiFrictionsLabel || '可能阻力'),
                            React.createElement("ul", { className: "list-disc pl-5" }, aiStepA.understanding.likely_failure_reasons.map(function (c, i) { return (React.createElement("li", { key: c + "-" + i }, c)); })))),
                        React.createElement("div", { className: "text-xs" },
                            React.createElement("div", { className: "font-medium text-foreground/80" }, newDict.aiLeverageLabel || '建议杠杆点'),
                            React.createElement("div", null, aiStepA.understanding.leverage_point)))),
                aiStepA.need_more_info.blocking ? (React.createElement("div", { className: "space-y-2" },
                    React.createElement("div", { className: "text-sm font-medium text-destructive" }, newDict.aiNeedMoreTitle || '还需要补充'),
                    React.createElement("div", { className: "text-sm text-muted-foreground" }, aiStepA.need_more_info.message),
                    aiStepA.need_more_info.missing.length > 0 && (React.createElement("ul", { className: "list-disc pl-5 text-sm text-muted-foreground" }, aiStepA.need_more_info.missing.map(function (m, i) { return (React.createElement("li", { key: m + "-" + i }, m)); }))))) : (React.createElement("div", { className: "space-y-3" },
                    React.createElement("div", { className: "text-sm font-medium" }, newDict.aiQuestionsTitle || '快速澄清（2-3 题）'),
                    React.createElement("div", { className: "space-y-3" }, aiStepA.clarifying_questions.map(function (q) { return (React.createElement("div", { key: q.id, className: "space-y-2" },
                        React.createElement("div", { className: "text-sm" }, q.question),
                        q.type === 'single_choice' ? (React.createElement(select_1.Select, { value: aiAnswers[q.id] || undefined, onValueChange: function (value) {
                                setAiAnswers(function (prev) {
                                    var _a;
                                    return (__assign(__assign({}, prev), (_a = {}, _a[q.id] = value, _a)));
                                });
                            } },
                            React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                                React.createElement(select_1.SelectValue, { placeholder: newDict.aiSelectPlaceholder || '请选择' })),
                            React.createElement(select_1.SelectContent, null, (q.options || []).map(function (opt) { return (React.createElement(select_1.SelectItem, { key: opt, value: opt }, opt)); })))) : (React.createElement(input_1.Input, { value: aiAnswers[q.id] || '', onChange: function (e) {
                                var value = e.target.value;
                                setAiAnswers(function (prev) {
                                    var _a;
                                    return (__assign(__assign({}, prev), (_a = {}, _a[q.id] = value, _a)));
                                });
                            }, placeholder: newDict.aiShortAnswerPlaceholder || '一句话回答即可' })))); })),
                    React.createElement(button_1.Button, { type: "button", onClick: handleAIGenerateDrafts, disabled: aiLoading || creatingActions },
                        aiLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
                        newDict.aiGenerateDraftsButton || '生成草案'))))),
            createMode === 'manual' || aiStepB ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                    React.createElement("div", { className: "grid gap-2" },
                        React.createElement(label_1.Label, { htmlFor: "category" }, dict.goals.category.label),
                        React.createElement(GoalCategorySelect_1.GoalCategorySelect, { dict: dict, value: category, onChange: setCategory })),
                    React.createElement("div", { className: "grid gap-2" },
                        React.createElement(label_1.Label, { htmlFor: "priority" }, dict.goals.priority.label),
                        React.createElement(select_1.Select, { name: "priority", value: priority, onValueChange: setPriority },
                            React.createElement(select_1.SelectTrigger, null,
                                React.createElement(select_1.SelectValue, { placeholder: dict.goals.priority.label })),
                            React.createElement(select_1.SelectContent, null,
                                React.createElement(select_1.SelectItem, { value: "high" }, dict.goals.priority.high),
                                React.createElement(select_1.SelectItem, { value: "medium" }, dict.goals.priority.medium),
                                React.createElement(select_1.SelectItem, { value: "low" }, dict.goals.priority.low))))),
                React.createElement(DateRangeFields_1.DateRangeFields, { defaultStart: goalStart, defaultEnd: goalEnd, valueStart: goalStart, valueEnd: goalEnd, onChange: function (_a) {
                        var start = _a.start, end = _a.end;
                        setGoalStart(start);
                        setGoalEnd(end);
                    }, labels: { start: dict.goals["new"].startDate, end: dict.goals["new"].endDate, error: dict.common.dateRangeInvalid }, onValidityChange: setDateValid }))) : null,
            draftActions.length > 0 && (React.createElement("div", { className: "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4" },
                React.createElement("div", { className: "font-medium" }, dict.goals["new"].aiSuggestionsTitle || 'AI 建议行动（可编辑）'),
                React.createElement("div", { className: "space-y-3" }, draftActions.map(function (a) {
                    var _a;
                    return (React.createElement("div", { key: a.id, className: "flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3" },
                        React.createElement("input", { type: "checkbox", className: "mt-1 h-4 w-4", checked: a.enabled, onChange: function (e) {
                                var enabled = e.target.checked;
                                setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { enabled: enabled }) : x; }); });
                            } }),
                        React.createElement("div", { className: "flex-1 space-y-2" },
                            React.createElement(input_1.Input, { value: a.title, onChange: function (e) {
                                    var title = e.target.value;
                                    setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { title: title }) : x; }); });
                                } }),
                            React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                                React.createElement(select_1.Select, { value: a.type, onValueChange: function (value) {
                                        var type = value;
                                        setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { type: type }) : x; }); });
                                    } },
                                    React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                                        React.createElement(select_1.SelectValue, { placeholder: dict.today.typeLabel })),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "core" }, dict.today.types.core),
                                        React.createElement(select_1.SelectItem, { value: "maintenance" }, dict.today.types.maintenance),
                                        React.createElement(select_1.SelectItem, { value: "learning" }, dict.today.types.learning),
                                        React.createElement(select_1.SelectItem, { value: "review" }, dict.today.types.review),
                                        React.createElement(select_1.SelectItem, { value: "rest" }, dict.today.types.rest))),
                                React.createElement(select_1.Select, { value: a.priority, onValueChange: function (value) {
                                        var priority = value;
                                        setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { priority: priority }) : x; }); });
                                    } },
                                    React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                                        React.createElement(select_1.SelectValue, { placeholder: dict.goals.priority.label })),
                                    React.createElement(select_1.SelectContent, null,
                                        React.createElement(select_1.SelectItem, { value: "high" }, dict.goals.priority.high),
                                        React.createElement(select_1.SelectItem, { value: "medium" }, dict.goals.priority.medium),
                                        React.createElement(select_1.SelectItem, { value: "low" }, dict.goals.priority.low)))),
                            React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                                React.createElement(input_1.Input, { type: "date", value: a.start_date, onChange: function (e) {
                                        var start_date = e.target.value;
                                        setDraftActions(function (prev) { return prev.map(function (x) {
                                            if (x.id !== a.id)
                                                return x;
                                            var nextEnd = x.end_date && x.end_date < start_date ? start_date : x.end_date;
                                            return __assign(__assign({}, x), { start_date: start_date, end_date: nextEnd });
                                        }); });
                                    } }),
                                React.createElement(input_1.Input, { type: "date", value: a.end_date, min: a.start_date, onChange: function (e) {
                                        var end_date = e.target.value;
                                        setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { end_date: end_date }) : x; }); });
                                    } })),
                            React.createElement(textarea_1.Textarea, { value: a.description, onChange: function (e) {
                                    var description = e.target.value;
                                    setDraftActions(function (prev) { return prev.map(function (x) { return x.id === a.id ? __assign(__assign({}, x), { description: description }) : x; }); });
                                }, className: "min-h-[70px] text-sm bg-background/50", placeholder: dict.common.noDescription }),
                            typeof a.estimated_minutes === 'number' && (React.createElement("div", { className: "text-xs text-muted-foreground" }, ((_a = dict.goals["new"].aiEstimatedMinutes) === null || _a === void 0 ? void 0 : _a.replace('{minutes}', a.estimated_minutes.toString())) || "\u7EA6 " + a.estimated_minutes + " \u5206\u949F")))));
                })))),
            createMode === 'manual' || aiStepB ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "grid gap-2" },
                    React.createElement(label_1.Label, { htmlFor: "success_criteria", required: true }, dict.goals["new"].successCriteriaLabel),
                    React.createElement(textarea_1.Textarea, { id: "success_criteria", name: "success_criteria", placeholder: dict.goals["new"].successCriteriaPlaceholder, required: true, value: successCriteriaText, onChange: function (e) { return setSuccessCriteriaText(e.target.value); } })),
                React.createElement("div", { className: "grid gap-2" },
                    React.createElement(label_1.Label, { htmlFor: "stop_criteria", required: true }, dict.goals["new"].abandonCriteriaLabel),
                    React.createElement(textarea_1.Textarea, { id: "stop_criteria", name: "stop_criteria", placeholder: dict.goals["new"].abandonCriteriaPlaceholder, required: true, value: stopCriteriaText, onChange: function (e) { return setStopCriteriaText(e.target.value); } })))) : null),
        fixedFooter ? React.createElement(ModalActionFooter_1.ModalActionFooter, null, actionButtons) : actionButtons));
}
exports.NewGoalForm = NewGoalForm;
