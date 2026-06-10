'use client';
"use strict";
exports.__esModule = true;
exports.BasicRichTextEditor = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var utils_1 = require("@/lib/utils");
function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
function toEditableHtml(value) {
    var trimmed = value.trim();
    if (!trimmed)
        return '';
    var looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
    if (looksLikeHtml)
        return value;
    return trimmed
        .split(/\n{2,}/g)
        .map(function (block) { return "<p>" + escapeHtml(block).replaceAll('\n', '<br/>') + "</p>"; })
        .join('');
}
exports.BasicRichTextEditor = react_1.forwardRef(function BasicRichTextEditor(_a, forwardedRef) {
    var id = _a.id, name = _a.name, value = _a.value, onChange = _a.onChange, placeholder = _a.placeholder, className = _a.className, minHeightClassName = _a.minHeightClassName;
    var editorRef = react_1.useRef(null);
    var hiddenInputRef = react_1.useRef(null);
    var isComposingRef = react_1.useRef(false);
    var isInternalSyncRef = react_1.useRef(false);
    var normalizedValue = react_1.useMemo(function () { return toEditableHtml(value); }, [value]);
    var handleEditorRef = react_1.useCallback(function (node) {
        editorRef.current = node;
        if (typeof forwardedRef === 'function') {
            forwardedRef(node);
            return;
        }
        if (forwardedRef) {
            forwardedRef.current = node;
        }
    }, [forwardedRef]);
    var syncValue = react_1.useCallback(function (next) {
        isInternalSyncRef.current = true;
        if (hiddenInputRef.current) {
            hiddenInputRef.current.value = next;
        }
        onChange(next);
    }, [onChange]);
    react_1.useEffect(function () {
        if (isInternalSyncRef.current) {
            isInternalSyncRef.current = false;
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = value;
            }
            return;
        }
        var editor = editorRef.current;
        if (!editor) {
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = normalizedValue;
            }
            return;
        }
        if (isComposingRef.current)
            return;
        if (editor.innerHTML !== normalizedValue) {
            editor.innerHTML = normalizedValue;
        }
    }, [normalizedValue, value]);
    var applyCommand = function (command) {
        var editor = editorRef.current;
        if (!editor || typeof document === 'undefined')
            return;
        editor.focus();
        document.execCommand(command, false);
        syncValue(editor.innerHTML);
    };
    return (React.createElement("div", { className: utils_1.cn('grid gap-2', className) },
        React.createElement("input", { ref: hiddenInputRef, type: "hidden", name: name, defaultValue: normalizedValue }),
        React.createElement("div", { className: "flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2" },
            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 px-2.5", "aria-label": "Bold", onClick: function () { return applyCommand('bold'); } },
                React.createElement(lucide_react_1.Bold, { className: "h-4 w-4" })),
            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 px-2.5", "aria-label": "Italic", onClick: function () { return applyCommand('italic'); } },
                React.createElement(lucide_react_1.Italic, { className: "h-4 w-4" })),
            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 px-2.5", "aria-label": "Bullet list", onClick: function () { return applyCommand('insertUnorderedList'); } },
                React.createElement(lucide_react_1.List, { className: "h-4 w-4" })),
            React.createElement(button_1.Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 px-2.5", "aria-label": "Clear formatting", onClick: function () { return applyCommand('removeFormat'); } },
                React.createElement(lucide_react_1.Eraser, { className: "h-4 w-4" }))),
        React.createElement("div", { ref: handleEditorRef, id: id, contentEditable: true, suppressContentEditableWarning: true, className: utils_1.cn('rounded-xl border border-input bg-background px-3 py-3 text-sm leading-7 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground', 'prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0', minHeightClassName || 'min-h-[140px]'), "data-placeholder": placeholder, onInput: function (event) {
                if (isComposingRef.current)
                    return;
                syncValue(event.currentTarget.innerHTML);
            }, onCompositionStart: function () {
                isComposingRef.current = true;
            }, onCompositionEnd: function (event) {
                isComposingRef.current = false;
                syncValue(event.currentTarget.innerHTML);
            }, onBlur: function (event) {
                var _a;
                var editor = event.currentTarget;
                if ((_a = editor.textContent) === null || _a === void 0 ? void 0 : _a.trim()) {
                    syncValue(editor.innerHTML);
                    return;
                }
                editor.innerHTML = '';
                syncValue('');
            } })));
});
