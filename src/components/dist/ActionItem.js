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
exports.ActionItem = void 0;
var react_dom_1 = require("react-dom");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
function CompleteButton(_a) {
    var completed = _a.completed, type = _a.type;
    var pending = react_dom_1.useFormStatus().pending;
    if (pending) {
        return (React.createElement("button", { disabled: true, className: "focus:outline-none flex items-center justify-center cursor-not-allowed opacity-70" },
            React.createElement(loading_spinner_1.LoadingSpinner, { size: 20, className: type === 'core' ? 'text-primary' : 'text-muted-foreground' })));
    }
    return (React.createElement("button", { type: "submit", className: "focus:outline-none transition-transform hover:scale-110 flex items-center justify-center" }, completed ? (React.createElement("div", { className: "rounded-full bg-primary/10 p-1" },
        React.createElement(lucide_react_1.CheckCircle2, { className: "h-5 w-5 " + (type === 'core' ? 'text-primary' : 'text-primary') }))) : (React.createElement(lucide_react_1.Circle, { className: "h-5 w-5 " + (type === 'core' ? 'text-primary/70' : 'text-muted-foreground') }))));
}
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var date_fns_1 = require("date-fns");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
var SubmitButton_1 = require("@/components/SubmitButton");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var DateRangeFields_1 = require("@/components/DateRangeFields");
var actions_1 = require("@/app/(authenticated)/dashboard/actions");
var sheet_1 = require("@/components/ui/sheet");
var dialog_1 = require("@/components/ui/dialog");
var actions_2 = require("@/app/(authenticated)/goals/actions");
var aiTodayPlan_1 = require("@/lib/aiTodayPlan");
var analytics_1 = require("@/lib/analytics");
var aiFeedback_1 = require("@/lib/aiFeedback");
var client_1 = require("@/lib/supabase/client");
var ActionDescriptionEditor_1 = require("@/components/ActionDescriptionEditor");
var RichTextContentView_1 = require("@/components/RichTextContentView");
var RichTextImagePreviewDialog_1 = require("@/components/RichTextImagePreviewDialog");
var actionRecurrence_1 = require("@/lib/actionRecurrence");
var select_1 = require("@/components/ui/select");
function decodeHtmlEntities(input) {
    return input
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}
function richTextToPlainText(input, locale) {
    var imageLabel = locale === 'zh' ? '图片' : 'Image';
    var normalized = decodeHtmlEntities(input);
    var withMarkdownImages = normalized.replace(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (_, src) {
        return "\n" + imageLabel + "\uFF1A" + src + "\n";
    });
    var withHtmlImages = withMarkdownImages.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, function (_, src) {
        return "\n" + imageLabel + "\uFF1A" + src + "\n";
    });
    return withHtmlImages
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<[^>]+>/g, '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function ActionItem(_a) {
    var _b, _c, _d;
    var action = _a.action, dict = _a.dict, _e = _a.showGoalTitle, showGoalTitle = _e === void 0 ? false : _e, _f = _a.tz, tz = _f === void 0 ? 'Asia/Shanghai' : _f, _g = _a.goals, goals = _g === void 0 ? [] : _g, _h = _a.isNew, isNew = _h === void 0 ? false : _h;
    var router = navigation_1.useRouter();
    var recurrenceMeta = actionRecurrence_1.parseActionRecurrenceDescription(action.description || '');
    var todayText = dict.today;
    var goalNewText = dict.goals["new"];
    var commonErrors = dict.common.errors;
    var _j = react_1.useState(false), isLoading = _j[0], setIsLoading = _j[1];
    var _k = react_1.useState(false), isDeleting = _k[0], setIsDeleting = _k[1];
    var _l = react_1.useState(false), deleteDialogOpen = _l[0], setDeleteDialogOpen = _l[1];
    var _m = react_1.useState(false), detailsOpen = _m[0], setDetailsOpen = _m[1];
    var _o = react_1.useState('view'), panelMode = _o[0], setPanelMode = _o[1];
    var _p = react_1.useState(true), dateRangeValid = _p[0], setDateRangeValid = _p[1];
    var _q = react_1.useState(false), swipeEnabled = _q[0], setSwipeEnabled = _q[1];
    var _r = react_1.useState(false), isDesktop = _r[0], setIsDesktop = _r[1];
    var _s = react_1.useState(false), draggedRecently = _s[0], setDraggedRecently = _s[1];
    var controls = framer_motion_1.useAnimationControls();
    var _t = react_1.useState('too_hard'), rescueReason = _t[0], setRescueReason = _t[1];
    var _u = react_1.useState(false), rescueLoading = _u[0], setRescueLoading = _u[1];
    var _v = react_1.useState(null), rescueError = _v[0], setRescueError = _v[1];
    var _w = react_1.useState(null), rescueResult = _w[0], setRescueResult = _w[1];
    var _x = react_1.useState(null), rescueRecommendationId = _x[0], setRescueRecommendationId = _x[1];
    var _y = react_1.useState('idle'), rescueOutcomeState = _y[0], setRescueOutcomeState = _y[1];
    var _z = react_1.useState(false), subItemsOpen = _z[0], setSubItemsOpen = _z[1];
    var _0 = react_1.useState(null), subItemBusyId = _0[0], setSubItemBusyId = _0[1];
    var _1 = react_1.useState(''), uploadUserId = _1[0], setUploadUserId = _1[1];
    var _2 = react_1.useState(action.title), editTitle = _2[0], setEditTitle = _2[1];
    var _3 = react_1.useState(action.description || ''), editDescription = _3[0], setEditDescription = _3[1];
    var _4 = react_1.useState(action.goal_id), editGoalId = _4[0], setEditGoalId = _4[1];
    var _5 = react_1.useState(action.type || 'core'), editType = _5[0], setEditType = _5[1];
    var _6 = react_1.useState(action.priority || 'medium'), editPriority = _6[0], setEditPriority = _6[1];
    var _7 = react_1.useState(recurrenceMeta.recurrence), editRepeatRule = _7[0], setEditRepeatRule = _7[1];
    var _8 = react_1.useState(action.start_date), editStartDate = _8[0], setEditStartDate = _8[1];
    var _9 = react_1.useState(action.end_date || action.start_date), editEndDate = _9[0], setEditEndDate = _9[1];
    var _10 = react_1.useState((action.action_sub_items || []).map(function (item) { return ({
        id: item.id,
        title: item.title,
        completed: Boolean(item.completed)
    }); })), editSubItems = _10[0], setEditSubItems = _10[1];
    var _11 = react_1.useState([]), editAttachmentsDraft = _11[0], setEditAttachmentsDraft = _11[1];
    var _12 = react_1.useState(false), editDescriptionUploading = _12[0], setEditDescriptionUploading = _12[1];
    var _13 = react_1.useState(false), editAiLoading = _13[0], setEditAiLoading = _13[1];
    var _14 = react_1.useState(null), editAiError = _14[0], setEditAiError = _14[1];
    var _15 = react_1.useState([]), editAiDrafts = _15[0], setEditAiDrafts = _15[1];
    var _16 = react_1.useState(false), discardDialogOpen = _16[0], setDiscardDialogOpen = _16[1];
    var _17 = react_1.useState('switch_to_view'), discardIntent = _17[0], setDiscardIntent = _17[1];
    var _18 = react_1.useState(null), copiedMode = _18[0], setCopiedMode = _18[1];
    var _19 = react_1.useState(false), isPanelFullscreen = _19[0], setIsPanelFullscreen = _19[1];
    var _20 = react_1.useState(null), previewImageUrl = _20[0], setPreviewImageUrl = _20[1];
    var unsavedConfirmText = goalNewText.confirmDiscardChanges || '你有未保存的修改，确认放弃吗？';
    function resetEditDraftFromAction() {
        setEditTitle(action.title);
        setEditDescription(action.description || '');
        setEditGoalId(action.goal_id);
        setEditType(action.type || 'core');
        setEditPriority(action.priority || 'medium');
        setEditRepeatRule(actionRecurrence_1.parseActionRecurrenceDescription(action.description || '').recurrence);
        setEditStartDate(action.start_date);
        setEditEndDate(action.end_date || action.start_date);
        setEditSubItems((action.action_sub_items || []).map(function (item) { return ({
            id: item.id,
            title: item.title,
            completed: Boolean(item.completed)
        }); }));
        setEditAttachmentsDraft([]);
        setEditDescriptionUploading(false);
        setEditAiLoading(false);
        setEditAiError(null);
        setEditAiDrafts([]);
        if (!detailsOpen) {
            setIsPanelFullscreen(false);
        }
    }
    var isEditDirty = (function () {
        var baseStart = action.start_date || '';
        var baseEnd = action.end_date || action.start_date || '';
        return (editTitle !== action.title ||
            editDescription !== (action.description || '') ||
            editGoalId !== action.goal_id ||
            editType !== (action.type || 'core') ||
            editPriority !== (action.priority || 'medium') ||
            editRepeatRule !== actionRecurrence_1.parseActionRecurrenceDescription(action.description || '').recurrence ||
            editStartDate !== baseStart ||
            editEndDate !== baseEnd ||
            JSON.stringify(editSubItems) !==
                JSON.stringify((action.action_sub_items || []).map(function (item) { return ({
                    id: item.id,
                    title: item.title,
                    completed: Boolean(item.completed)
                }); })) ||
            editAttachmentsDraft.length > 0);
    })();
    var hasDetails = true;
    var subItems = __spreadArrays((action.action_sub_items || [])).sort(function (a, b) { var _a, _b; return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0); });
    var subItemsCompletedCount = subItems.filter(function (item) { return item.completed; }).length;
    var closeSwipe = function () {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 420, damping: 34 } });
    };
    var openSwipe = function () {
        controls.start({ x: -128, transition: { type: 'spring', stiffness: 420, damping: 34 } });
    };
    var handleDragEnd = function (_, info) {
        var shouldOpen = info.offset.x < -40 || info.velocity.x < -500;
        if (shouldOpen)
            openSwipe();
        else
            closeSwipe();
        setDraggedRecently(true);
        setTimeout(function () { return setDraggedRecently(false); }, 180);
    };
    react_1.useEffect(function () {
        if (typeof window === 'undefined')
            return;
        var mediaQueryList = window.matchMedia('(hover: none) and (pointer: coarse)');
        var sync = function () {
            var enabled = mediaQueryList.matches;
            setSwipeEnabled(enabled);
            if (!enabled) {
                controls.start({ x: 0, transition: { type: 'spring', stiffness: 420, damping: 34 } });
            }
        };
        sync();
        if (typeof mediaQueryList.addEventListener === 'function') {
            mediaQueryList.addEventListener('change', sync);
            return function () { return mediaQueryList.removeEventListener('change', sync); };
        }
        mediaQueryList.addListener(sync);
        return function () { return mediaQueryList.removeListener(sync); };
    }, [controls]);
    react_1.useEffect(function () {
        if (typeof window === 'undefined')
            return;
        var media = window.matchMedia('(min-width: 768px)');
        var sync = function () { return setIsDesktop(media.matches); };
        sync();
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', sync);
            return function () { return media.removeEventListener('change', sync); };
        }
        media.addListener(sync);
        return function () { return media.removeListener(sync); };
    }, []);
    react_1.useEffect(function () {
        var supabase = client_1.createClient();
        void supabase.auth.getUser().then(function (_a) {
            var _b;
            var data = _a.data;
            var uid = ((_b = data.user) === null || _b === void 0 ? void 0 : _b.id) || '';
            setUploadUserId(uid);
        });
    }, []);
    function handleUpdate(formData) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dateRangeValid || editDescriptionUploading)
                            return [2 /*return*/];
                        setIsLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, actions_2.updateAction(formData)];
                    case 2:
                        _a.sent();
                        setPanelMode('view');
                        setDetailsOpen(false);
                        closeSwipe();
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error(error_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function confirmDiscardAndProceed() {
        setDiscardDialogOpen(false);
        resetEditDraftFromAction();
        setPanelMode('view');
        if (discardIntent === 'close_panel') {
            setDetailsOpen(false);
            closeSwipe();
        }
    }
    function requestExitEdit(intent) {
        if (isEditDirty) {
            setDiscardIntent(intent);
            setDiscardDialogOpen(true);
            return;
        }
        resetEditDraftFromAction();
        setPanelMode('view');
        if (intent === 'close_panel') {
            setDetailsOpen(false);
            closeSwipe();
        }
    }
    function handleDelete() {
        return __awaiter(this, void 0, void 0, function () {
            var formData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsDeleting(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        formData = new FormData();
                        formData.set('id', action.id);
                        formData.set('goal_id', action.goal_id);
                        return [4 /*yield*/, actions_2.deleteAction(formData)];
                    case 2:
                        _a.sent();
                        setDeleteDialogOpen(false);
                        setDetailsOpen(false);
                        setPanelMode('view');
                        closeSwipe();
                        return [3 /*break*/, 5];
                    case 3:
                        error_2 = _a.sent();
                        console.error(error_2);
                        return [3 /*break*/, 5];
                    case 4:
                        setIsDeleting(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function openDetails() {
        if (draggedRecently)
            return;
        closeSwipe();
        setIsPanelFullscreen(false);
        setPanelMode('view');
        setDetailsOpen(true);
    }
    function openEditPanel() {
        closeSwipe();
        resetEditDraftFromAction();
        if (!detailsOpen) {
            setIsPanelFullscreen(false);
        }
        setPanelMode('edit');
        setDetailsOpen(true);
    }
    function openRescuePanel() {
        closeSwipe();
        if (!detailsOpen) {
            setIsPanelFullscreen(false);
        }
        setPanelMode('rescue');
        setRescueError(null);
        setRescueResult(null);
        setRescueRecommendationId(null);
        setRescueOutcomeState('idle');
        setDetailsOpen(true);
        analytics_1.logEvent('ai_rescue_click', { action_id: action.id });
        aiFeedback_1.sendAIFeedback('ai_rescue_click', { action_id: action.id, goal_id: action.goal_id });
    }
    var handlePanelOpenChange = function (open) {
        if (!open && panelMode === 'edit') {
            requestExitEdit('close_panel');
            return;
        }
        if (!open && panelMode === 'rescue' && rescueResult && rescueRecommendationId && rescueOutcomeState === 'idle') {
            setRescueOutcomeState('dismissed');
            void fetch("/api/ai/recommendations/" + rescueRecommendationId + "/dismiss", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackLabel: 'dismiss' })
            })["catch"](function () {
            });
        }
        setDetailsOpen(open);
        if (!open) {
            setPanelMode('view');
            setIsPanelFullscreen(false);
        }
    };
    var locale = String(dict.common.locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    var newBadgeText = locale === 'zh' ? '刚创建' : 'NEW';
    var goalTitle = ((_b = action.goals) === null || _b === void 0 ? void 0 : _b.title) || '';
    var rescueTitleText = locale === 'zh' ? '卡住救援' : 'Rescue';
    var copyTitleText = locale === 'zh' ? '复制标题' : 'Copy title';
    var copyFullText = locale === 'zh' ? '复制标题和详情' : 'Copy title + details';
    var copiedText = locale === 'zh' ? '已复制' : 'Copied';
    var aiPlanCardTitle = locale === 'zh' ? 'AI 今日推进建议' : 'AI Today Focus';
    var aiPlanBasedOnLabel = locale === 'zh' ? '基于任务' : 'Based on';
    var aiPlanVariantLabel = locale === 'zh' ? '推进版本' : 'Focus mode';
    var aiPlanReasonLabel = locale === 'zh' ? '建议原因' : 'Why this';
    var recurrenceLabelMap = {
        none: todayText.repeatNone || (locale === 'zh' ? '不重复' : 'No repeat'),
        daily: todayText.repeatDaily || (locale === 'zh' ? '每天' : 'Daily'),
        weekly: todayText.repeatWeekly || (locale === 'zh' ? '每周' : 'Weekly'),
        monthly: todayText.repeatMonthly || (locale === 'zh' ? '每月' : 'Monthly')
    };
    var parsedAITodayPlan = aiTodayPlan_1.parseAITodayPlanFromDescription(recurrenceMeta.cleanDescription || '');
    var displayDescription = (parsedAITodayPlan === null || parsedAITodayPlan === void 0 ? void 0 : parsedAITodayPlan.remainingDescription) || recurrenceMeta.cleanDescription || '';
    var hasDescription = Boolean(displayDescription);
    var aiPlanInsightCard = parsedAITodayPlan ? (React.createElement("div", { className: "rounded-xl border border-primary/20 bg-primary/5 p-4" },
        React.createElement("div", { className: "mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary" },
            React.createElement(lucide_react_1.Sparkles, { className: "h-3.5 w-3.5" }),
            aiPlanCardTitle),
        React.createElement("div", { className: "space-y-3" },
            React.createElement("div", { className: "flex flex-wrap gap-2 text-xs" },
                React.createElement("span", { className: "rounded-full bg-background/90 px-3 py-1 font-medium text-foreground border border-border/50" },
                    aiPlanVariantLabel,
                    "\uFF1A",
                    parsedAITodayPlan.variantLabel),
                parsedAITodayPlan.basedOn ? (React.createElement("span", { className: "rounded-full bg-background/90 px-3 py-1 font-medium text-muted-foreground border border-border/50" },
                    aiPlanBasedOnLabel,
                    "\uFF1A",
                    parsedAITodayPlan.basedOn)) : null),
            React.createElement("div", { className: "grid gap-3 md:grid-cols-[1.4fr_1fr]" },
                React.createElement("div", { className: "rounded-xl border border-border/50 bg-background/85 p-3" },
                    React.createElement("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground" }, locale === 'zh' ? '第一步' : 'First step'),
                    React.createElement("div", { className: "text-sm leading-6 text-foreground" }, parsedAITodayPlan.firstStep)),
                React.createElement("div", { className: "rounded-xl border border-border/50 bg-background/85 p-3" },
                    React.createElement("div", { className: "mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground" }, locale === 'zh' ? '完成标准' : 'Definition of done'),
                    React.createElement("div", { className: "text-sm leading-6 text-foreground" }, parsedAITodayPlan.definitionOfDone))),
            parsedAITodayPlan.reason ? (React.createElement("div", { className: "rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground leading-6" },
                React.createElement("span", { className: "mr-2 font-medium text-foreground" }, aiPlanReasonLabel),
                parsedAITodayPlan.reason)) : null))) : null;
    function handleCopy(mode) {
        return __awaiter(this, void 0, void 0, function () {
            var title, description, text, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        title = action.title.trim();
                        description = richTextToPlainText(displayDescription, locale).trim();
                        text = mode === 'title'
                            ? title
                            : [title, description].filter(Boolean).join('\n\n');
                        if (!text)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, navigator.clipboard.writeText(text)];
                    case 2:
                        _a.sent();
                        setCopiedMode(mode);
                        setTimeout(function () {
                            setCopiedMode(function (current) { return (current === mode ? null : current); });
                        }, 1200);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function generateRescue() {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, key, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!goalTitle)
                            return [2 /*return*/];
                        setRescueError(null);
                        setRescueLoading(true);
                        setRescueRecommendationId(null);
                        setRescueOutcomeState('idle');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/ai/rescue', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    locale: locale,
                                    reason_tag: rescueReason,
                                    action: { id: action.id, title: action.title, description: action.description || null },
                                    goal: { id: action.goal_id, title: goalTitle }
                                })
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_b.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            setRescueError(commonErrors[key] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        if (!json.data || !json.recommendationId) {
                            setRescueError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setRescueResult(json.data);
                        setRescueRecommendationId(json.recommendationId);
                        return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
                        setRescueError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 6];
                    case 5:
                        setRescueLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function applyRescueReplace() {
        return __awaiter(this, void 0, void 0, function () {
            var endDateStr_1, description, formData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!rescueResult)
                            return [2 /*return*/];
                        setRescueLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        endDateStr_1 = action.end_date || action.start_date;
                        description = [
                            "First step: " + rescueResult.minimal_variant.first_step,
                            "DoD: " + rescueResult.minimal_variant.definition_of_done,
                            "If-Then: \u5982\u679C" + rescueResult.if_then["if"] + " \u90A3\u4E48" + rescueResult.if_then.then
                        ].join('\n');
                        formData = new FormData();
                        formData.set('id', action.id);
                        formData.set('goal_id', action.goal_id);
                        formData.set('title', rescueResult.minimal_variant.title);
                        formData.set('type', action.type || 'core');
                        formData.set('priority', action.priority || 'medium');
                        formData.set('description', description);
                        formData.set('start_date', action.start_date);
                        formData.set('end_date', endDateStr_1);
                        if (rescueRecommendationId) {
                            formData.set('ai_recommendation_id', rescueRecommendationId);
                        }
                        return [4 /*yield*/, actions_2.updateAction(formData)];
                    case 2:
                        _b.sent();
                        if (rescueRecommendationId) {
                            setRescueOutcomeState('adopted');
                            void fetch("/api/ai/recommendations/" + rescueRecommendationId + "/adopt", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    optionSelected: '5m',
                                    actionId: action.id
                                })
                            })["catch"](function () {
                            });
                        }
                        analytics_1.logEvent('ai_rescue_apply', { mode: 'replace', option: '5m', action_id: action.id });
                        aiFeedback_1.sendAIFeedback('ai_rescue_apply', { mode: 'replace', option: '5m', action_id: action.id, goal_id: action.goal_id, reason: rescueReason });
                        setPanelMode('view');
                        setDetailsOpen(false);
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        setRescueError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 5];
                    case 4:
                        setRescueLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function applyRescueAdd() {
        return __awaiter(this, void 0, void 0, function () {
            var endDateStr_2, description, formData, created, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!rescueResult)
                            return [2 /*return*/];
                        setRescueLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        endDateStr_2 = action.end_date || action.start_date;
                        description = [
                            "First step: " + rescueResult.minimal_variant.first_step,
                            "DoD: " + rescueResult.minimal_variant.definition_of_done,
                            "If-Then: \u5982\u679C" + rescueResult.if_then["if"] + " \u90A3\u4E48" + rescueResult.if_then.then
                        ].join('\n');
                        formData = new FormData();
                        formData.set('goal_id', action.goal_id);
                        formData.set('title', rescueResult.minimal_variant.title);
                        formData.set('type', 'maintenance');
                        formData.set('priority', action.priority || 'medium');
                        formData.set('description', description);
                        formData.set('start_date', action.start_date);
                        formData.set('end_date', endDateStr_2);
                        if (rescueRecommendationId) {
                            formData.set('ai_recommendation_id', rescueRecommendationId);
                        }
                        return [4 /*yield*/, actions_2.createActionAndReturnId(formData)];
                    case 2:
                        created = _b.sent();
                        if (rescueRecommendationId) {
                            setRescueOutcomeState('adopted');
                            void fetch("/api/ai/recommendations/" + rescueRecommendationId + "/adopt", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    optionSelected: '5m',
                                    actionId: (created === null || created === void 0 ? void 0 : created.actionId) || null
                                })
                            })["catch"](function () {
                            });
                        }
                        analytics_1.logEvent('ai_rescue_apply', { mode: 'add', option: '5m', action_id: action.id });
                        aiFeedback_1.sendAIFeedback('ai_rescue_apply', { mode: 'add', option: '5m', action_id: action.id, goal_id: action.goal_id, reason: rescueReason });
                        setPanelMode('view');
                        setDetailsOpen(false);
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        setRescueError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 5];
                    case 4:
                        setRescueLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function onToggleSubItem(id, currentCompleted) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setSubItemBusyId(id);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        formData = new FormData();
                        formData.set('id', id);
                        formData.set('goal_id', action.goal_id);
                        formData.set('completed', currentCompleted ? 'true' : 'false');
                        return [4 /*yield*/, actions_2.toggleActionSubItem(formData)];
                    case 2:
                        _b.sent();
                        router.refresh();
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        setSubItemBusyId(null);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleAISplitForEdit() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var goalTitle, res, json, key, drafts, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        setEditAiError(null);
                        setEditAiDrafts([]);
                        goalTitle = ((_a = goals.find(function (g) { return g.id === editGoalId; })) === null || _a === void 0 ? void 0 : _a.title) || ((_b = action.goals) === null || _b === void 0 ? void 0 : _b.title) ||
                            editTitle.trim();
                        if (!editGoalId || !editTitle.trim()) {
                            setEditAiError(dict.common.errors.missing_fields);
                            return [2 /*return*/];
                        }
                        setEditAiLoading(true);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/ai/breakdown', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    goalTitle: goalTitle,
                                    goalDescription: editTitle.trim(),
                                    startDate: editStartDate,
                                    endDate: editEndDate,
                                    locale: locale
                                })
                            })];
                    case 2:
                        res = _d.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_d.sent());
                        if (!res.ok) {
                            key = json.error || 'operation_failed';
                            setEditAiError(commonErrors[key] || commonErrors.operation_failed);
                            return [2 /*return*/];
                        }
                        drafts = Array.isArray(json.actions) ? json.actions : [];
                        if (drafts.length === 0) {
                            setEditAiError(dict.common.errors.operation_failed);
                            return [2 /*return*/];
                        }
                        setEditAiDrafts(drafts.slice(0, 5));
                        return [3 /*break*/, 6];
                    case 4:
                        _c = _d.sent();
                        setEditAiError(dict.common.errors.operation_failed);
                        return [3 /*break*/, 6];
                    case 5:
                        setEditAiLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function applyEditAIDraft(draft) {
        var title = draft.title.trim();
        if (!title)
            return;
        setEditSubItems(function (prev) {
            if (prev.some(function (item) { return item.title.trim() === title; }))
                return prev;
            return __spreadArrays(prev, [{ title: title, completed: false }]);
        });
        setEditAiError(null);
    }
    function importAllEditAIDrafts() {
        if (editAiDrafts.length === 0)
            return;
        setEditSubItems(function (prev) {
            var existing = new Set(prev.map(function (item) { return item.title.trim(); }));
            var imported = editAiDrafts
                .map(function (draft) { return draft.title.trim(); })
                .filter(function (title) { return title && !existing.has(title); })
                .map(function (title) { return ({ title: title, completed: false }); });
            return __spreadArrays(prev, imported);
        });
    }
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };
    var getPriorityLabel = function (priority) {
        return dict.goals.priority[priority] || priority || dict.goals.priority.medium;
    };
    var endDateStr = action.end_date || action.start_date;
    var endDateVal = endDateStr.split('T')[0];
    var todayVal = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    var isOverdue = endDateVal < todayVal;
    var hasAIAdopted = Boolean(action.ai_recommendation_id || rescueOutcomeState === 'adopted');
    var aiAdoptedLabel = todayText.aiAdoptedLabel || 'AI 已采纳';
    var aiAdoptedHint = todayText.aiAdoptedHint || '该行动来自 AI 建议并已被采纳';
    var rescueReasonOptions = [
        { value: 'no_time', label: locale === 'zh' ? '没时间' : 'No time' },
        { value: 'too_hard', label: locale === 'zh' ? '太难' : 'Too hard' },
        { value: 'anxiety', label: locale === 'zh' ? '焦虑' : 'Anxiety' },
        { value: 'unclear_next', label: locale === 'zh' ? '不知道下一步' : 'Unclear next' },
        { value: 'low_energy', label: locale === 'zh' ? '没精力' : 'Low energy' },
        { value: 'other', label: locale === 'zh' ? '其他' : 'Other' },
    ];
    var metaBadges = (React.createElement("div", { className: "flex flex-wrap gap-2 text-xs text-muted-foreground" },
        hasAIAdopted ? (React.createElement("span", { title: aiAdoptedHint, className: "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 font-medium text-primary" },
            React.createElement(lucide_react_1.Sparkles, { className: "h-3.5 w-3.5" }),
            aiAdoptedLabel)) : null,
        React.createElement("span", { className: "capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50" }, dict.today.types[action.type] || action.type),
        React.createElement("span", { className: utils_1.cn("capitalize px-2 py-0.5 rounded-full font-medium border", getPriorityColor(action.priority)) }, getPriorityLabel(action.priority)),
        recurrenceMeta.recurrence !== 'none' ? (React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-medium text-primary" }, recurrenceLabelMap[recurrenceMeta.recurrence])) : null,
        React.createElement("span", { className: "font-mono text-[11px] opacity-80 flex items-center gap-1" },
            React.createElement(lucide_react_1.Calendar, { className: "h-3.5 w-3.5" }),
            date_fns_1.format(new Date(action.start_date), 'yyyy-MM-dd'),
            action.end_date && action.end_date !== action.start_date && " ~ " + date_fns_1.format(new Date(action.end_date), 'yyyy-MM-dd')),
        ((_c = action.goals) === null || _c === void 0 ? void 0 : _c.title) && !showGoalTitle && (React.createElement("span", { className: "flex items-center gap-1 opacity-80" },
            React.createElement("span", { className: "w-1 h-1 rounded-full bg-muted-foreground/50" }),
            action.goals.title))));
    var viewDescription = hasDescription ? (React.createElement("div", { className: "rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" },
        React.createElement(RichTextContentView_1.RichTextContentView, { html: displayDescription, onImageClick: setPreviewImageUrl }))) : parsedAITodayPlan ? null : (React.createElement("div", { className: "rounded-lg border border-border/50 bg-secondary/10 p-4 text-sm text-muted-foreground/70" }, dict.common.noDescription));
    var copyActions = (React.createElement("div", { className: "flex flex-wrap items-center gap-2" },
        React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: function () { return handleCopy('title'); }, className: "gap-1.5" },
            copiedMode === 'title' ? React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }) : React.createElement(lucide_react_1.Copy, { className: "h-4 w-4" }),
            copiedMode === 'title' ? copiedText : copyTitleText),
        React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: function () { return handleCopy('full'); }, className: "gap-1.5" },
            copiedMode === 'full' ? React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }) : React.createElement(lucide_react_1.Copy, { className: "h-4 w-4" }),
            copiedMode === 'full' ? copiedText : copyFullText)));
    var editForm = (React.createElement("form", { action: handleUpdate, className: "space-y-4" },
        React.createElement("input", { type: "hidden", name: "id", value: action.id }),
        React.createElement("input", { type: "hidden", name: "from_goal_id", value: action.goal_id }),
        React.createElement("input", { type: "hidden", name: "repeat_rule", value: editRepeatRule }),
        React.createElement("input", { type: "hidden", name: "sub_items", value: JSON.stringify(editSubItems
                .map(function (item, idx) { return ({
                id: item.id,
                title: item.title.trim(),
                completed: item.completed,
                sort_order: idx
            }); })
                .filter(function (item) { return item.title.length > 0; })) }),
        React.createElement("div", { className: "space-y-2" },
            React.createElement(input_1.Input, { name: "title", value: editTitle, onChange: function (e) { return setEditTitle(e.target.value); }, required: true, className: "bg-background/50 font-medium", placeholder: dict.today.actionTitlePlaceholder })),
        React.createElement("div", { className: "space-y-2" }, uploadUserId ? (React.createElement(ActionDescriptionEditor_1.ActionDescriptionEditor, { userId: uploadUserId, value: editDescription, onChange: setEditDescription, attachments: editAttachmentsDraft, onAttachmentsChange: setEditAttachmentsDraft, onUploadingChange: setEditDescriptionUploading, dict: dict })) : (React.createElement("div", { className: "text-xs text-muted-foreground" }, dict.common.loading))),
        goals.length > 0 ? (React.createElement("div", { className: "space-y-1" },
            React.createElement(label_1.Label, { htmlFor: "goal_id", className: "text-xs text-muted-foreground mb-1 block" }, dict.today.goalLabel),
            React.createElement(select_1.Select, { name: "goal_id", value: editGoalId, onValueChange: setEditGoalId },
                React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                    React.createElement(select_1.SelectValue, { placeholder: dict.today.goalLabel })),
                React.createElement(select_1.SelectContent, null, goals.map(function (goal) { return (React.createElement(select_1.SelectItem, { key: goal.id, value: goal.id }, goal.title)); }))))) : (React.createElement("input", { type: "hidden", name: "goal_id", value: action.goal_id })),
        React.createElement("div", { className: "grid grid-cols-2 gap-4" },
            React.createElement("div", { className: "space-y-1" },
                React.createElement(label_1.Label, { htmlFor: "type", className: "text-xs text-muted-foreground mb-1 block" }, dict.today.typeLabel),
                React.createElement(select_1.Select, { name: "type", value: editType, onValueChange: setEditType },
                    React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                        React.createElement(select_1.SelectValue, { placeholder: dict.today.typeLabel })),
                    React.createElement(select_1.SelectContent, null,
                        React.createElement(select_1.SelectItem, { value: "core" }, dict.today.types.core),
                        React.createElement(select_1.SelectItem, { value: "maintenance" }, dict.today.types.maintenance),
                        React.createElement(select_1.SelectItem, { value: "learning" }, dict.today.types.learning),
                        React.createElement(select_1.SelectItem, { value: "review" }, dict.today.types.review),
                        React.createElement(select_1.SelectItem, { value: "rest" }, dict.today.types.rest)))),
            React.createElement("div", { className: "space-y-1" },
                React.createElement(label_1.Label, { htmlFor: "priority", className: "text-xs text-muted-foreground mb-1 block" }, dict.today.priorityLabel),
                React.createElement(select_1.Select, { name: "priority", value: editPriority, onValueChange: setEditPriority },
                    React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                        React.createElement(select_1.SelectValue, { placeholder: dict.today.priorityLabel })),
                    React.createElement(select_1.SelectContent, null,
                        React.createElement(select_1.SelectItem, { value: "high" }, dict.goals.priority.high),
                        React.createElement(select_1.SelectItem, { value: "medium" }, dict.goals.priority.medium),
                        React.createElement(select_1.SelectItem, { value: "low" }, dict.goals.priority.low))))),
        React.createElement("div", { className: "space-y-2" },
            React.createElement(label_1.Label, { htmlFor: "repeat-rule-" + action.id }, todayText.repeatLabel || '重复规则'),
            React.createElement(select_1.Select, { value: editRepeatRule, onValueChange: function (value) { return setEditRepeatRule(value); } },
                React.createElement(select_1.SelectTrigger, { id: "repeat-rule-" + action.id, className: "w-full" },
                    React.createElement(select_1.SelectValue, { placeholder: todayText.repeatLabel || '重复规则' })),
                React.createElement(select_1.SelectContent, null,
                    React.createElement(select_1.SelectItem, { value: "none" }, todayText.repeatNone || '不重复'),
                    React.createElement(select_1.SelectItem, { value: "daily" }, todayText.repeatDaily || '每天'),
                    React.createElement(select_1.SelectItem, { value: "weekly" }, todayText.repeatWeekly || '每周'),
                    React.createElement(select_1.SelectItem, { value: "monthly" }, todayText.repeatMonthly || '每月')))),
        React.createElement("div", { className: "space-y-1" },
            React.createElement(DateRangeFields_1.DateRangeFields, { defaultStart: editStartDate, defaultEnd: editEndDate, valueStart: editStartDate, valueEnd: editEndDate, onChange: function (_a) {
                    var start = _a.start, end = _a.end;
                    setEditStartDate(start);
                    setEditEndDate(end);
                }, labels: { start: dict.today.startTime, end: dict.today.endTime, error: dict.common.dateRangeInvalid }, onValidityChange: setDateRangeValid, className: "grid-cols-2" })),
        React.createElement("div", { className: "space-y-2" },
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement(label_1.Label, { className: "text-xs text-muted-foreground" }, todayText.subItemsLabel || '子行动'),
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: handleAISplitForEdit, disabled: editAiLoading || !editTitle.trim() || !editGoalId }, editAiLoading ? dict.common.loading : dict.goals["new"].aiSplitButton),
                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: function () {
                            return setEditSubItems(function (prev) { return __spreadArrays(prev, [
                                { title: '', completed: false }
                            ]); });
                        } }, goalNewText.subItemsAdd || '新增子行动'))),
            editAiError ? React.createElement("div", { className: "text-xs text-destructive" }, editAiError) : null,
            editSubItems.length === 0 ? (React.createElement("div", { className: "text-xs text-muted-foreground" }, goalNewText.subItemsEmptyHint || '可手动添加子行动')) : (React.createElement("div", { className: "space-y-2" }, editSubItems.map(function (item, idx) { return (React.createElement("div", { key: item.id || "draft-" + idx, className: "flex items-center gap-2" },
                React.createElement("button", { type: "button", className: "shrink-0", onClick: function () {
                        return setEditSubItems(function (prev) {
                            return prev.map(function (x, i) {
                                return i === idx
                                    ? __assign(__assign({}, x), { completed: !x.completed }) : x;
                            });
                        });
                    } }, item.completed ? (React.createElement(lucide_react_1.CheckCircle2, { className: "h-4 w-4 text-primary" })) : (React.createElement(lucide_react_1.Circle, { className: "h-4 w-4 text-muted-foreground" }))),
                React.createElement(input_1.Input, { value: item.title, onChange: function (e) {
                        return setEditSubItems(function (prev) {
                            return prev.map(function (x, i) {
                                return i === idx
                                    ? __assign(__assign({}, x), { title: e.target.value }) : x;
                            });
                        });
                    }, placeholder: (goalNewText.subItemsPlaceholder || '子行动') + " " + (idx + 1) }),
                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", onClick: function () {
                        return setEditSubItems(function (prev) {
                            return prev.filter(function (_, i) { return i !== idx; });
                        });
                    } }, dict.common["delete"] || '删除'))); }))),
            editAiDrafts.length > 0 ? (React.createElement("div", { className: "space-y-2 rounded-md border border-border/60 bg-muted/20 p-3" },
                React.createElement("div", { className: "flex items-center justify-between gap-2" },
                    React.createElement("div", { className: "text-sm font-medium" }, dict.goals["new"].aiSuggestionsTitle),
                    React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: importAllEditAIDrafts }, goalNewText.aiImportSubItems || '全部导入为子行动')),
                React.createElement("div", { className: "space-y-2" }, editAiDrafts.map(function (draft, idx) { return (React.createElement("button", { key: draft.title + "-" + idx, type: "button", onClick: function () { return applyEditAIDraft(draft); }, className: "w-full rounded-md border border-border/60 bg-background/70 p-2 text-left hover:bg-muted/40 transition-colors" },
                    React.createElement("div", { className: "text-sm font-medium" }, draft.title),
                    draft.description ? (React.createElement("div", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground" }, draft.description)) : null,
                    React.createElement("div", { className: "mt-1 text-[11px] text-primary" }, goalNewText.aiImportOneSubItem || '点击导入为子行动'))); })))) : null),
        editDescriptionUploading ? (React.createElement("div", { className: "text-xs text-muted-foreground" }, goalNewText.wait_upload_complete || '图片上传中，请稍后提交。')) : null,
        React.createElement("div", { className: "flex justify-end gap-2 pt-2" },
            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", onClick: function () { return requestExitEdit('switch_to_view'); }, disabled: isLoading },
                React.createElement(lucide_react_1.X, { className: "h-4 w-4 mr-1" }),
                dict.common.cancel),
            React.createElement(SubmitButton_1.SubmitButton, { size: "sm", disabled: !dateRangeValid || editDescriptionUploading },
                React.createElement(lucide_react_1.Save, { className: "h-4 w-4 mr-1" }),
                dict.common.save))));
    return (React.createElement("div", { className: utils_1.cn("group relative overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 md:hover:shadow-sm md:hover:border-primary/20 md:hover:bg-muted/10", isNew && "border-primary/40 bg-primary/4") },
        React.createElement("div", { className: "absolute inset-y-0 right-0 z-0 w-32 md:hidden" },
            React.createElement("div", { className: "flex h-full w-full items-stretch" },
                React.createElement("button", { type: "button", onClick: openEditPanel, className: "w-1/2 bg-primary/10 text-primary flex items-center justify-center" },
                    React.createElement(lucide_react_1.Pencil, { className: "h-5 w-5" })),
                React.createElement("button", { type: "button", onClick: function () { closeSwipe(); setDeleteDialogOpen(true); }, className: "w-1/2 bg-destructive/10 text-destructive flex items-center justify-center" },
                    React.createElement(lucide_react_1.Trash2, { className: "h-5 w-5" })))),
        React.createElement(framer_motion_1.motion.div, { initial: { x: 0 }, animate: controls, drag: swipeEnabled ? 'x' : false, dragConstraints: { left: -128, right: 0 }, dragElastic: 0.06, dragMomentum: false, onDragEnd: swipeEnabled ? handleDragEnd : undefined, style: swipeEnabled ? { touchAction: 'pan-y' } : undefined, className: utils_1.cn("relative z-10 flex flex-col bg-card p-4", swipeEnabled && "cursor-grab active:cursor-grabbing") },
            React.createElement("div", { className: "flex items-start justify-between gap-4" },
                React.createElement("div", { className: "flex items-start gap-4 flex-1 min-w-0" },
                    React.createElement("form", { action: actions_1.toggleAction, className: "mt-1" },
                        React.createElement("input", { type: "hidden", name: "id", value: action.id }),
                        React.createElement("input", { type: "hidden", name: "completed", value: action.completed ? 'true' : 'false' }),
                        React.createElement(CompleteButton, { completed: action.completed, type: action.type })),
                    React.createElement("button", { type: "button", onClick: openDetails, disabled: !hasDetails, className: utils_1.cn("flex-1 min-w-0 text-left rounded-lg -m-2 p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", hasDetails ? "active:bg-muted/40" : "cursor-default"), "aria-disabled": !hasDetails },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement("p", { className: "font-medium text-sm wrap-break-word " + (action.completed ? 'line-through text-muted-foreground' : 'text-foreground') }, action.title),
                            hasDetails ? (React.createElement(lucide_react_1.ChevronRight, { className: "md:hidden h-4 w-4 text-muted-foreground/70 mt-0.5 shrink-0" })) : null),
                        React.createElement("div", { className: "mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground items-center" },
                            isNew && (React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/30" }, newBadgeText)),
                            hasAIAdopted && (React.createElement("span", { title: aiAdoptedHint, className: "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 font-medium text-primary" },
                                React.createElement(lucide_react_1.Sparkles, { className: "h-3 w-3" }),
                                aiAdoptedLabel)),
                            isOverdue && (React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium border border-red-500/20" }, dict.today.delayed)),
                            React.createElement("span", { className: "capitalize px-2 py-0.5 rounded-full bg-secondary/50 font-medium text-secondary-foreground border border-border/50" }, dict.today.types[action.type] || action.type),
                            React.createElement("span", { className: utils_1.cn("capitalize px-2 py-0.5 rounded-full font-medium border", getPriorityColor(action.priority)) }, getPriorityLabel(action.priority)),
                            recurrenceMeta.recurrence !== 'none' ? (React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/6 px-2 py-0.5 font-medium text-primary" }, recurrenceLabelMap[recurrenceMeta.recurrence])) : null,
                            React.createElement("span", { className: "font-mono text-[10px] opacity-70 flex items-center gap-1" },
                                React.createElement(lucide_react_1.Calendar, { className: "h-3 w-3" }),
                                date_fns_1.format(new Date(action.start_date), 'MM-dd'),
                                action.end_date && action.end_date !== action.start_date && " ~ " + date_fns_1.format(new Date(action.end_date), 'MM-dd')),
                            ((_d = action.goals) === null || _d === void 0 ? void 0 : _d.title) && showGoalTitle && (React.createElement("span", { className: "flex items-center gap-1 opacity-70" },
                                React.createElement("span", { className: "w-1 h-1 rounded-full bg-muted-foreground/50" }),
                                action.goals.title))),
                        displayDescription ? (React.createElement("div", { className: "mt-3 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground" },
                            React.createElement("div", { className: "mb-1 font-medium opacity-70" }, dict.today.descriptionLabel),
                            React.createElement(RichTextContentView_1.RichTextContentView, { html: displayDescription, compact: true }))) : null)),
                React.createElement("div", { className: "hidden md:flex items-center gap-1 shrink-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-200" },
                    React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", onClick: openEditPanel, className: "h-9 w-9 lg:h-8 lg:w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors", disabled: isLoading },
                        React.createElement(lucide_react_1.Pencil, { className: "h-4 w-4 lg:h-3.5 lg:w-3.5" }),
                        React.createElement("span", { className: "sr-only" }, dict.common.edit)),
                    React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", onClick: function () { closeSwipe(); setDeleteDialogOpen(true); }, className: "h-9 w-9 lg:h-8 lg:w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors", disabled: isLoading || isDeleting },
                        React.createElement(lucide_react_1.Trash2, { className: "h-4 w-4 lg:h-3.5 lg:w-3.5" }),
                        React.createElement("span", { className: "sr-only" }, dict.common["delete"] || '删除')))),
            subItems.length > 0 ? (React.createElement("div", { className: "mt-2 ml-11 rounded-md border border-border/40 bg-secondary/15 p-2" },
                React.createElement("button", { type: "button", className: "flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:bg-background/60", onClick: function () { return setSubItemsOpen(function (prev) { return !prev; }); } },
                    React.createElement("span", { className: "font-medium" },
                        todayText.subItemsLabel || '子行动',
                        " ",
                        subItemsCompletedCount,
                        "/",
                        subItems.length),
                    React.createElement("span", { className: "inline-flex items-center gap-1" },
                        subItemsOpen ? dict.common.showLess : dict.common.showMore,
                        subItemsOpen ? React.createElement(lucide_react_1.ChevronDown, { className: "h-3.5 w-3.5" }) : React.createElement(lucide_react_1.ChevronRight, { className: "h-3.5 w-3.5" }))),
                subItemsOpen ? (React.createElement("div", { className: "mt-2 space-y-1" }, subItems.map(function (item) { return (React.createElement("button", { key: item.id, type: "button", className: "flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-background/50", onClick: function () { return onToggleSubItem(item.id, item.completed); }, disabled: subItemBusyId === item.id },
                    item.completed ? (React.createElement(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5 text-primary" })) : (React.createElement(lucide_react_1.Circle, { className: "h-3.5 w-3.5 text-muted-foreground" })),
                    React.createElement("span", { className: item.completed ? 'line-through text-muted-foreground' : 'text-foreground' }, item.title))); }))) : null)) : null),
        isDesktop ? (React.createElement(dialog_1.Dialog, { open: detailsOpen, onOpenChange: handlePanelOpenChange },
            React.createElement(dialog_1.DialogFormContent, { mobileMode: isPanelFullscreen ? 'fullscreen' : 'sheet', hideCloseButton: true, className: utils_1.cn(isPanelFullscreen
                    ? 'overflow-hidden p-0 sm:p-0'
                    : 'max-w-lg overflow-hidden p-0 sm:p-0') },
                React.createElement("div", { className: utils_1.cn('flex min-h-0 flex-col', isPanelFullscreen ? 'h-full' : 'max-h-[85vh]') },
                    React.createElement(dialog_1.DialogHeader, { className: "px-4 pt-4 text-left sm:px-6 sm:pt-6" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement(dialog_1.DialogTitle, { className: "min-w-0 flex-1 text-left leading-snug" }, panelMode === 'edit' ? dict.common.edit : (panelMode === 'rescue' ? rescueTitleText : action.title)),
                            React.createElement("div", { className: "flex shrink-0 items-center gap-1" },
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground", onClick: function () { return setIsPanelFullscreen(function (value) { return !value; }); } },
                                    isPanelFullscreen ? React.createElement(lucide_react_1.Minimize2, { className: "h-4 w-4" }) : React.createElement(lucide_react_1.Maximize2, { className: "h-4 w-4" }),
                                    React.createElement("span", { className: "sr-only" }, isPanelFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen)),
                                React.createElement(dialog_1.DialogClose, { asChild: true },
                                    React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" },
                                        React.createElement(lucide_react_1.X, { className: "h-4 w-4" }),
                                        React.createElement("span", { className: "sr-only" }, "Close")))))),
                    React.createElement("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-6" }, panelMode === 'edit' ? (React.createElement("div", { className: utils_1.cn(isPanelFullscreen && 'pr-1') }, editForm)) : panelMode === 'rescue' ? (React.createElement("div", { className: utils_1.cn('space-y-4', isPanelFullscreen && 'pr-1') }, !goalTitle ? (React.createElement("div", { className: "text-sm text-muted-foreground" }, dict.common.errors.operation_failed)) : (React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement("div", { className: "text-sm font-medium" }, locale === 'zh' ? '原因' : 'Reason'),
                            React.createElement(select_1.Select, { value: rescueReason, onValueChange: function (value) { return setRescueReason(value); }, disabled: rescueLoading },
                                React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                                    React.createElement(select_1.SelectValue, { placeholder: locale === 'zh' ? '选择原因' : 'Select reason' })),
                                React.createElement(select_1.SelectContent, null, rescueReasonOptions.map(function (option) { return (React.createElement(select_1.SelectItem, { key: option.value, value: option.value }, option.label)); }))),
                            React.createElement(button_1.Button, { type: "button", onClick: generateRescue, disabled: rescueLoading },
                                rescueLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
                                locale === 'zh' ? '生成 5 分钟版本' : 'Generate 5-min version'),
                            rescueError && React.createElement("div", { className: "text-sm text-destructive" }, rescueError)),
                        rescueResult ? (React.createElement("div", { className: "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4" },
                            React.createElement("div", { className: "text-sm font-medium" }, rescueResult.minimal_variant.title),
                            React.createElement("div", { className: "text-sm text-muted-foreground" },
                                React.createElement("div", null,
                                    locale === 'zh' ? '第一步：' : 'First step: ',
                                    rescueResult.minimal_variant.first_step),
                                React.createElement("div", null,
                                    locale === 'zh' ? '完成定义：' : 'DoD: ',
                                    rescueResult.minimal_variant.definition_of_done),
                                React.createElement("div", null,
                                    locale === 'zh' ? 'If-Then：如果' : 'If-Then: if ',
                                    rescueResult.if_then["if"],
                                    locale === 'zh' ? '那么' : ' then ',
                                    rescueResult.if_then.then)),
                            React.createElement("div", { className: "flex justify-end gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: function () { return setPanelMode('view'); }, disabled: rescueLoading }, dict.common.back || 'Back'),
                                React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: applyRescueAdd, disabled: rescueLoading }, locale === 'zh' ? '新增最小行动' : 'Add minimal'),
                                React.createElement(button_1.Button, { type: "button", size: "sm", onClick: applyRescueReplace, disabled: rescueLoading }, locale === 'zh' ? '替换当前行动' : 'Replace')))) : null)))) : (React.createElement("div", { className: utils_1.cn('space-y-4', isPanelFullscreen && 'pr-1') },
                        metaBadges,
                        copyActions,
                        aiPlanInsightCard,
                        viewDescription,
                        React.createElement("div", { className: "flex justify-end gap-2" },
                            React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30", onClick: function () { return setDeleteDialogOpen(true); }, disabled: isDeleting }, dict.common["delete"]),
                            action.type === 'core' && !action.completed && goalTitle ? (React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: openRescuePanel, disabled: isLoading }, rescueTitleText)) : null,
                            React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", onClick: openEditPanel, disabled: isLoading }, dict.common.edit))))))))) : (React.createElement(sheet_1.Sheet, { open: detailsOpen, onOpenChange: handlePanelOpenChange },
            React.createElement(sheet_1.SheetFormContent, { side: "bottom", mobileMode: isPanelFullscreen ? 'fullscreen' : 'sheet', className: utils_1.cn(isPanelFullscreen
                    ? 'overflow-hidden p-0'
                    : panelMode === 'edit'
                        ? 'overflow-hidden p-0'
                        : 'max-h-[85vh] overflow-hidden rounded-t-2xl p-0') },
                React.createElement("div", { className: utils_1.cn('flex min-h-0 flex-col', isPanelFullscreen ? 'h-full' : 'max-h-[85vh]') },
                    React.createElement(sheet_1.SheetHeader, { className: "px-4 pt-4 text-left" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3" },
                            React.createElement(sheet_1.SheetTitle, { className: "block min-w-0 flex-1 text-left text-base leading-snug" }, panelMode === 'edit' ? dict.common.edit : (panelMode === 'rescue' ? rescueTitleText : action.title)),
                            React.createElement("div", { className: "flex shrink-0 items-center gap-1" },
                                React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground", onClick: function () { return setIsPanelFullscreen(function (value) { return !value; }); } },
                                    isPanelFullscreen ? React.createElement(lucide_react_1.Minimize2, { className: "h-4 w-4" }) : React.createElement(lucide_react_1.Maximize2, { className: "h-4 w-4" }),
                                    React.createElement("span", { className: "sr-only" }, isPanelFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen)),
                                React.createElement(sheet_1.SheetClose, { asChild: true },
                                    React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full shrink-0" },
                                        React.createElement(lucide_react_1.X, { className: "h-4 w-4" }),
                                        React.createElement("span", { className: "sr-only" }, "Close")))))),
                    React.createElement("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4" }, panelMode === 'edit' ? (editForm) : panelMode === 'rescue' ? (React.createElement("div", { className: "space-y-4" }, !goalTitle ? (React.createElement("div", { className: "text-sm text-muted-foreground" }, dict.common.errors.operation_failed)) : (React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement("div", { className: "text-sm font-medium" }, locale === 'zh' ? '原因' : 'Reason'),
                            React.createElement(select_1.Select, { value: rescueReason, onValueChange: function (value) { return setRescueReason(value); }, disabled: rescueLoading },
                                React.createElement(select_1.SelectTrigger, { className: "bg-background/50" },
                                    React.createElement(select_1.SelectValue, { placeholder: locale === 'zh' ? '选择原因' : 'Select reason' })),
                                React.createElement(select_1.SelectContent, null, rescueReasonOptions.map(function (option) { return (React.createElement(select_1.SelectItem, { key: option.value, value: option.value }, option.label)); }))),
                            React.createElement(button_1.Button, { type: "button", onClick: generateRescue, disabled: rescueLoading },
                                rescueLoading && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-primary-foreground/80" }),
                                locale === 'zh' ? '生成 5 分钟版本' : 'Generate 5-min version'),
                            rescueError && React.createElement("div", { className: "text-sm text-destructive" }, rescueError)),
                        rescueResult ? (React.createElement("div", { className: "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4" },
                            React.createElement("div", { className: "text-sm font-medium" }, rescueResult.minimal_variant.title),
                            React.createElement("div", { className: "text-sm text-muted-foreground" },
                                React.createElement("div", null,
                                    locale === 'zh' ? '第一步：' : 'First step: ',
                                    rescueResult.minimal_variant.first_step),
                                React.createElement("div", null,
                                    locale === 'zh' ? '完成定义：' : 'DoD: ',
                                    rescueResult.minimal_variant.definition_of_done),
                                React.createElement("div", null,
                                    locale === 'zh' ? 'If-Then：如果' : 'If-Then: if ',
                                    rescueResult.if_then["if"],
                                    locale === 'zh' ? '那么' : ' then ',
                                    rescueResult.if_then.then)),
                            React.createElement("div", { className: "flex items-center justify-between gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "flex-1", onClick: function () { return setPanelMode('view'); }, disabled: rescueLoading }, dict.common.back || 'Back'),
                                React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "flex-1", onClick: applyRescueAdd, disabled: rescueLoading }, locale === 'zh' ? '新增' : 'Add'),
                                React.createElement(button_1.Button, { type: "button", size: "sm", className: "flex-1", onClick: applyRescueReplace, disabled: rescueLoading }, locale === 'zh' ? '替换' : 'Replace')))) : null)))) : (React.createElement("div", { className: "space-y-4" },
                        metaBadges,
                        copyActions,
                        aiPlanInsightCard,
                        viewDescription,
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "flex-1 border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30", onClick: function () { return setDeleteDialogOpen(true); }, disabled: isDeleting }, dict.common["delete"]),
                            action.type === 'core' && !action.completed && goalTitle ? (React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "flex-1", onClick: openRescuePanel, disabled: isLoading }, rescueTitleText)) : null,
                            React.createElement(button_1.Button, { type: "button", variant: "outline", size: "sm", className: "flex-1", onClick: openEditPanel, disabled: isLoading }, dict.common.edit))))))))),
        React.createElement(RichTextImagePreviewDialog_1.RichTextImagePreviewDialog, { open: Boolean(previewImageUrl), imageUrl: previewImageUrl, title: dict.common.imagePreviewTitle, openOriginalLabel: dict.common.openOriginal, onOpenChange: function (open) {
                if (!open)
                    setPreviewImageUrl(null);
            } }),
        React.createElement(alert_dialog_1.AlertDialog, { open: discardDialogOpen, onOpenChange: setDiscardDialogOpen },
            React.createElement(alert_dialog_1.AlertDialogContent, null,
                React.createElement(alert_dialog_1.AlertDialogHeader, null,
                    React.createElement(alert_dialog_1.AlertDialogTitle, null, locale === 'zh' ? '放弃未保存修改？' : 'Discard unsaved changes?'),
                    React.createElement(alert_dialog_1.AlertDialogDescription, null, unsavedConfirmText)),
                React.createElement(alert_dialog_1.AlertDialogFooter, null,
                    React.createElement(alert_dialog_1.AlertDialogCancel, null, locale === 'zh' ? '继续编辑' : 'Keep editing'),
                    React.createElement(alert_dialog_1.AlertDialogAction, { onClick: function (e) {
                            e.preventDefault();
                            confirmDiscardAndProceed();
                        }, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" }, locale === 'zh' ? '放弃修改' : 'Discard changes')))),
        React.createElement(alert_dialog_1.AlertDialog, { open: deleteDialogOpen, onOpenChange: function (open) {
                setDeleteDialogOpen(open);
                if (!open)
                    closeSwipe();
            } },
            React.createElement(alert_dialog_1.AlertDialogContent, null,
                React.createElement(alert_dialog_1.AlertDialogHeader, null,
                    React.createElement(alert_dialog_1.AlertDialogTitle, null,
                        dict.common["delete"],
                        " ",
                        action.title,
                        "?"),
                    React.createElement(alert_dialog_1.AlertDialogDescription, null, dict.common.confirmDelete)),
                React.createElement(alert_dialog_1.AlertDialogFooter, null,
                    React.createElement(alert_dialog_1.AlertDialogCancel, { disabled: isDeleting }, dict.common.cancel),
                    React.createElement(alert_dialog_1.AlertDialogAction, { onClick: function (e) {
                            e.preventDefault();
                            handleDelete();
                        }, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", disabled: isDeleting },
                        isDeleting && React.createElement(loading_spinner_1.LoadingSpinner, { size: 16, className: "mr-2 text-current" }),
                        dict.common["delete"] || '删除'))))));
}
exports.ActionItem = ActionItem;
