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
exports.QuickCaptureDialog = void 0;
var react_1 = require("react");
var dialog_1 = require("@/components/ui/dialog");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var textarea_1 = require("@/components/ui/textarea");
var loading_spinner_1 = require("@/components/ui/loading-spinner");
var actions_1 = require("@/app/(authenticated)/inbox/actions");
var use_mobile_input_visible_1 = require("@/components/ui/use-mobile-input-visible");
var utils_1 = require("@/lib/utils");
var ModalHeaderActions_1 = require("@/components/ModalHeaderActions");
var ModalActionFooter_1 = require("@/components/ModalActionFooter");
var responsive_classes_1 = require("@/components/responsive-classes");
function QuickCaptureDialog(_a) {
    var dict = _a.dict, trigger = _a.trigger;
    var _b = react_1.useState(false), open = _b[0], setOpen = _b[1];
    var _c = react_1.useState(false), isDesktopFullscreen = _c[0], setIsDesktopFullscreen = _c[1];
    var _d = react_1.useState(false), expanded = _d[0], setExpanded = _d[1];
    var _e = react_1.useTransition(), isPending = _e[0], startTransition = _e[1];
    var _f = react_1.useState(null), error = _f[0], setError = _f[1];
    var contentRef = react_1.useRef(null);
    function handleOpenChange(nextOpen) {
        setOpen(nextOpen);
        if (!nextOpen) {
            setIsDesktopFullscreen(false);
            return;
        }
        setExpanded(false);
        setError(null);
    }
    use_mobile_input_visible_1.useMobileInputVisible(open, contentRef);
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
                                return [4 /*yield*/, actions_1.createInboxItem(formData)];
                            case 1:
                                _a.sent();
                                setOpen(false);
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
    var desktopDialogClassName = isDesktopFullscreen
        ? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
        : 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border!';
    return (React.createElement(dialog_1.Dialog, { open: open, onOpenChange: handleOpenChange },
        React.createElement(dialog_1.DialogTrigger, { asChild: true }, trigger),
        React.createElement(dialog_1.DialogFormContent, { mobileMode: "fullscreen", hideCloseButton: true, className: utils_1.cn('p-0', responsive_classes_1.DESKTOP_MODAL_SHELL_CLASS, desktopDialogClassName) },
            React.createElement("div", { className: utils_1.cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]') },
                React.createElement(dialog_1.DialogHeader, { className: "border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6" },
                    React.createElement("div", { className: "flex items-start justify-between gap-3" },
                        React.createElement(dialog_1.DialogTitle, { className: "min-w-0 flex-1 text-left leading-snug" }, dict.quickCapture.title),
                        React.createElement(ModalHeaderActions_1.ModalHeaderActions, { isFullscreen: isDesktopFullscreen, onToggleFullscreen: function () { return setIsDesktopFullscreen(function (value) { return !value; }); }, fullscreenLabel: dict.common.fullscreen, exitFullscreenLabel: dict.common.exitFullscreen, hideFullscreenOnMobile: true, renderCloseButton: function (button) { return React.createElement(dialog_1.DialogClose, { asChild: true }, button); } }))),
                React.createElement("form", { action: handleSubmit, className: "flex min-h-0 flex-1 flex-col" },
                    React.createElement("div", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6", style: { paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined } },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(label_1.Label, { htmlFor: "content", required: true }, dict.quickCapture.contentLabel),
                            React.createElement(input_1.Input, { ref: contentRef, id: "content", name: "content", placeholder: dict.quickCapture.contentPlaceholder, required: true })),
                        expanded ? (React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "note" }, dict.quickCapture.noteLabel),
                                React.createElement(textarea_1.Textarea, { id: "note", name: "note", rows: 5, placeholder: dict.quickCapture.notePlaceholder })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "tags" }, dict.quickCapture.tagsLabel),
                                React.createElement(input_1.Input, { id: "tags", name: "tags", placeholder: dict.quickCapture.tagsPlaceholder })))) : null,
                        error ? React.createElement("div", { className: "text-sm text-destructive" }, error) : null),
                    React.createElement(ModalActionFooter_1.ModalActionFooter, { insetBottom: open && keyboardInset > 0 ? "calc(env(safe-area-inset-bottom) + " + keyboardInset + "px)" : undefined },
                        React.createElement("div", { className: "flex items-center justify-between gap-2" },
                            React.createElement(button_1.Button, { type: "button", variant: "ghost", onClick: function () { return setExpanded(function (v) { return !v; }); }, disabled: isPending }, expanded ? dict.common.showLess : dict.common.showMore),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(button_1.Button, { type: "button", variant: "outline", onClick: function () { return setOpen(false); }, disabled: isPending }, dict.common.cancel),
                                React.createElement(button_1.Button, { type: "submit", disabled: isPending }, isPending ? (React.createElement(React.Fragment, null,
                                    React.createElement(loading_spinner_1.LoadingSpinner, { className: "mr-2 h-4 w-4" }),
                                    dict.common.saving)) : (dict.quickCapture.saveCta))))))))));
}
exports.QuickCaptureDialog = QuickCaptureDialog;
