'use server';
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
exports.revokeGoalShareLink = exports.refreshGoalShareSnapshot = exports.createGoalShareLink = exports.replaceGoalCategory = exports.deleteGoal = exports.deleteAction = exports.updateAction = exports.updateGoal = exports.toggleActionSubItem = exports.createActionWithSubItems = exports.applyAITodayPlanToExistingAction = exports.createAction = exports.createActionAndReturnId = exports.createGoalModal = exports.toggleGoalStar = exports.updateGoalStatus = exports.createGoal = void 0;
var cache_1 = require("next/cache");
var navigation_1 = require("next/navigation");
var recommendationStore_1 = require("@/lib/ai/recommendationStore");
var aiTodayPlan_1 = require("@/lib/aiTodayPlan");
var server_1 = require("@/lib/supabase/server");
var goalCategories_1 = require("@/lib/goalCategories");
var snapshots_1 = require("@/lib/snapshots");
var actionRecurrence_1 = require("@/lib/actionRecurrence");
var ACTIVE_GOAL_LIMIT = 5;
function assertActiveGoalLimit(supabase, userId) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var _b, data, error, activeCount;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabase
                        .from('goals')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('status', 'active')];
                case 1:
                    _b = _c.sent(), data = _b.data, error = _b.error;
                    if (error)
                        throw new Error('operation_failed');
                    activeCount = (_a = data === null || data === void 0 ? void 0 : data.length) !== null && _a !== void 0 ? _a : 0;
                    if (activeCount >= ACTIVE_GOAL_LIMIT)
                        throw new Error('goal_limit_reached');
                    return [2 /*return*/];
            }
        });
    });
}
function parseSubItems(raw) {
    if (typeof raw !== 'string' || !raw.trim())
        return [];
    var parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error('invalid_json');
    }
    if (!Array.isArray(parsed))
        return [];
    var items = [];
    for (var _i = 0, _b = parsed.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], idx = _c[0], item = _c[1];
        if (!item || typeof item !== 'object')
            continue;
        var row = item;
        var title = typeof row.title === 'string' ? row.title.trim() : '';
        if (!title)
            continue;
        var sort_order = typeof row.sort_order === 'number' &&
            Number.isFinite(row.sort_order)
            ? Math.max(0, Math.round(row.sort_order))
            : idx;
        items.push({
            action_id: '',
            title: title,
            completed: false,
            sort_order: sort_order
        });
        if (items.length >= 20)
            break;
    }
    return items;
}
function parseSubItemsForUpdate(raw) {
    if (typeof raw !== 'string' || !raw.trim())
        return [];
    var parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error('invalid_json');
    }
    if (!Array.isArray(parsed))
        return [];
    var items = [];
    for (var _i = 0, _b = parsed.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], idx = _c[0], item = _c[1];
        if (!item || typeof item !== 'object')
            continue;
        var row = item;
        var title = typeof row.title === 'string' ? row.title.trim() : '';
        if (!title)
            continue;
        var sort_order = typeof row.sort_order === 'number' &&
            Number.isFinite(row.sort_order)
            ? Math.max(0, Math.round(row.sort_order))
            : idx;
        items.push({
            id: typeof row.id === 'string' ? row.id : undefined,
            title: title,
            completed: Boolean(row.completed),
            sort_order: sort_order
        });
        if (items.length >= 20)
            break;
    }
    return items;
}
function parseAttachmentManifest(raw) {
    if (typeof raw !== 'string' || !raw.trim())
        return [];
    var parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        throw new Error('invalid_json');
    }
    if (!Array.isArray(parsed))
        return [];
    var rows = [];
    for (var _i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
        var item = parsed_1[_i];
        if (!item || typeof item !== 'object')
            continue;
        var row = item;
        var file_path = typeof row.file_path === 'string' ? row.file_path.trim() : '';
        var public_url = typeof row.public_url === 'string' ? row.public_url.trim() : '';
        if (!file_path || !public_url)
            continue;
        rows.push({
            action_id: '',
            file_path: file_path,
            public_url: public_url,
            mime_type: typeof row.mime_type === 'string' ? row.mime_type : null,
            size_bytes: typeof row.size_bytes === 'number' &&
                Number.isFinite(row.size_bytes)
                ? Math.max(0, Math.round(row.size_bytes))
                : null,
            bucket: typeof row.bucket === 'string' && row.bucket.trim()
                ? row.bucket.trim()
                : 'action-images'
        });
        if (rows.length >= 12)
            break;
    }
    return rows;
}
function insertActionWithFallback(params) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, userId, payload, selectFields, runInsert, data, attempt1, columnMissing, attempt2, attempt3;
        var _this = this;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    supabase = params.supabase, userId = params.userId, payload = params.payload, selectFields = params.selectFields;
                    runInsert = function (insertPayload) { return __awaiter(_this, void 0, void 0, function () {
                        var query;
                        return __generator(this, function (_a) {
                            query = supabase.from('actions').insert(insertPayload);
                            if (selectFields)
                                return [2 /*return*/, query.select(selectFields).single()];
                            return [2 /*return*/, query];
                        });
                    }); };
                    data = null;
                    return [4 /*yield*/, runInsert(__assign(__assign({}, payload), { user_id: userId, owner_id: userId }))];
                case 1:
                    attempt1 = _e.sent();
                    if (!attempt1.error) {
                        data = (_a = attempt1.data) !== null && _a !== void 0 ? _a : null;
                        return [2 /*return*/, { data: data }];
                    }
                    columnMissing = attempt1.error.code === '42703' || ((_b = attempt1.error.message) === null || _b === void 0 ? void 0 : _b.includes('column'));
                    if (!columnMissing)
                        throw attempt1.error;
                    return [4 /*yield*/, runInsert(__assign(__assign({}, payload), { user_id: userId }))];
                case 2:
                    attempt2 = _e.sent();
                    if (!attempt2.error) {
                        data = (_c = attempt2.data) !== null && _c !== void 0 ? _c : null;
                        return [2 /*return*/, { data: data }];
                    }
                    return [4 /*yield*/, runInsert(__assign(__assign({}, payload), { owner_id: userId }))];
                case 3:
                    attempt3 = _e.sent();
                    if (attempt3.error)
                        throw attempt3.error;
                    data = (_d = attempt3.data) !== null && _d !== void 0 ? _d : null;
                    return [2 /*return*/, { data: data }];
            }
        });
    });
}
function insertActionSubItemsWithFallback(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, userId, items, payload, error, columnMissing, error2, error3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    supabase = params.supabase, userId = params.userId, items = params.items;
                    if (items.length === 0)
                        return [2 /*return*/];
                    payload = items.map(function (item) { return (__assign(__assign({}, item), { user_id: userId, owner_id: userId })); });
                    return [4 /*yield*/, supabase.from('action_sub_items').insert(payload)];
                case 1:
                    error = (_b.sent()).error;
                    if (!error)
                        return [2 /*return*/];
                    columnMissing = error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column'));
                    if (!columnMissing)
                        throw error;
                    return [4 /*yield*/, supabase.from('action_sub_items').insert(payload.map(function (item) { return ({
                            action_id: item.action_id,
                            title: item.title,
                            completed: item.completed,
                            sort_order: item.sort_order,
                            user_id: item.user_id
                        }); }))];
                case 2:
                    error2 = (_b.sent()).error;
                    if (!error2)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.from('action_sub_items').insert(payload.map(function (item) { return ({
                            action_id: item.action_id,
                            title: item.title,
                            completed: item.completed,
                            sort_order: item.sort_order,
                            owner_id: item.owner_id
                        }); }))];
                case 3:
                    error3 = (_b.sent()).error;
                    if (error3)
                        throw error3;
                    return [2 /*return*/];
            }
        });
    });
}
function insertActionAttachmentsWithFallback(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, userId, items, payload, error, columnMissing, error2, error3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    supabase = params.supabase, userId = params.userId, items = params.items;
                    if (items.length === 0)
                        return [2 /*return*/];
                    payload = items.map(function (item) { return (__assign(__assign({}, item), { user_id: userId, owner_id: userId })); });
                    return [4 /*yield*/, supabase.from('action_attachments').insert(payload)];
                case 1:
                    error = (_b.sent()).error;
                    if (!error)
                        return [2 /*return*/];
                    columnMissing = error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column'));
                    if (!columnMissing)
                        throw error;
                    return [4 /*yield*/, supabase.from('action_attachments').insert(payload.map(function (item) { return ({
                            action_id: item.action_id,
                            file_path: item.file_path,
                            public_url: item.public_url,
                            mime_type: item.mime_type,
                            size_bytes: item.size_bytes,
                            bucket: item.bucket,
                            user_id: item.user_id
                        }); }))];
                case 2:
                    error2 = (_b.sent()).error;
                    if (!error2)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase.from('action_attachments').insert(payload.map(function (item) { return ({
                            action_id: item.action_id,
                            file_path: item.file_path,
                            public_url: item.public_url,
                            mime_type: item.mime_type,
                            size_bytes: item.size_bytes,
                            bucket: item.bucket,
                            owner_id: item.owner_id
                        }); }))];
                case 3:
                    error3 = (_b.sent()).error;
                    if (error3)
                        throw error3;
                    return [2 /*return*/];
            }
        });
    });
}
function createGoal(formData) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, title, description, start_date, end_date, success_criteria, stop_criteria, priority, category, error, legacyError;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_c.sent()).data.user;
                    if (!user)
                        return [2 /*return*/];
                    return [4 /*yield*/, assertActiveGoalLimit(supabase, user.id)];
                case 3:
                    _c.sent();
                    title = formData.get('title');
                    description = formData.get('description');
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    success_criteria = formData.get('success_criteria');
                    stop_criteria = formData.get('stop_criteria');
                    priority = formData.get('priority') || 'medium';
                    category = formData.get('category') || 'other';
                    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
                        throw new Error('invalid_date_range');
                    }
                    return [4 /*yield*/, supabase.from('goals').insert({
                            user_id: user.id,
                            owner_id: user.id,
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: 'active',
                            priority: priority,
                            category: category
                        })];
                case 4:
                    error = (_c.sent()).error;
                    if (!error) return [3 /*break*/, 7];
                    console.error('Error creating goal:', error);
                    if (!(((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Could not find')) ||
                        error.code === '42703' || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('column')))) return [3 /*break*/, 6];
                    console.warn('Database schema missing columns, falling back to basic fields.');
                    return [4 /*yield*/, supabase.from('goals').insert({
                            user_id: user.id,
                            owner_id: user.id,
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: 'active'
                        })];
                case 5:
                    legacyError = (_c.sent()).error;
                    if (legacyError) {
                        console.error('Legacy create goal failed:', legacyError);
                        throw new Error('operation_failed');
                    }
                    return [3 /*break*/, 7];
                case 6: throw new Error('operation_failed');
                case 7:
                    cache_1.revalidatePath('/goals');
                    navigation_1.redirect('/goals');
                    return [2 /*return*/];
            }
        });
    });
}
exports.createGoal = createGoal;
function updateGoalStatus(id, status) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, error, legacyError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _b.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_b.sent()).data.user;
                    if (!user)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({ status: status })
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    console.error('Error updating goal status:', error);
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({ status: status })
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    legacyError = (_b.sent()).error;
                    if (legacyError) {
                        console.error('Legacy update failed:', legacyError);
                        throw new Error("Update failed: " + legacyError.message);
                    }
                    return [3 /*break*/, 6];
                case 5: throw new Error("Update failed: " + error.message + " (Code: " + error.code + ")");
                case 6:
                    cache_1.revalidatePath('/goals');
                    cache_1.revalidatePath("/goals/" + id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateGoalStatus = updateGoalStatus;
function toggleGoalStar(id, isStarred) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, error, legacyError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _b.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_b.sent()).data.user;
                    if (!user)
                        throw new Error('User not authenticated');
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({ is_starred: isStarred })
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    console.error('Error toggling goal star:', error);
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({ is_starred: isStarred })
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    legacyError = (_b.sent()).error;
                    if (legacyError) {
                        throw new Error('Update failed');
                    }
                    return [3 /*break*/, 6];
                case 5: throw new Error('Update failed');
                case 6:
                    cache_1.revalidatePath('/goals');
                    cache_1.revalidatePath("/goals/" + id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.toggleGoalStar = toggleGoalStar;
function createGoalModal(formData) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, title, description, start_date, end_date, success_criteria, stop_criteria, priority, category, _c, data, error, _d, legacyData, legacyError;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _e.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_e.sent()).data.user;
                    if (!user)
                        return [2 /*return*/, { error: 'unauthenticated' }];
                    return [4 /*yield*/, assertActiveGoalLimit(supabase, user.id)];
                case 3:
                    _e.sent();
                    title = formData.get('title');
                    description = formData.get('description');
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    success_criteria = formData.get('success_criteria');
                    stop_criteria = formData.get('stop_criteria');
                    priority = formData.get('priority') || 'medium';
                    category = formData.get('category') || 'other';
                    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
                        throw new Error('invalid_date_range');
                    }
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .insert({
                            user_id: user.id,
                            owner_id: user.id,
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: 'active',
                            priority: priority,
                            category: category
                        })
                            .select('id,title')
                            .single()];
                case 4:
                    _c = _e.sent(), data = _c.data, error = _c.error;
                    if (!error) return [3 /*break*/, 7];
                    console.error('Error creating goal:', error);
                    if (!(((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Could not find')) ||
                        error.code === '42703' || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('column')))) return [3 /*break*/, 6];
                    console.warn('Database schema missing columns, falling back to basic fields.');
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .insert({
                            user_id: user.id,
                            owner_id: user.id,
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: 'active'
                        })
                            .select('id,title')
                            .single()];
                case 5:
                    _d = _e.sent(), legacyData = _d.data, legacyError = _d.error;
                    if (legacyError) {
                        console.error('Legacy create goal failed:', legacyError);
                        throw new Error('operation_failed');
                    }
                    // 成功（兼容旧架构）
                    cache_1.revalidatePath('/goals');
                    return [2 /*return*/, {
                            success: true,
                            goalId: legacyData === null || legacyData === void 0 ? void 0 : legacyData.id,
                            title: legacyData === null || legacyData === void 0 ? void 0 : legacyData.title
                        }];
                case 6: throw new Error('operation_failed');
                case 7:
                    cache_1.revalidatePath('/goals');
                    return [2 /*return*/, {
                            success: true,
                            goalId: data === null || data === void 0 ? void 0 : data.id,
                            title: data === null || data === void 0 ? void 0 : data.title
                        }];
            }
        });
    });
}
exports.createGoalModal = createGoalModal;
function createActionAndReturnId(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, goal_id, title, rawType, type, priority, description, repeat_rule, start_date, end_date, ai_recommendation_id, attachments, baseData, createdActionId, inserted, actionId_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _b.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_b.sent()).data.user;
                    if (!user) {
                        throw new Error('User not authenticated');
                    }
                    goal_id = formData.get('goal_id');
                    title = formData.get('title');
                    rawType = formData.get('type');
                    type = rawType || 'core';
                    priority = formData.get('priority');
                    description = formData.get('description');
                    repeat_rule = formData.get('repeat_rule') || 'none';
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    ai_recommendation_id = formData.get('ai_recommendation_id') || null;
                    attachments = parseAttachmentManifest(formData.get('attachment_manifest'));
                    if (!goal_id || !title || !start_date || !end_date) {
                        throw new Error('Missing required fields');
                    }
                    baseData = {
                        goal_id: goal_id,
                        title: title,
                        type: type,
                        priority: priority || 'medium',
                        description: actionRecurrence_1.serializeActionRecurrenceDescription(description || '', actionRecurrence_1.isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none'),
                        start_date: start_date,
                        end_date: end_date,
                        completed: false,
                        ai_recommendation_id: ai_recommendation_id
                    };
                    createdActionId = null;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 7, , 8]);
                    return [4 /*yield*/, insertActionWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            payload: baseData,
                            selectFields: 'id'
                        })];
                case 4:
                    inserted = _b.sent();
                    createdActionId = ((_a = inserted.data) === null || _a === void 0 ? void 0 : _a.id) || null;
                    if (!createdActionId)
                        throw new Error('operation_failed');
                    actionId_1 = createdActionId;
                    if (!(attachments.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, insertActionAttachmentsWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            items: attachments.map(function (item) { return (__assign(__assign({}, item), { action_id: actionId_1 })); })
                        })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error('Failed to create action:', error_1);
                    throw new Error('operation_failed');
                case 8:
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [4 /*yield*/, snapshots_1.upsertBehaviorSnapshot({
                            supabase: supabase,
                            userId: user.id,
                            snapshotDate: start_date
                        })];
                case 9:
                    _b.sent();
                    return [2 /*return*/, { actionId: createdActionId }];
            }
        });
    });
}
exports.createActionAndReturnId = createActionAndReturnId;
function createAction(formData) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createActionAndReturnId(formData)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.createAction = createAction;
function applyAITodayPlanToExistingAction(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, actionId, ai_recommendation_id, firstStep, definitionOfDone, reason, variantLabel, sourceActionTitle, locale, _b, action, error, fallback, note, description, payload, updateByUser, fallback;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_c.sent()).data.user;
                    if (!user)
                        throw new Error('User not authenticated');
                    actionId = formData.get('action_id');
                    ai_recommendation_id = formData.get('ai_recommendation_id') || null;
                    firstStep = formData.get('first_step') || '';
                    definitionOfDone = formData.get('definition_of_done') || '';
                    reason = formData.get('reason') || '';
                    variantLabel = formData.get('variant_label') || '';
                    sourceActionTitle = formData.get('source_action_title') || null;
                    locale = String(formData.get('locale') || '').toLowerCase().startsWith('zh')
                        ? 'zh'
                        : 'en';
                    if (!actionId ||
                        !ai_recommendation_id ||
                        !firstStep ||
                        !definitionOfDone ||
                        !reason ||
                        !variantLabel) {
                        throw new Error('Missing required fields');
                    }
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .select('id, goal_id, title, description, type, priority, start_date, end_date')
                            .eq('id', actionId)
                            .eq('user_id', user.id)
                            .maybeSingle()];
                case 3:
                    _b = _c.sent(), action = _b.data, error = _b.error;
                    if (!(!action && !error)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .select('id, goal_id, title, description, type, priority, start_date, end_date')
                            .eq('id', actionId)
                            .eq('owner_id', user.id)
                            .maybeSingle()];
                case 4:
                    fallback = _c.sent();
                    action = fallback.data;
                    error = fallback.error;
                    _c.label = 5;
                case 5:
                    if (error)
                        throw new Error('operation_failed');
                    if (!action)
                        throw new Error('operation_failed');
                    note = aiTodayPlan_1.buildAITodayPlanNote({
                        locale: locale,
                        variantLabel: variantLabel,
                        sourceActionTitle: sourceActionTitle || action.title || null,
                        firstStep: firstStep,
                        definitionOfDone: definitionOfDone,
                        reason: reason
                    });
                    description = aiTodayPlan_1.mergeAITodayPlanIntoDescription({
                        existingDescription: typeof action.description === 'string' ? action.description : '',
                        note: note
                    });
                    payload = {
                        description: description,
                        type: 'core',
                        ai_recommendation_id: ai_recommendation_id
                    };
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update(payload)
                            .eq('id', actionId)
                            .eq('user_id', user.id)];
                case 6:
                    updateByUser = _c.sent();
                    if (!updateByUser.error) return [3 /*break*/, 9];
                    if (!(updateByUser.error.code === '42703' || ((_a = updateByUser.error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update(payload)
                            .eq('id', actionId)
                            .eq('owner_id', user.id)];
                case 7:
                    fallback = _c.sent();
                    if (fallback.error)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 9];
                case 8: throw new Error('operation_failed');
                case 9:
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/goals');
                    if (action.goal_id)
                        cache_1.revalidatePath("/goals/" + action.goal_id);
                    return [4 /*yield*/, snapshots_1.upsertBehaviorSnapshot({
                            supabase: supabase,
                            userId: user.id,
                            snapshotDate: action.start_date
                        })];
                case 10:
                    _c.sent();
                    return [2 /*return*/, { actionId: actionId }];
            }
        });
    });
}
exports.applyAITodayPlanToExistingAction = applyAITodayPlanToExistingAction;
function createActionWithSubItems(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, goal_id, title, rawType, type, priority, description, repeat_rule, start_date, end_date, subItems, attachments, createdActionId, inserted, error_2, remove;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _b.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_b.sent()).data.user;
                    if (!user)
                        throw new Error('User not authenticated');
                    goal_id = formData.get('goal_id');
                    title = formData.get('title');
                    rawType = formData.get('type');
                    type = rawType || 'core';
                    priority = formData.get('priority') || 'medium';
                    description = formData.get('description') || '';
                    repeat_rule = formData.get('repeat_rule') || 'none';
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    if (!goal_id || !title || !start_date || !end_date) {
                        throw new Error('Missing required fields');
                    }
                    subItems = parseSubItems(formData.get('sub_items'));
                    attachments = parseAttachmentManifest(formData.get('attachment_manifest'));
                    createdActionId = null;
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 9, , 13]);
                    return [4 /*yield*/, insertActionWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            payload: {
                                goal_id: goal_id,
                                title: title,
                                type: type,
                                priority: priority,
                                description: actionRecurrence_1.serializeActionRecurrenceDescription(description, actionRecurrence_1.isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none'),
                                start_date: start_date,
                                end_date: end_date,
                                completed: false
                            },
                            selectFields: 'id'
                        })];
                case 4:
                    inserted = _b.sent();
                    createdActionId = ((_a = inserted.data) === null || _a === void 0 ? void 0 : _a.id) || null;
                    if (!createdActionId)
                        throw new Error('operation_failed');
                    if (!(subItems.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, insertActionSubItemsWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            items: subItems.map(function (item) { return (__assign(__assign({}, item), { action_id: createdActionId })); })
                        })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    if (!(attachments.length > 0)) return [3 /*break*/, 8];
                    return [4 /*yield*/, insertActionAttachmentsWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            items: attachments.map(function (item) { return (__assign(__assign({}, item), { action_id: createdActionId })); })
                        })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3 /*break*/, 13];
                case 9:
                    error_2 = _b.sent();
                    if (!createdActionId) return [3 /*break*/, 12];
                    return [4 /*yield*/, supabase
                            .from('actions')["delete"]()
                            .eq('id', createdActionId)
                            .eq('owner_id', user.id)];
                case 10:
                    remove = _b.sent();
                    if (!remove.error) return [3 /*break*/, 12];
                    return [4 /*yield*/, supabase
                            .from('actions')["delete"]()
                            .eq('id', createdActionId)
                            .eq('user_id', user.id)];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    console.error('Failed to create action with sub items:', error_2);
                    throw new Error('operation_failed');
                case 13:
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/goals');
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/, { actionId: createdActionId }];
            }
        });
    });
}
exports.createActionWithSubItems = createActionWithSubItems;
function toggleActionSubItem(formData) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, currentCompleted, actionId, fetchError, byOwner, byUser, nextCompleted, error, fallback, subItems, listByOwner, listByUser, parentCompleted, parentUpdateError, parentRecommendationId, parentByOwner, parentByUser;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _j.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_j.sent()).data.user;
                    if (!user)
                        throw new Error('unauthenticated');
                    id = formData.get('id');
                    goal_id = formData.get('goal_id') || null;
                    currentCompleted = formData.get('completed') === 'true';
                    if (!id)
                        throw new Error('missing_fields');
                    actionId = null;
                    fetchError = null;
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .select('action_id')
                            .eq('id', id)
                            .eq('owner_id', user.id)
                            .maybeSingle()];
                case 3:
                    byOwner = _j.sent();
                    actionId = ((_a = byOwner.data) === null || _a === void 0 ? void 0 : _a.action_id) || null;
                    fetchError = byOwner.error;
                    if (!(!actionId && !fetchError)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .select('action_id')
                            .eq('id', id)
                            .eq('user_id', user.id)
                            .maybeSingle()];
                case 4:
                    byUser = _j.sent();
                    actionId = ((_b = byUser.data) === null || _b === void 0 ? void 0 : _b.action_id) || null;
                    fetchError = byUser.error;
                    _j.label = 5;
                case 5:
                    if (fetchError || !actionId)
                        throw new Error('operation_failed');
                    nextCompleted = !currentCompleted;
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .update({
                            completed: nextCompleted,
                            updated_at: new Date().toISOString()
                        })
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 6:
                    error = (_j.sent()).error;
                    if (!error) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .update({
                            completed: nextCompleted,
                            updated_at: new Date().toISOString()
                        })
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 7:
                    fallback = _j.sent();
                    error = fallback.error;
                    _j.label = 8;
                case 8:
                    if (error)
                        throw new Error('operation_failed');
                    subItems = null;
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .select('completed')
                            .eq('action_id', actionId)
                            .eq('owner_id', user.id)];
                case 9:
                    listByOwner = _j.sent();
                    subItems = (_c = listByOwner.data) !== null && _c !== void 0 ? _c : null;
                    if (!(!subItems && !listByOwner.error)) return [3 /*break*/, 11];
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')
                            .select('completed')
                            .eq('action_id', actionId)
                            .eq('user_id', user.id)];
                case 10:
                    listByUser = _j.sent();
                    subItems = (_d = listByUser.data) !== null && _d !== void 0 ? _d : null;
                    _j.label = 11;
                case 11:
                    if (!(subItems && subItems.length > 0)) return [3 /*break*/, 18];
                    parentCompleted = subItems.every(function (item) { return item.completed; });
                    parentUpdateError = null;
                    parentRecommendationId = null;
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update({ completed: parentCompleted })
                            .eq('id', actionId)
                            .eq('owner_id', user.id)
                            .select('ai_recommendation_id')
                            .maybeSingle()];
                case 12:
                    parentByOwner = _j.sent();
                    parentUpdateError = parentByOwner.error;
                    parentRecommendationId = (_f = (_e = parentByOwner.data) === null || _e === void 0 ? void 0 : _e.ai_recommendation_id) !== null && _f !== void 0 ? _f : null;
                    if (!parentUpdateError) return [3 /*break*/, 14];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update({ completed: parentCompleted })
                            .eq('id', actionId)
                            .eq('user_id', user.id)
                            .select('ai_recommendation_id')
                            .maybeSingle()];
                case 13:
                    parentByUser = _j.sent();
                    parentUpdateError = parentByUser.error;
                    parentRecommendationId = (_h = (_g = parentByUser.data) === null || _g === void 0 ? void 0 : _g.ai_recommendation_id) !== null && _h !== void 0 ? _h : null;
                    _j.label = 14;
                case 14:
                    if (parentUpdateError)
                        throw new Error('operation_failed');
                    if (!parentRecommendationId) return [3 /*break*/, 16];
                    return [4 /*yield*/, recommendationStore_1.setRecommendationCompletion({
                            supabase: supabase,
                            recommendationId: parentRecommendationId,
                            userId: user.id,
                            completed: parentCompleted
                        })];
                case 15:
                    _j.sent();
                    _j.label = 16;
                case 16: return [4 /*yield*/, snapshots_1.upsertBehaviorSnapshot({
                        supabase: supabase,
                        userId: user.id,
                        snapshotDate: new Date().toISOString().slice(0, 10)
                    })];
                case 17:
                    _j.sent();
                    _j.label = 18;
                case 18:
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/goals');
                    if (goal_id)
                        cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/, { ok: true, completed: nextCompleted }];
            }
        });
    });
}
exports.toggleActionSubItem = toggleActionSubItem;
function updateGoal(formData) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category, error, legacyError;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_c.sent()).data.user;
                    if (!user)
                        return [2 /*return*/];
                    id = formData.get('id');
                    title = formData.get('title');
                    description = formData.get('description');
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    success_criteria = formData.get('success_criteria');
                    stop_criteria = formData.get('stop_criteria');
                    status = formData.get('status');
                    priority = formData.get('priority');
                    category = formData.get('category');
                    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
                        throw new Error('invalid_date_range');
                    }
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: status,
                            priority: priority,
                            category: category
                        })
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_c.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    console.error('Error updating goal:', error);
                    if (!(((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Could not find')) ||
                        error.code === '42703' || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('column')))) return [3 /*break*/, 5];
                    console.warn('Database schema missing columns, falling back to basic fields.');
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({
                            title: title,
                            description: description,
                            start_date: start_date,
                            end_date: end_date,
                            success_criteria: success_criteria,
                            stop_criteria: stop_criteria,
                            status: status
                        })
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    legacyError = (_c.sent()).error;
                    if (legacyError) {
                        throw new Error("Failed to update goal: " + legacyError.message);
                    }
                    return [3 /*break*/, 6];
                case 5: throw new Error("Failed to update goal: " + error.message);
                case 6:
                    cache_1.revalidatePath("/goals/" + id);
                    cache_1.revalidatePath('/goals');
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateGoal = updateGoal;
function updateAction(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, from_goal_id, title, type, priority, description, repeat_rule, start_date, end_date, ai_recommendation_id, subItemsUpdate, _b, targetGoal, targetGoalError, fallback, payload, error, fallbackError, deleteError, removeByOwner, removeByUser;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_c.sent()).data.user;
                    if (!user)
                        throw new Error('User not authenticated');
                    id = formData.get('id');
                    goal_id = formData.get('goal_id');
                    from_goal_id = formData.get('from_goal_id');
                    title = formData.get('title');
                    type = formData.get('type');
                    priority = formData.get('priority');
                    description = formData.get('description');
                    repeat_rule = formData.get('repeat_rule') || 'none';
                    start_date = formData.get('start_date');
                    end_date = formData.get('end_date');
                    ai_recommendation_id = formData.get('ai_recommendation_id') || null;
                    subItemsUpdate = parseSubItemsForUpdate(formData.get('sub_items'));
                    if (!goal_id)
                        throw new Error('Missing required fields');
                    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
                        throw new Error('invalid_date_range');
                    }
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .select('id')
                            .eq('id', goal_id)
                            .eq('user_id', user.id)
                            .eq('status', 'active')
                            .maybeSingle()];
                case 3:
                    _b = _c.sent(), targetGoal = _b.data, targetGoalError = _b.error;
                    if (!(!targetGoal && !targetGoalError)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .select('id')
                            .eq('id', goal_id)
                            .eq('owner_id', user.id)
                            .eq('status', 'active')
                            .maybeSingle()];
                case 4:
                    fallback = _c.sent();
                    targetGoal = fallback.data;
                    targetGoalError = fallback.error;
                    _c.label = 5;
                case 5:
                    if (targetGoalError)
                        throw new Error(targetGoalError.message);
                    if (!targetGoal)
                        throw new Error('operation_failed');
                    payload = {
                        title: title,
                        type: type,
                        priority: priority,
                        description: actionRecurrence_1.serializeActionRecurrenceDescription(description, actionRecurrence_1.isActionRecurrenceRule(repeat_rule) ? repeat_rule : 'none'),
                        start_date: start_date,
                        end_date: end_date,
                        goal_id: goal_id,
                        ai_recommendation_id: ai_recommendation_id
                    };
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update(payload)
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 6:
                    error = (_c.sent()).error;
                    if (!error) return [3 /*break*/, 9];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .update(payload)
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 7:
                    fallbackError = (_c.sent()).error;
                    if (fallbackError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 9];
                case 8: throw new Error('operation_failed');
                case 9:
                    if (!formData.has('sub_items')) return [3 /*break*/, 14];
                    deleteError = null;
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')["delete"]()
                            .eq('action_id', id)
                            .eq('owner_id', user.id)];
                case 10:
                    removeByOwner = _c.sent();
                    deleteError = removeByOwner.error;
                    if (!deleteError) return [3 /*break*/, 12];
                    return [4 /*yield*/, supabase
                            .from('action_sub_items')["delete"]()
                            .eq('action_id', id)
                            .eq('user_id', user.id)];
                case 11:
                    removeByUser = _c.sent();
                    deleteError = removeByUser.error;
                    _c.label = 12;
                case 12:
                    if (deleteError)
                        throw new Error('operation_failed');
                    if (!(subItemsUpdate.length > 0)) return [3 /*break*/, 14];
                    return [4 /*yield*/, insertActionSubItemsWithFallback({
                            supabase: supabase,
                            userId: user.id,
                            items: subItemsUpdate.map(function (item) { return ({
                                action_id: id,
                                title: item.title,
                                completed: item.completed,
                                sort_order: item.sort_order
                            }); })
                        })];
                case 13:
                    _c.sent();
                    _c.label = 14;
                case 14:
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/goals');
                    if (from_goal_id)
                        cache_1.revalidatePath("/goals/" + from_goal_id);
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [4 /*yield*/, snapshots_1.upsertBehaviorSnapshot({
                            supabase: supabase,
                            userId: user.id,
                            snapshotDate: start_date
                        })];
                case 15:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateAction = updateAction;
