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
exports.MobileSidebar = void 0;
var react_1 = require("react");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var lucide_react_1 = require("lucide-react");
var navigation_2 = require("next/navigation");
var client_1 = require("@/lib/supabase/client");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var sheet_1 = require("@/components/ui/sheet");
function MobileSidebar(_a) {
    var _this = this;
    var dict = _a.dict;
    var _b = react_1.useState(false), open = _b[0], setOpen = _b[1];
    var _c = react_1.useState(false), signOutOpen = _c[0], setSignOutOpen = _c[1];
    var _d = react_1.useState(false), isSigningOut = _d[0], setIsSigningOut = _d[1];
    var pathname = navigation_1.usePathname();
    var router = navigation_2.useRouter();
    var supabase = client_1.createClient();
    var sidebarItems = [
        {
            title: dict.sidebar.dashboard,
            href: '/dashboard',
            icon: lucide_react_1.LayoutDashboard
        },
        {
            title: dict.sidebar.today,
            href: '/today',
            icon: lucide_react_1.CalendarCheck
        },
        {
            title: dict.sidebar.goals,
            href: '/goals',
            icon: lucide_react_1.Target
        },
        {
            title: dict.sidebar.profile,
            href: '/profile',
            icon: lucide_react_1.User
        },
    ];
    var handleSignOut = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSigningOut(true);
                    return [4 /*yield*/, supabase.auth.signOut()];
                case 1:
                    _a.sent();
                    router.refresh();
                    router.push('/login');
                    return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement(sheet_1.Sheet, { open: open, onOpenChange: setOpen },
        React.createElement(sheet_1.SheetTrigger, { asChild: true },
            React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "md:hidden -ml-2" },
                React.createElement(lucide_react_1.Menu, { className: "h-6 w-6" }),
                React.createElement("span", { className: "sr-only" }, "Toggle Menu"))),
        React.createElement(sheet_1.SheetContent, { side: "left", className: "w-[240px] sm:w-[300px] p-0 flex flex-col" },
            React.createElement(sheet_1.SheetTitle, { className: "sr-only" }, dict.sidebar.brand),
            React.createElement("div", { className: "flex h-16 items-center border-b px-6" },
                React.createElement(link_1["default"], { href: "/", className: "flex items-center gap-2 font-bold text-lg tracking-tight text-primary", onClick: function () { return setOpen(false); } },
                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "36", height: "36", viewBox: "0 0 36 36", fill: "none" },
                        React.createElement("rect", { x: "0.5", y: "0.5", width: "35", height: "35", rx: "11.5", fill: "rgba(5,148,103,0.1)", stroke: "rgba(5,148,103,0.2)", strokeWidth: "1" }),
                        React.createElement("svg", { x: "8", y: "8", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "#059467", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                            React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                            React.createElement("path", { d: "m14.31 8 5.74 9.94" }),
                            React.createElement("path", { d: "M9.69 8h11.48" }),
                            React.createElement("path", { d: "m7.38 12 5.74-9.94" }),
                            React.createElement("path", { d: "M9.69 16 3.95 6.06" }),
                            React.createElement("path", { d: "M14.31 16H2.83" }),
                            React.createElement("path", { d: "m16.62 12-5.74 9.94" }))),
                    React.createElement("span", null, dict.sidebar.brand))),
            React.createElement("div", { className: "flex-1 overflow-y-auto py-4" },
                React.createElement("nav", { className: "grid gap-2 px-2 text-base font-medium" }, sidebarItems.map(function (item, index) {
                    var isActive = pathname.startsWith(item.href);
                    return (React.createElement(link_1["default"], { key: index, href: item.href, onClick: function () { return setOpen(false); }, className: utils_1.cn("flex items-center gap-4 rounded-md px-3 py-3.5 transition-all", isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground") },
                        React.createElement(item.icon, { className: "h-6 w-6", strokeWidth: 1.5 }),
                        item.title));
                }))),
            React.createElement("div", { className: "border-t p-4" },
                React.createElement(alert_dialog_1.AlertDialog, { open: signOutOpen, onOpenChange: setSignOutOpen },
                    React.createElement(alert_dialog_1.AlertDialogTrigger, { asChild: true },
                        React.createElement(button_1.Button, { variant: "ghost", className: "w-full justify-start gap-4 px-3 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground h-auto", disabled: isSigningOut },
                            isSigningOut ? (React.createElement(lucide_react_1.Loader2, { className: "h-6 w-6 animate-spin" })) : (React.createElement(lucide_react_1.LogOut, { className: "h-6 w-6" })),
                            dict.sidebar.signOut)),
                    React.createElement(alert_dialog_1.AlertDialogContent, { className: "max-w-lg" },
                        React.createElement("button", { type: "button", "aria-label": dict.common.cancel, className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", onClick: function () { return setSignOutOpen(false); } },
                            React.createElement(lucide_react_1.X, { className: "h-4 w-4" })),
                        React.createElement(alert_dialog_1.AlertDialogHeader, null,
                            React.createElement(alert_dialog_1.AlertDialogTitle, null, dict.common.signOutConfirmTitle),
                            React.createElement(alert_dialog_1.AlertDialogDescription, null, dict.common.signOutConfirmDesc)),
                        React.createElement(alert_dialog_1.AlertDialogFooter, null,
                            React.createElement(alert_dialog_1.AlertDialogCancel, { disabled: isSigningOut }, dict.common.cancel),
                            React.createElement(alert_dialog_1.AlertDialogAction, { onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                setSignOutOpen(false);
                                                setOpen(false);
                                                return [4 /*yield*/, handleSignOut()];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", disabled: isSigningOut },
                                isSigningOut && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                                dict.sidebar.signOut))))))));
}
exports.MobileSidebar = MobileSidebar;
