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
exports.ScoreCard = void 0;
var react_1 = require("react");
var react_dom_1 = require("react-dom");
var button_1 = require("@/components/ui/button");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var actions_1 = require("@/app/(authenticated)/dashboard/actions");
var dialog_1 = require("@/components/ui/dialog");
var analytics_1 = require("@/lib/analytics");
var aiFeedback_1 = require("@/lib/aiFeedback");
function SubmitScoreButton(_a) {
    var disabled = _a.disabled, label = _a.label;
    var pending = react_dom_1.useFormStatus().pending;
    return (React.createElement(button_1.Button, { disabled: disabled || pending, className: "w-full" },
        pending && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
        label));
}
function ScoreCard(_a) {
    var _b, _c, _d, _e, _f;
    var dict = _a.dict, today = _a.today, _g = _a.recent7, _recent7 = _g === void 0 ? [] : _g, _h = _a.currentScore, currentScore = _h === void 0 ? null : _h, _j = _a.reviewQuestionsCount, reviewQuestionsCount = _j === void 0 ? 2 : _j, _k = _a.ab2ReviewVariant, ab2ReviewVariant = _k === void 0 ? null : _k, className = _a.className;
    void _recent7;
    var dashboardText = dict.dashboard;
    var commonErrors = dict.common.errors;
    var _l = react_1.useState(currentScore), score = _l[0], setScore = _l[1];
    var _m = react_1.useState(false), reviewOpen = _m[0], setReviewOpen = _m[1];
    var _o = react_1.useState(false), reviewLoading = _o[0], setReviewLoading = _o[1];
    var _p = react_1.useState(null), reviewError = _p[0], setReviewError = _p[1];
    var _q = react_1.useState(null), reviewResult = _q[0], setReviewResult = _q[1];
    var _r = react_1.useState(null), reviewRecommendationId = _r[0], setReviewRecommendationId = _r[1];
    var _s = react_1.useState('idle'), reviewOutcomeState = _s[0], setReviewOutcomeState = _s[1];
    var _t = react_1.useState(''), friction = _t[0], setFriction = _t[1];
    var _u = react_1.useState(''), tomorrowTime = _u[0], setTomorrowTime = _u[1];
    var locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    var labels = [
        ((_b = dict.today.scoreLabels) === null || _b === void 0 ? void 0 : _b[0]) || '很糟',
        ((_c = dict.today.scoreLabels) === null || _c === void 0 ? void 0 : _c[1]) || '一般',
        ((_d = dict.today.scoreLabels) === null || _d === void 0 ? void 0 : _d[2]) || '不错',
        ((_e = dict.today.scoreLabels) === null || _e === void 0 ? void 0 : _e[3]) || '很好',
        ((_f = dict.today.scoreLabels) === null || _f === void 0 ? void 0 : _f[4]) || '极佳'
    ];
    function openReview() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                setReviewOpen(true);
                setReviewError(null);
                setReviewResult(null);
                setReviewRecommendationId(null);
                setReviewOutcomeState('idle');
                setFriction('');
                setTomorrowTime('');
                analytics_1.logEvent('ai_review_click', { source: 'dashboard', had_score: score != null, variant: ab2ReviewVariant });
                aiFeedback_1.sendAIFeedback('ai_review_click', { source: 'dashboard', had_score: score != null, variant: ab2ReviewVariant });
                return [2 /*return*/];
            });
        });
    }
    function generateReview() {
        return __awaiter(this, void 0, void 0, function () {
            var answers, res, json, key, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setReviewError(null);
                        setReviewLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        answers = {};
                        if (friction)
                            answers.friction = friction;
                        if (reviewQuestionsCount === 2 && tomorrowTime)
                            answers.tomorrow_time = tomorrowTime;
                        return [4 /*yield*/, fetch('/api/ai/review', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ today: today, score: score, answers: answers, locale: locale })
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_b.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            setReviewError(commonErrors[key] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        if (!json.data || !json.recommendationId) {
                            setReviewError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setReviewResult(json.data);
                        setReviewRecommendationId(json.recommendationId);
                        analytics_1.logEvent('ai_review_generated', {
                            questions_answered: (friction ? 1 : 0) + (reviewQuestionsCount === 2 && tomorrowTime ? 1 : 0),
                            variant: ab2ReviewVariant
                        });
                        aiFeedback_1.sendAIFeedback('ai_review_generated', {
                            questions_answered: (friction ? 1 : 0) + (reviewQuestionsCount === 2 && tomorrowTime ? 1 : 0),
                            friction: friction || null,
                            tomorrow_time: (reviewQuestionsCount === 2 ? (tomorrowTime || null) : null),
                            variant: ab2ReviewVariant
                        });
                        return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
                        setReviewError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 6];
                    case 5:
                        setReviewLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (React.createElement("div", { className: "rounded-lg border bg-card/50 backdrop-blur-sm p-4 flex flex-col justify-between " + className },
        React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("div", { className: "min-w-0" },
                React.createElement("div", { className: "text-sm font-medium" }, dict.dashboard.dailyScore),
                dict.dashboard.dailyScoreDesc && (React.createElement("div", { className: "text-xs text-muted-foreground mt-0.5" }, dict.dashboard.dailyScoreDesc))),
            React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("div", { className: "text-xl font-bold" }, score !== null && score !== void 0 ? score : '-'),
                React.createElement("div", { className: "text-muted-foreground text-sm" }, "/ 5"),
                currentScore != null && (React.createElement("span", { className: "rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground" }, score === currentScore ? (dict.today.alreadyScored || '今日已评分') : (dict.today.updateScore || '修改评分'))))),
        React.createElement("div", { className: "grid grid-cols-5 gap-2" }, [1, 2, 3, 4, 5].map(function (n, i) {
            var active = score === n;
            return (React.createElement("button", { key: n, type: "button", onClick: function () { return setScore(n); }, className: "rounded-md px-1 py-1.5 text-sm transition-all " + (active ? 'bg-primary text-primary-foreground scale-[1.03]' : 'bg-muted hover:bg-muted/70') },
                React.createElement("div", { className: "font-medium text-sm" }, n),
                React.createElement("div", { className: "text-[9px] mt-0.5 opacity-70 truncate" }, labels[i])));
        })),
        React.createElement("form", { action: actions_1.submitScore, className: "mt-3" },
            React.createElement("input", { type: "hidden", name: "date", value: today }),
            React.createElement("input", { type: "hidden", name: "score", value: score !== null && score !== void 0 ? score : '' }),
            React.createElement(SubmitScoreButton, { disabled: score == null || (currentScore != null && score === currentScore), label: score != null && currentScore != null && score !== currentScore ? (dict.today.updateScore || '更新评分') : dict.common.submit })),
        React.createElement("div", { className: "mt-3" },
            React.createElement(button_1.Button, { type: "button", variant: "outline", className: "w-full", onClick: openReview }, dashboardText.aiReviewBtn || (locale === 'zh' ? 'AI 帮我总结今天 & 给明天策略（草案）' : 'AI Review & Tomorrow Plan (draft)'))),
        React.createElement(dialog_1.Dialog, { open: reviewOpen, onOpenChange: function (open) {
                if (!open && reviewOpen && reviewRecommendationId && reviewOutcomeState === 'idle') {
                    setReviewOutcomeState('dismissed');
                    void fetch("/api/ai/recommendations/" + reviewRecommendationId + "/dismiss", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ feedbackLabel: reviewResult ? 'close_result' : 'dismiss' })
                    })["catch"](function () {
                    });
                    analytics_1.logEvent('ai_review_dismiss', { step: 'result', variant: ab2ReviewVariant });
                    aiFeedback_1.sendAIFeedback('ai_review_dismiss', { step: 'result', variant: ab2ReviewVariant });
                }
                setReviewOpen(open);
            } },
            React.createElement(dialog_1.DialogFormContent, { mobileMode: "fullscreen", className: "sm:max-w-lg p-4 sm:p-6" },
                React.createElement(dialog_1.DialogHeader, { className: "pr-10 text-left sm:text-left" },
                    React.createElement(dialog_1.DialogTitle, null, dashboardText.aiReviewTitle || (locale === 'zh' ? 'AI 夜间复盘（草案）' : 'AI Review (draft)')),
                    React.createElement("div", { className: "text-xs text-muted-foreground" }, locale === 'zh' ? '回答 0-2 个问题后生成简洁建议' : 'Answer 0-2 questions and generate concise suggestions')),
                React.createElement("div", { className: "space-y-4 mt-2" },
                    React.createElement("div", { className: "space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3" },
                        React.createElement("div", { className: "text-sm font-medium" }, locale === 'zh' ? '今天最大的阻力是什么？' : 'What was the biggest friction today?'),
                        React.createElement("select", { value: friction, onChange: function (e) { return setFriction(e.target.value); }, className: "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", disabled: reviewLoading },
                            React.createElement("option", { value: "" }, locale === 'zh' ? '可跳过' : 'Skip'),
                            React.createElement("option", { value: "no_time" }, locale === 'zh' ? '没时间' : 'No time'),
                            React.createElement("option", { value: "too_hard" }, locale === 'zh' ? '太难' : 'Too hard'),
                            React.createElement("option", { value: "anxiety" }, locale === 'zh' ? '焦虑' : 'Anxiety'),
                            React.createElement("option", { value: "unclear_next" }, locale === 'zh' ? '不知道下一步' : 'Unclear next'),
                            React.createElement("option", { value: "low_energy" }, locale === 'zh' ? '没精力' : 'Low energy'),
                            React.createElement("option", { value: "other" }, locale === 'zh' ? '其他' : 'Other'))),
                    reviewQuestionsCount === 2 ? (React.createElement("div", { className: "space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3" },
                        React.createElement("div", { className: "text-sm font-medium" }, locale === 'zh' ? '明天大概能投入多久？' : 'How much time can you invest tomorrow?'),
                        React.createElement("select", { value: tomorrowTime, onChange: function (e) { return setTomorrowTime(e.target.value); }, className: "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", disabled: reviewLoading },
                            React.createElement("option", { value: "" }, locale === 'zh' ? '可跳过' : 'Skip'),
                            React.createElement("option", { value: "5-10" }, "5-10m"),
                            React.createElement("option", { value: "10-20" }, "10-20m"),
                            React.createElement("option", { value: "20-45" }, "20-45m"),
                            React.createElement("option", { value: "45+" }, "45m+"),
                            React.createElement("option", { value: "unknown" }, locale === 'zh' ? '不确定' : 'Unknown')))) : null,
                    React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                        React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return setReviewOpen(false); }, disabled: reviewLoading }, dict.common.cancel),
                        React.createElement(button_1.Button, { type: "button", onClick: generateReview, disabled: reviewLoading },
                            reviewLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
                            locale === 'zh' ? '生成' : 'Generate')),
                    reviewError && React.createElement("div", { className: "text-sm text-destructive" }, reviewError),
                    reviewResult ? (React.createElement("div", { className: "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4" },
                        React.createElement("div", { className: "text-sm font-medium" }, reviewResult.summary_sentence),
                        React.createElement("div", { className: "text-sm text-muted-foreground space-y-1" },
                            React.createElement("div", null,
                                locale === 'zh' ? '风险：' : 'Risk: ',
                                reviewResult.tomorrow_card.risk),
                            React.createElement("div", null,
                                locale === 'zh' ? 'If-Then：如果' : 'If-Then: if ',
                                reviewResult.tomorrow_card.if_then["if"],
                                locale === 'zh' ? '那么' : ' then ',
                                reviewResult.tomorrow_card.if_then.then),
                            React.createElement("div", null,
                                locale === 'zh' ? '明日方向：' : 'Tomorrow direction: ',
                                reviewResult.tomorrow_card.suggested_core_action_direction)))) : null)))));
}
exports.ScoreCard = ScoreCard;