function deleteAction(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, attachments, fallback, bucketMap, _i, attachments_1, row, bucket, filePath, arr, _b, _c, _d, bucket, paths, remove, error;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _e.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_e.sent()).data.user;
                    if (!user)
                        return [2 /*return*/];
                    id = formData.get('id');
                    goal_id = formData.get('goal_id');
                    return [4 /*yield*/, supabase
                            .from('action_attachments')
                            .select('file_path,bucket')
                            .eq('action_id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    attachments = (_e.sent()).data;
                    if (!(!attachments || attachments.length === 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('action_attachments')
                            .select('file_path,bucket')
                            .eq('action_id', id)
                            .eq('user_id', user.id)];
                case 4:
                    fallback = _e.sent();
                    attachments = fallback.data;
                    _e.label = 5;
                case 5:
                    if (!(attachments && attachments.length > 0)) return [3 /*break*/, 9];
                    bucketMap = new Map();
                    for (_i = 0, attachments_1 = attachments; _i < attachments_1.length; _i++) {
                        row = attachments_1[_i];
                        bucket = row.bucket || 'action-images';
                        filePath = row.file_path || '';
                        if (!filePath)
                            continue;
                        arr = (_a = bucketMap.get(bucket)) !== null && _a !== void 0 ? _a : [];
                        arr.push(filePath);
                        bucketMap.set(bucket, arr);
                    }
                    _b = 0, _c = bucketMap.entries();
                    _e.label = 6;
                case 6:
                    if (!(_b < _c.length)) return [3 /*break*/, 9];
                    _d = _c[_b], bucket = _d[0], paths = _d[1];
                    if (paths.length === 0)
                        return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase.storage.from(bucket).remove(paths)];
                case 7:
                    remove = _e.sent();
                    if (remove.error) {
                        console.error('Error deleting action attachment files:', remove.error);
                    }
                    _e.label = 8;
                case 8:
                    _b++;
                    return [3 /*break*/, 6];
                case 9: return [4 /*yield*/, supabase
                        .from('actions')["delete"]()
                        .eq('id', id)
                        .eq('owner_id', user.id)];
                case 10:
                    error = (_e.sent()).error;
                    if (error) {
                        console.error('Error deleting action:', error);
                        throw new Error('delete_failed');
                    }
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    if (goal_id)
                        cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.deleteAction = deleteAction;
function deleteGoal(formData) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, deleteActionsError, deleteGoalError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _a.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_a.sent()).data.user;
                    if (!user)
                        return [2 /*return*/];
                    id = formData.get('id');
                    return [4 /*yield*/, supabase
                            .from('actions')["delete"]()
                            .eq('goal_id', id)
                            .eq('user_id', user.id)];
                case 3:
                    deleteActionsError = (_a.sent()).error;
                    if (deleteActionsError) {
                        console.error('Error deleting goal actions:', deleteActionsError);
                        throw new Error('delete_failed');
                    }
                    return [4 /*yield*/, supabase
                            .from('goals')["delete"]()
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    deleteGoalError = (_a.sent()).error;
                    if (deleteGoalError) {
                        console.error('Error deleting goal:', deleteGoalError);
                        throw new Error('delete_failed');
                    }
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/goals');
                    navigation_1.redirect('/goals');
                    return [2 /*return*/];
            }
        });
    });
}
exports.deleteGoal = deleteGoal;
function replaceGoalCategory(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, from, to, _b, error, data;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _c.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_c.sent()).data.user;
                    if (!user)
                        return [2 /*return*/, { success: false }];
                    from = params.from;
                    to = goalCategories_1.normalizeCategoryInput(params.to);
                    if (!from)
                        return [2 /*return*/, { success: false }];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .update({ category: to })
                            .eq('owner_id', user.id)
                            .eq('category', from)
                            .select('id')];
                case 3:
                    _b = _c.sent(), error = _b.error, data = _b.data;
                    if (error) {
                        console.error('Error replacing goal category:', error);
                        throw new Error('operation_failed');
                    }
                    cache_1.revalidatePath('/goals');
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath('/today');
                    return [2 /*return*/, { success: true, updatedCount: (_a = data === null || data === void 0 ? void 0 : data.length) !== null && _a !== void 0 ? _a : 0 }];
            }
        });
    });
}
exports.replaceGoalCategory = replaceGoalCategory;
function fetchGoalForShare(params) {
    return __awaiter(this, void 0, Promise, function () {
        var supabase, userId, goalId, _a, goal, error, fallback, _b, actions, actionsError, fallback, _c, entries, entriesError, fallback;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    supabase = params.supabase, userId = params.userId, goalId = params.goalId;
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .select('id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category')
                            .eq('id', goalId)
                            .eq('owner_id', userId)
                            .maybeSingle()];
                case 1:
                    _a = _d.sent(), goal = _a.data, error = _a.error;
                    if (!(!goal && !error)) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .select('id, title, description, start_date, end_date, success_criteria, stop_criteria, status, priority, category')
                            .eq('id', goalId)
                            .eq('user_id', userId)
                            .maybeSingle()];
                case 2:
                    fallback = _d.sent();
                    goal = fallback.data;
                    error = fallback.error;
                    _d.label = 3;
                case 3:
                    if (error || !goal)
                        throw new Error('operation_failed');
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .select('id, title, description, type, priority, completed, start_date, end_date')
                            .eq('goal_id', goalId)
                            .eq('owner_id', userId)
                            .order('completed', { ascending: true })
                            .order('priority', { ascending: false })
                            .order('start_date', { ascending: true })];
                case 4:
                    _b = _d.sent(), actions = _b.data, actionsError = _b.error;
                    if (!actionsError) return [3 /*break*/, 6];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .select('id, title, description, type, priority, completed, start_date, end_date')
                            .eq('goal_id', goalId)
                            .eq('user_id', userId)
                            .order('completed', { ascending: true })
                            .order('priority', { ascending: false })
                            .order('start_date', { ascending: true })];
                case 5:
                    fallback = _d.sent();
                    actions = fallback.data;
                    actionsError = fallback.error;
                    _d.label = 6;
                case 6:
                    if (actionsError)
                        throw new Error('operation_failed');
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .select('id, kind, status, content, note, created_at')
                            .eq('goal_id', goalId)
                            .eq('owner_id', userId)
                            .order('created_at', { ascending: false })];
                case 7:
                    _c = _d.sent(), entries = _c.data, entriesError = _c.error;
                    if (!entriesError) return [3 /*break*/, 9];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .select('id, kind, status, content, note, created_at')
                            .eq('goal_id', goalId)
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })];
                case 8:
                    fallback = _d.sent();
                    entries = fallback.data;
                    entriesError = fallback.error;
                    _d.label = 9;
                case 9:
                    if (entriesError)
                        throw new Error('operation_failed');
                    return [2 /*return*/, {
                            goal: {
                                id: goal.id,
                                title: goal.title || '',
                                description: goal.description || '',
                                start_date: goal.start_date || '',
                                end_date: goal.end_date || '',
                                success_criteria: goal.success_criteria || '',
                                stop_criteria: goal.stop_criteria || '',
                                status: goal.status || 'active',
                                priority: goal.priority || null,
                                category: goal.category || null
                            },
                            actions: (actions || []).map(function (a) { return ({
                                id: a.id,
                                title: a.title || '',
                                description: a.description || null,
                                type: a.type || 'core',
                                priority: a.priority || 'medium',
                                completed: Boolean(a.completed),
                                start_date: a.start_date || '',
                                end_date: a.end_date || null
                            }); }),
                            entries: (entries || [])
                                .filter(function (e) {
                                return (e.kind === 'inspiration' || e.kind === 'journey') &&
                                    (e.status === 'open' || e.status === 'archived');
                            })
                                .map(function (e) { return ({
                                id: e.id,
                                kind: e.kind,
                                status: e.status || 'open',
                                content: e.content || '',
                                note: e.note || null,
                                created_at: e.created_at || ''
                            }); })
                        }];
            }
        });
    });
}
function createGoalShareLink(goalId) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, snapshot, token, expiresAt, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _a.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_a.sent()).data.user;
                    if (!user)
                        throw new Error('unauthenticated');
                    if (!goalId)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, fetchGoalForShare({
                            supabase: supabase,
                            userId: user.id,
                            goalId: goalId
                        })];
                case 3:
                    snapshot = _a.sent();
                    token = crypto.randomUUID();
                    expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
                    return [4 /*yield*/, supabase.from('goal_shares').upsert({
                            owner_id: user.id,
                            goal_id: goalId,
                            token: token,
                            snapshot: snapshot,
                            revoked_at: null,
                            expires_at: expiresAt
                        }, { onConflict: 'owner_id,goal_id' })];
                case 4:
                    error = (_a.sent()).error;
                    if (error)
                        throw new Error('operation_failed');
                    cache_1.revalidatePath("/goals/" + goalId);
                    return [2 /*return*/, { token: token, expiresAt: expiresAt }];
            }
        });
    });
}
exports.createGoalShareLink = createGoalShareLink;
function refreshGoalShareSnapshot(goalId) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, snapshot, _a, existing, findError, expired, nextToken, nextExpiresAt, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _b.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_b.sent()).data.user;
                    if (!user)
                        throw new Error('unauthenticated');
                    if (!goalId)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, fetchGoalForShare({
                            supabase: supabase,
                            userId: user.id,
                            goalId: goalId
                        })];
                case 3:
                    snapshot = _b.sent();
                    return [4 /*yield*/, supabase
                            .from('goal_shares')
                            .select('token, expires_at, revoked_at')
                            .eq('goal_id', goalId)
                            .eq('owner_id', user.id)
                            .maybeSingle()];
                case 4:
                    _a = _b.sent(), existing = _a.data, findError = _a.error;
                    if (findError)
                        throw new Error('operation_failed');
                    if (!(existing === null || existing === void 0 ? void 0 : existing.token) || existing.revoked_at)
                        throw new Error('operation_failed');
                    expired = Boolean(existing.expires_at) &&
                        new Date(existing.expires_at).getTime() <= Date.now();
                    nextToken = expired ? crypto.randomUUID() : existing.token;
                    nextExpiresAt = expired
                        ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
                        : (existing.expires_at || null);
                    return [4 /*yield*/, supabase
                            .from('goal_shares')
                            .update({
                            snapshot: snapshot,
                            token: nextToken,
                            expires_at: nextExpiresAt,
                            revoked_at: null
                        })
                            .eq('goal_id', goalId)
                            .eq('owner_id', user.id)
                            .eq('token', existing.token)];
                case 5:
                    error = (_b.sent()).error;
                    if (error)
                        throw new Error('operation_failed');
                    cache_1.revalidatePath("/goals/" + goalId);
                    return [2 /*return*/, {
                            token: nextToken,
                            expiresAt: nextExpiresAt
                        }];
            }
        });
    });
}
exports.refreshGoalShareSnapshot = refreshGoalShareSnapshot;
function revokeGoalShareLink(goalId) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, server_1.createClient()];
                case 1:
                    supabase = _a.sent();
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 2:
                    user = (_a.sent()).data.user;
                    if (!user)
                        throw new Error('unauthenticated');
                    if (!goalId)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, supabase
                            .from('goal_shares')
                            .update({ revoked_at: new Date().toISOString() })
                            .eq('goal_id', goalId)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_a.sent()).error;
                    if (error)
                        throw new Error('operation_failed');
                    cache_1.revalidatePath("/goals/" + goalId);
                    return [2 /*return*/, { success: true }];
            }
        });
    });
}
exports.revokeGoalShareLink = revokeGoalShareLink;
