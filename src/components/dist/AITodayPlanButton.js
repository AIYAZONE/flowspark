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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.AITodayPlanButton = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var actions_1 = require("@/app/(authenticated)/goals/actions");
var dialog_1 = require("@/components/ui/dialog");
var button_1 = require("@/components/ui/button");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var analytics_1 = require("@/lib/analytics");
var aiFeedback_1 = require("@/lib/aiFeedback");
function buildPlanDescription(params) {
    var locale = params.locale, sourceActionTitle = params.sourceActionTitle, firstStep = params.firstStep, definitionOfDone = params.definitionOfDone, reason = params.reason;
    var isZh = locale === 'zh';
    return [
        sourceActionTitle
            ? (isZh ? "\u57FA\u4E8E\u4EFB\u52A1\uFF1A" + sourceActionTitle : "Based on: " + sourceActionTitle)
            : null,
        isZh ? "\u7B2C\u4E00\u6B65\uFF1A" + firstStep : "First step: " + firstStep,
        isZh ? "\u5B8C\u6210\u6807\u51C6\uFF1A" + definitionOfDone : "DoD: " + definitionOfDone,
        isZh ? "\u5EFA\u8BAE\u539F\u56E0\uFF1A" + reason : "Reason: " + reason,
    ]
        .filter(Boolean)
        .join('\n');
}
function AITodayPlanButton(_a) {
    var _b, _c, _d, _e;
    var dict = _a.dict, goals = _a.goals, _f = _a.actions, actions = _f === void 0 ? [] : _f, defaultDate = _a.defaultDate, _g = _a.ab1TodayPlanVariant, ab1TodayPlanVariant = _g === void 0 ? null : _g, _h = _a.source, source = _h === void 0 ? 'today' : _h, triggerLabel = _a.triggerLabel, _j = _a.triggerVariant, triggerVariant = _j === void 0 ? 'outline' : _j, triggerClassName = _a.triggerClassName, _k = _a.triggerSize, triggerSize = _k === void 0 ? 'lg' : _k, trigger = _a.trigger;
    var planning = (_c = (_b = dict === null || dict === void 0 ? void 0 : dict.dashboard) === null || _b === void 0 ? void 0 : _b.planning) !== null && _c !== void 0 ? _c : {};
    var commonErrors = (_d = dict === null || dict === void 0 ? void 0 : dict.common) === null || _d === void 0 ? void 0 : _d.errors;
    var _l = react_1.useState(false), aiOpen = _l[0], setAiOpen = _l[1];
    var _m = react_1.useState(false), aiLoading = _m[0], setAiLoading = _m[1];
    var _o = react_1.useState(null), aiError = _o[0], setAiError = _o[1];
    var _p = react_1.useState(null), aiResult = _p[0], setAiResult = _p[1];
    var _q = react_1.useState(null), aiRecommendationId = _q[0], setAiRecommendationId = _q[1];
    var _r = react_1.useState('idle'), aiOutcomeState = _r[0], setAiOutcomeState = _r[1];
    var _s = react_1.useState(null), aiMeta = _s[0], setAiMeta = _s[1];
    var _t = react_1.useState(null), selected = _t[0], setSelected = _t[1];
    var locale = react_1.useMemo(function () {
        var _a;
        var value = String(((_a = dict === null || dict === void 0 ? void 0 : dict.common) === null || _a === void 0 ? void 0 : _a.locale) || '').toLowerCase();
        return value.startsWith('zh') ? 'zh' : 'en';
    }, [dict]);
    var candidateGoals = react_1.useMemo(function () {
        var list = Array.isArray(goals) ? goals : [];
        return list
            .map(function (goal) {
            var obj = goal;
            return {
                id: typeof obj.id === 'string' ? obj.id : '',
                title: typeof obj.title === 'string' ? obj.title : '',
                priority: typeof obj.priority === 'string' ? obj.priority : null,
                start_date: typeof obj.start_date === 'string' ? obj.start_date : null,
                end_date: typeof obj.end_date === 'string' ? obj.end_date : null,
                success_criteria: typeof obj.success_criteria === 'string' ? obj.success_criteria : null,
                stop_criteria: typeof obj.stop_criteria === 'string' ? obj.stop_criteria : null
            };
        })
            .filter(function (goal) { return goal.id && goal.title; });
    }, [goals]);
    var candidateActions = react_1.useMemo(function () {
        var list = Array.isArray(actions) ? actions : [];
        return list
            .map(function (action) { return ({
            id: typeof action.id === 'string' ? action.id : '',
            title: typeof action.title === 'string' ? action.title : '',
            description: typeof action.description === 'string' ? action.description : null,
            goal_id: typeof action.goal_id === 'string' ? action.goal_id : null,
            goal_title: typeof action.goal_title === 'string' ? action.goal_title : null,
            type: typeof action.type === 'string' ? action.type : null,
            priority: typeof action.priority === 'string' ? action.priority : null,
            completed: typeof action.completed === 'boolean' ? action.completed : false,
            start_date: typeof action.start_date === 'string' ? action.start_date : null,
            end_date: typeof action.end_date === 'string' ? action.end_date : null
        }); })
            .filter(function (action) { return action.id && action.title; });
    }, [actions]);
    var actionMap = react_1.useMemo(function () { return new Map(candidateActions.map(function (action) { return [action.id, action]; })); }, [candidateActions]);
    function pickFallbackGoalId() {
        var _a;
        var pMap = { high: 3, medium: 2, low: 1 };
        return (((_a = __spreadArrays(candidateGoals).sort(function (a, b) {
            var _a, _b;
            var pa = (_a = pMap[a.priority || 'medium']) !== null && _a !== void 0 ? _a : 2;
            var pb = (_b = pMap[b.priority || 'medium']) !== null && _b !== void 0 ? _b : 2;
            if (pa !== pb)
                return pb - pa;
            var ea = a.end_date || '9999-12-31';
            var eb = b.end_date || '9999-12-31';
            if (ea !== eb)
                return ea < eb ? -1 : 1;
            return a.title.localeCompare(b.title);
        })[0]) === null || _a === void 0 ? void 0 : _a.id) || null);
    }
    function getVariantLabel(minutes) {
        if (minutes === 5)
            return planning.aiPlanVariant5 || '5 分钟起步';
        if (minutes === 10)
            return planning.aiPlanVariant10 || '10 分钟推进';
        return planning.aiPlanVariant20 || '20 分钟完成一段';
    }
    function getApplyButtonLabel() {
        if (!aiResult || !selected)
            return planning.aiPlanApplyBtn || 'Apply & Create';
        var recommendation = aiResult.recommendations[selected.recIndex];
        if ((recommendation === null || recommendation === void 0 ? void 0 : recommendation.source_type) === 'existing_action' && (recommendation === null || recommendation === void 0 ? void 0 : recommendation.source_action_id)) {
            return planning.aiPlanApplyExistingBtn || (locale === 'zh' ? '采用并推进现有任务' : 'Apply to Existing Task');
        }
        return planning.aiPlanApplyBtn || 'Apply & Create';
    }
    function openAIPlan() {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, key, msg, preferredIndex, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setAiOpen(true);
                        setAiError(null);
                        setAiResult(null);
                        setAiRecommendationId(null);
                        setAiOutcomeState('idle');
                        setAiMeta(null);
                        setSelected(null);
                        if (candidateGoals.length === 0)
                            return [2 /*return*/];
                        analytics_1.logEvent('ai_today_plan_click', { source: source, variant: ab1TodayPlanVariant });
                        aiFeedback_1.sendAIFeedback('ai_today_plan_click', { source: source, variant: ab1TodayPlanVariant });
                        setAiLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/ai/today-plan', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ today: defaultDate, goals: candidateGoals, actions: candidateActions, locale: locale })
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_b.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            msg = commonErrors === null || commonErrors === void 0 ? void 0 : commonErrors[key];
                            setAiError(msg || (commonErrors === null || commonErrors === void 0 ? void 0 : commonErrors.operation_failed) || 'Operation failed');
                            return [2 /*return*/];
                        }
                        if (!json.ok || !json.data || !json.recommendationId) {
                            setAiError((commonErrors === null || commonErrors === void 0 ? void 0 : commonErrors.operation_failed) || 'Operation failed');
                            return [2 /*return*/];
                        }
                        setAiResult(json.data);
                        setAiRecommendationId(json.recommendationId);
                        setAiMeta({
                            strategyVersion: json.strategyVersion,
                            promptVersion: json.promptVersion,
                            model: json.model
                        });
                        preferredIndex = json.data.recommendations.findIndex(function (item) { return item.kind === 'core'; });
                        setSelected({
                            recIndex: preferredIndex >= 0 ? preferredIndex : 0,
                            minutes: 10
                        });
                        analytics_1.logAIEvent('ai_today_plan_suggested', {
                            options: json.data.recommendations.length,
                            variant: ab1TodayPlanVariant
                        }, {
                            recommendation_id: json.recommendationId,
                            scene: json.scene,
                            strategy_version: json.strategyVersion || null,
                            prompt_version: json.promptVersion || null,
                            model: json.model || null
                        });
                        aiFeedback_1.sendAIFeedback('ai_today_plan_suggested', {
                            options: json.data.recommendations.length,
                            variant: ab1TodayPlanVariant,
                            recommendation_id: json.recommendationId,
                            scene: json.scene,
                            strategy_version: json.strategyVersion || null,
                            prompt_version: json.promptVersion || null,
                            model: json.model || null
                        });
                        return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
                        setAiError((commonErrors === null || commonErrors === void 0 ? void 0 : commonErrors.operation_failed) || 'Operation failed');
                        return [3 /*break*/, 6];
                    case 5:
                        setAiLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function dismissRecommendation() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!aiRecommendationId || aiOutcomeState !== 'idle')
                            return [2 /*return*/];
                        setAiOutcomeState('dismissed');
                        analytics_1.logAIEvent('ai_today_plan_dismiss', {
                            source: source,
                            variant: ab1TodayPlanVariant
                        }, {
                            recommendation_id: aiRecommendationId,
                            scene: 'today_plan',
                            strategy_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.strategyVersion) || null,
                            prompt_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.promptVersion) || null,
                            model: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.model) || null
                        });
                        aiFeedback_1.sendAIFeedback('ai_today_plan_dismiss', {
                            source: source,
                            variant: ab1TodayPlanVariant,
                            recommendation_id: aiRecommendationId,
                            scene: 'today_plan',
                            strategy_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.strategyVersion) || null,
                            prompt_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.promptVersion) || null,
                            model: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.model) || null
                        });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/ai/recommendations/" + aiRecommendationId + "/dismiss", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ feedbackLabel: 'dismiss' })
                            })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function applySelected() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var recommendation, variant, sourceAction, goalId, optionSelected, adoptionMode, actionId, formData, applied, formData, created, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!aiResult || !selected || !aiRecommendationId)
                            return [2 /*return*/];
                        recommendation = aiResult.recommendations[selected.recIndex];
                        variant = recommendation === null || recommendation === void 0 ? void 0 : recommendation.variants.find(function (item) { return item.minutes === selected.minutes; });
                        if (!recommendation || !variant)
                            return [2 /*return*/];
                        sourceAction = recommendation.source_action_id ? actionMap.get(recommendation.source_action_id) : null;
                        goalId = recommendation.goal_id || (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.goal_id) || pickFallbackGoalId();
                        if (!goalId)
                            return [2 /*return*/];
                        optionSelected = selected.minutes + "m";
                        adoptionMode = recommendation.source_type === 'existing_action' && (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.id)
                            ? 'existing_action'
                            : 'new_action';
                        setAiLoading(true);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        actionId = null;
                        if (!(adoptionMode === 'existing_action' && (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.id))) return [3 /*break*/, 3];
                        formData = new FormData();
                        formData.set('action_id', sourceAction.id);
                        formData.set('ai_recommendation_id', aiRecommendationId);
                        formData.set('first_step', variant.first_step);
                        formData.set('definition_of_done', variant.definition_of_done);
                        formData.set('reason', recommendation.reason);
                        formData.set('variant_label', getVariantLabel(selected.minutes));
                        formData.set('source_action_title', recommendation.source_action_title || sourceAction.title);
                        formData.set('locale', locale);
                        return [4 /*yield*/, actions_1.applyAITodayPlanToExistingAction(formData)];
                    case 2:
                        applied = _d.sent();
                        actionId = (applied === null || applied === void 0 ? void 0 : applied.actionId) || sourceAction.id;
                        return [3 /*break*/, 5];
                    case 3:
                        formData = new FormData();
                        formData.set('goal_id', goalId);
                        formData.set('title', variant.title);
                        formData.set('type', 'core');
                        formData.set('priority', 'medium');
                        formData.set('description', buildPlanDescription({
                            locale: locale,
                            sourceActionTitle: recommendation.source_action_title,
                            firstStep: variant.first_step,
                            definitionOfDone: variant.definition_of_done,
                            reason: recommendation.reason
                        }));
                        formData.set('start_date', defaultDate);
                        formData.set('end_date', defaultDate);
                        formData.set('ai_recommendation_id', aiRecommendationId);
                        return [4 /*yield*/, actions_1.createActionAndReturnId(formData)];
                    case 4:
                        created = _d.sent();
                        actionId = (created === null || created === void 0 ? void 0 : created.actionId) || null;
                        _d.label = 5;
                    case 5:
                        setAiOutcomeState('adopted');
                        void fetch("/api/ai/recommendations/" + aiRecommendationId + "/adopt", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                optionSelected: optionSelected,
                                actionId: actionId
                            })
                        })["catch"](function () {
                        });
                        analytics_1.logAIEvent('ai_today_plan_apply', {
                            option: optionSelected,
                            goal_id: goalId,
                            variant: ab1TodayPlanVariant,
                            adoption_mode: adoptionMode
                        }, {
                            recommendation_id: aiRecommendationId,
                            scene: 'today_plan',
                            strategy_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.strategyVersion) || null,
                            prompt_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.promptVersion) || null,
                            model: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.model) || null,
                            variant_minutes: selected.minutes,
                            source_action_id: (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.id) || null
                        });
                        aiFeedback_1.sendAIFeedback('ai_today_plan_apply', {
                            option: optionSelected,
                            goal_id: goalId,
                            variant: ab1TodayPlanVariant,
                            adoption_mode: adoptionMode,
                            recommendation_id: aiRecommendationId,
                            scene: 'today_plan',
                            strategy_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.strategyVersion) || null,
                            prompt_version: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.promptVersion) || null,
                            model: (aiMeta === null || aiMeta === void 0 ? void 0 : aiMeta.model) || null,
                            variant_minutes: selected.minutes,
                            source_action_id: (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.id) || null
                        });
                        setAiOpen(false);
                        return [3 /*break*/, 8];
                    case 6:
                        _c = _d.sent();
                        setAiError(((_b = (_a = dict === null || dict === void 0 ? void 0 : dict.common) === null || _a === void 0 ? void 0 : _a.errors) === null || _b === void 0 ? void 0 : _b.operation_failed) || 'Operation failed');
                        return [3 /*break*/, 8];
                    case 7:
                        setAiLoading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    return (React.createElement(React.Fragment, null,
        trigger ? (React.createElement("div", { onClick: openAIPlan, className: candidateGoals.length === 0 ? 'pointer-events-none opacity-60' : undefined }, trigger)) : (React.createElement(button_1.Button, { type: "button", size: triggerSize, variant: triggerVariant, className: triggerClassName, onClick: openAIPlan, disabled: aiLoading || candidateGoals.length === 0 },
            aiLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-current" }),
            triggerLabel
                || (planning === null || planning === void 0 ? void 0 : planning.aiPlanBtn)
                || 'AI Suggest a Core Action (Draft)')),
        React.createElement(dialog_1.Dialog, { open: aiOpen, onOpenChange: function (open) {
                if (!open && aiOpen && aiResult && !aiLoading && aiOutcomeState === 'idle') {
                    void dismissRecommendation();
                }
                setAiOpen(open);
            } },
            React.createElement(dialog_1.DialogFormContent, { className: "flex max-h-[92dvh] max-w-none flex-col overflow-hidden border-border/60 bg-background p-0 shadow-2xl sm:max-w-[min(92vw,72rem)]! sm:max-h-[88dvh]" },
                React.createElement(dialog_1.DialogHeader, { className: "shrink-0 border-b border-border/40 bg-linear-to-b from-primary/5 to-transparent px-4 pb-4 pt-4 sm:px-6 sm:pb-4 sm:pt-5" },
                    React.createElement("div", { className: "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-sm font-medium text-primary" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-3.5 w-3.5" }),
                        "AI Coach"),
                    React.createElement(dialog_1.DialogTitle, { className: "max-w-none text-[1.8rem] leading-tight tracking-[-0.02em] sm:text-[2rem]" }, (planning === null || planning === void 0 ? void 0 : planning.aiPlanTitle) || 'AI Core Action (Draft)')),
                React.createElement("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5" },
                    aiError && React.createElement("div", { className: "mb-4 text-sm text-destructive" }, aiError),
                    aiResult ? (React.createElement("div", { className: "space-y-3 sm:space-y-4" },
                        React.createElement("div", { className: "rounded-2xl border border-dashed border-border/60 bg-muted/8 px-4 py-3 text-sm text-muted-foreground" },
                            React.createElement("div", { className: "inline-flex items-start gap-2 font-medium text-foreground" },
                                React.createElement(lucide_react_1.Clock3, { className: "mt-0.5 h-4 w-4 shrink-0" }),
                                React.createElement("span", null, (planning === null || planning === void 0 ? void 0 : planning.aiPlanDurationHint) || '下面的选项表示预计投入时间。'))),
                        aiResult.recommendations.map(function (recommendation, idx) {
                            var _a;
                            var currentVariant = recommendation.variants.find(function (item) { return item.minutes === (selected === null || selected === void 0 ? void 0 : selected.minutes); });
                            var isSelectedRecommendation = (selected === null || selected === void 0 ? void 0 : selected.recIndex) === idx;
                            var sourceAction = recommendation.source_action_id ? actionMap.get(recommendation.source_action_id) : null;
                            var sourceGoalTitle = (sourceAction === null || sourceAction === void 0 ? void 0 : sourceAction.goal_title) || ((_a = candidateGoals.find(function (goal) { return goal.id === recommendation.goal_id; })) === null || _a === void 0 ? void 0 : _a.title)
                                || null;
                            var whyTodayLabel = locale === 'zh' ? '为什么是今天' : 'Why today';
                            var selectedVersionLabel = locale === 'zh' ? '当前选择' : 'Current choice';
                            return (React.createElement("div", { key: recommendation.kind + "-" + idx, className: "rounded-[24px] border p-4 transition-all sm:p-5 " + (isSelectedRecommendation
                                    ? 'border-primary/25 bg-primary/[0.035] shadow-sm'
                                    : 'border-border/60 bg-card/90') },
                                React.createElement("div", { className: "space-y-4 sm:space-y-5" },
                                    React.createElement("div", { className: "flex items-start justify-between gap-3" },
                                        React.createElement("div", { className: "space-y-3" },
                                            React.createElement("div", { className: "inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground" }, recommendation.kind === 'core'
                                                ? ((planning === null || planning === void 0 ? void 0 : planning.aiPlanRecommendedLabel) || (planning === null || planning === void 0 ? void 0 : planning.aiPlanCoreLabel)
                                                    || '推荐')
                                                : ((planning === null || planning === void 0 ? void 0 : planning.aiPlanAlternativeLabel) || (planning === null || planning === void 0 ? void 0 : planning.aiPlanAltLabel)
                                                    || '备选')),
                                            React.createElement("div", { className: "rounded-2xl border border-border/50 bg-background/70 px-4 py-3" },
                                                React.createElement("div", { className: "mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90" }, whyTodayLabel),
                                                React.createElement("div", { className: "max-w-none text-[15px] leading-8 text-muted-foreground sm:text-base" }, recommendation.reason)),
                                            recommendation.source_action_title ? (React.createElement("div", { className: "grid gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 text-xs text-muted-foreground lg:grid-cols-3 lg:p-3" },
                                                React.createElement("div", { className: "rounded-xl bg-muted/35 px-3 py-2.5" },
                                                    React.createElement("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90" }, planning.aiPlanBasedOn || '基于当前任务'),
                                                    React.createElement("div", { className: "line-clamp-2 text-sm font-medium leading-6 text-foreground" }, recommendation.source_action_title)),
                                                React.createElement("div", { className: "rounded-xl bg-muted/35 px-3 py-2.5" },
                                                    React.createElement("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90" }, planning.aiPlanGoalLabel || '所属目标'),
                                                    React.createElement("div", { className: "line-clamp-2 text-sm font-medium leading-6 text-foreground" }, sourceGoalTitle || '—')),
                                                React.createElement("div", { className: "rounded-xl bg-muted/35 px-3 py-2.5" },
                                                    React.createElement("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90" }, planning.aiPlanSourceMode || '建议方式'),
                                                    React.createElement("div", { className: "text-sm font-medium leading-6 text-foreground" }, recommendation.source_type === 'existing_action'
                                                        ? (planning.aiPlanSourceExisting || '继续推进现有任务')
                                                        : (planning.aiPlanSourceNew || '创建新的今日动作'))))) : null)),
                                    React.createElement("div", { className: "grid grid-cols-1 gap-2.5 md:grid-cols-3 lg:gap-3" }, recommendation.variants.map(function (variant) {
                                        var active = (selected === null || selected === void 0 ? void 0 : selected.recIndex) === idx && selected.minutes === variant.minutes;
                                        return (React.createElement(button_1.Button, { key: variant.minutes, type: "button", variant: active ? 'default' : 'outline', onClick: function () { return setSelected({ recIndex: idx, minutes: variant.minutes }); }, disabled: aiLoading, className: "h-auto min-h-15 whitespace-normal rounded-2xl px-4 py-3 text-sm leading-5 transition-all " + (active
                                                ? 'shadow-sm ring-1 ring-primary/20'
                                                : 'border-border/70 bg-background hover:border-primary/30 hover:bg-primary/3') },
                                            React.createElement("span", { className: "flex flex-col items-center gap-1 text-center" },
                                                React.createElement("span", null, getVariantLabel(variant.minutes)),
                                                active ? (React.createElement("span", { className: "text-[11px] font-medium opacity-80" }, selectedVersionLabel)) : null)));
                                    })),
                                    isSelectedRecommendation && currentVariant ? (React.createElement("div", { className: "rounded-[22px] border border-border/60 bg-background/90 p-4 text-sm shadow-sm sm:p-5" },
                                        React.createElement("div", { className: "grid gap-4 xl:grid-cols-[1.85fr_1fr] xl:gap-5" },
                                            React.createElement("div", { className: "space-y-4" },
                                                React.createElement("div", { className: "space-y-3" },
                                                    React.createElement("div", { className: "inline-flex rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-xs font-medium text-primary" },
                                                        selectedVersionLabel,
                                                        ": ",
                                                        getVariantLabel(currentVariant.minutes)),
                                                    React.createElement("div", { className: "text-lg font-semibold leading-8 tracking-[-0.01em] lg:text-xl" }, currentVariant.title)),
                                                React.createElement("div", { className: "space-y-1.5" },
                                                    React.createElement("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground" }, (planning === null || planning === void 0 ? void 0 : planning.aiPlanFirstStep) || '第一步'),
                                                    React.createElement("div", { className: "rounded-2xl bg-muted/25 px-4 py-3 leading-7" }, currentVariant.first_step))),
                                            React.createElement("div", { className: "rounded-2xl border border-border/50 bg-muted/35 p-4" },
                                                React.createElement("div", { className: "space-y-2" },
                                                    React.createElement("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2" },
                                                        React.createElement(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5" }),
                                                        (planning === null || planning === void 0 ? void 0 : planning.aiPlanDefinitionOfDone) || '完成标准'),
                                                    React.createElement("div", { className: "leading-7" }, currentVariant.definition_of_done)))))) : null)));
                        }),
                        React.createElement("div", { className: "flex flex-col-reverse gap-3 border-t border-border/50 pt-5 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-0" },
                            React.createElement("div", { className: "hidden text-xs text-muted-foreground sm:block" }, selected ? getVariantLabel(selected.minutes) : ''),
                            React.createElement("div", { className: "flex flex-col-reverse gap-3 sm:flex-row sm:gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return setAiOpen(false); }, disabled: aiLoading, className: "w-full rounded-full px-5 sm:w-auto" }, ((_e = dict === null || dict === void 0 ? void 0 : dict.common) === null || _e === void 0 ? void 0 : _e.cancel) || 'Cancel'),
                                React.createElement(button_1.Button, { type: "button", onClick: applySelected, disabled: aiLoading || !selected, className: "w-full rounded-full px-5 sm:w-auto" },
                                    aiLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
                                    getApplyButtonLabel()))))) : (React.createElement("div", { className: "py-8 text-sm text-muted-foreground" }, aiLoading
                        ? ((planning === null || planning === void 0 ? void 0 : planning.aiPlanLoading) || 'Generating...')
                        : ((planning === null || planning === void 0 ? void 0 : planning.aiPlanHint) || 'Click to generate suggestions'))))))));
}
exports.AITodayPlanButton = AITodayPlanButton;
