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
exports.Sidebar = void 0;
var react_1 = require("react");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
var alert_dialog_1 = require("@/components/ui/alert-dialog");
var client_1 = require("@/lib/supabase/client");
var BrandLogo_1 = require("@/components/BrandLogo");
function Sidebar(_a) {
    var _this = this;
    var dict = _a.dict;
    var pathname = navigation_1.usePathname();
    var router = navigation_1.useRouter();
    var supabase = react_1.useMemo(function () { return client_1.createClient(); }, []);
    var _b = react_1.useState(false), isSigningOut = _b[0], setIsSigningOut = _b[1];
    var _c = react_1.useState(false), signOutOpen = _c[0], setSignOutOpen = _c[1];
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
            title: dict.sidebar.inbox,
            href: '/inbox',
            icon: lucide_react_1.Lightbulb
        },
        {
            title: dict.sidebar.potential,
            href: '/potential',
            icon: lucide_react_1.Sparkles
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
    return (React.createElement("div", { className: utils_1.cn('hidden h-full shrink-0 flex-col border-r border-border/60 bg-background/95 text-foreground backdrop-blur-xl md:flex md:w-[94px] xl:w-[102px] 2xl:w-[112px] [@media(min-width:1920px)]:w-[120px] [@media(min-width:2560px)]:w-[128px]') },
        React.createElement("div", { className: "flex h-16 items-center justify-center border-b border-border/50 px-1.5 xl:h-[68px] xl:px-2 2xl:h-[72px] [@media(min-width:1920px)]:h-[76px] [@media(min-width:2560px)]:h-20" },
            React.createElement(link_1["default"], { href: "/", className: "flex items-center justify-center rounded-xl p-1 text-primary transition-transform duration-200 hover:scale-[1.02] xl:p-1.5" },
                React.createElement("span", { className: "inline-flex scale-[1.18] items-center justify-center xl:scale-[1.22] 2xl:scale-[1.26] [@media(min-width:1920px)]:scale-[1.3] [@media(min-width:2560px)]:scale-[1.34]" },
                    React.createElement(BrandLogo_1.BrandMark, null)))),
        React.createElement("div", { className: "flex-1 overflow-y-auto overflow-x-hidden px-1 py-3 xl:px-1.5 xl:py-3.5 2xl:px-2 2xl:py-4 [@media(min-width:1920px)]:px-2.5" },
            React.createElement("nav", { className: "flex flex-col items-center gap-2 xl:gap-2.5 2xl:gap-3" }, sidebarItems.map(function (item) {
                var isActive = pathname.startsWith(item.href);
                return (React.createElement(link_1["default"], { key: item.href, href: item.href, prefetch: false, className: utils_1.cn('group flex w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-center transition-all duration-200 xl:max-w-[72px] xl:gap-2 xl:rounded-xl xl:px-1.5 xl:py-2.5 2xl:max-w-[78px] 2xl:gap-2.5 2xl:px-2 2xl:py-3 [@media(min-width:1920px)]:max-w-[84px] [@media(min-width:1920px)]:py-3.5 [@media(min-width:2560px)]:max-w-[88px]', isActive
                        ? 'bg-primary/8 text-primary ring-1 ring-primary/12'
                        : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'), "aria-current": isActive ? 'page' : undefined },
                    React.createElement(item.icon, { className: utils_1.cn('h-5 w-5 shrink-0 transition-all duration-200 xl:h-[22px] xl:w-[22px] 2xl:h-6 2xl:w-6 [@media(min-width:1920px)]:h-[26px] [@media(min-width:1920px)]:w-[26px] [@media(min-width:2560px)]:h-7 [@media(min-width:2560px)]:w-7', isActive ? 'scale-105 text-primary' : 'text-muted-foreground group-hover:scale-105 group-hover:text-foreground'), strokeWidth: isActive ? 2.1 : 1.85 }),
                    React.createElement("span", { className: utils_1.cn('line-clamp-2 text-[10px] font-medium leading-3.5 xl:text-[11px] xl:leading-4 2xl:text-[11.5px] 2xl:leading-[1.05rem] [@media(min-width:1920px)]:text-xs [@media(min-width:1920px)]:leading-[1.1rem]', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground') }, item.title)));
            }))),
        React.createElement("div", { className: "border-t border-border/50 px-1 py-3 xl:px-1.5 xl:py-3.5 2xl:px-2 2xl:py-4 [@media(min-width:1920px)]:px-2.5" },
            React.createElement(alert_dialog_1.AlertDialog, { open: signOutOpen, onOpenChange: setSignOutOpen },
                React.createElement(alert_dialog_1.AlertDialogTrigger, { asChild: true },
                    React.createElement(button_1.Button, { variant: "ghost", size: "sm", className: "mx-auto flex h-[54px] w-full max-w-[66px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-muted-foreground hover:bg-muted/55 hover:text-foreground xl:h-[60px] xl:max-w-[72px] xl:gap-2 xl:rounded-xl xl:px-1.5 2xl:h-[66px] 2xl:max-w-[78px] 2xl:gap-2.5 2xl:px-2 [@media(min-width:1920px)]:h-[72px] [@media(min-width:1920px)]:max-w-[84px] [@media(min-width:2560px)]:h-[76px] [@media(min-width:2560px)]:max-w-[88px]", disabled: isSigningOut, "aria-label": dict.sidebar.signOut },
                        isSigningOut ? (React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 shrink-0 animate-spin xl:h-[18px] xl:w-[18px] 2xl:h-5 2xl:w-5 [@media(min-width:1920px)]:h-[22px] [@media(min-width:1920px)]:w-[22px]" })) : (React.createElement(lucide_react_1.LogOut, { className: "h-4 w-4 shrink-0 xl:h-[18px] xl:w-[18px] 2xl:h-5 2xl:w-5 [@media(min-width:1920px)]:h-[22px] [@media(min-width:1920px)]:w-[22px]" })),
                        React.createElement("span", { className: "text-[10px] font-medium leading-3.5 xl:text-[11px] xl:leading-4 2xl:text-[11.5px] 2xl:leading-[1.05rem] [@media(min-width:1920px)]:text-xs [@media(min-width:1920px)]:leading-[1.1rem]" }, "\u9000\u51FA"))),
                React.createElement(alert_dialog_1.AlertDialogContent, { className: "max-w-lg" },
                    React.createElement("button", { type: "button", "aria-label": dict.common.cancel, className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", onClick: function () { return setSignOutOpen(false); } },
                        React.createElement(lucide_react_1.X, { className: "h-4 w-4" })),
                    React.createElement(alert_dialog_1.AlertDialogHeader, null,
                        React.createElement(alert_dialog_1.AlertDialogTitle, null, dict.common.signOutConfirmTitle),
                        React.createElement(alert_dialog_1.AlertDialogDescription, null, dict.common.signOutConfirmDesc)),
                    React.createElement(alert_dialog_1.AlertDialogFooter, null,
                        React.createElement(alert_dialog_1.AlertDialogCancel, { disabled: isSigningOut }, dict.common.cancel),
                        React.createElement(alert_dialog_1.AlertDialogAction, { onClick: handleSignOut, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", disabled: isSigningOut },
                            isSigningOut && React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                            dict.sidebar.signOut)))))));
}
exports.Sidebar = Sidebar;
