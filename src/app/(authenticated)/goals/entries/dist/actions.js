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
exports.convertGoalEntryToAction = exports.deleteGoalEntry = exports.unarchiveGoalEntry = exports.archiveGoalEntry = exports.updateGoalEntry = exports.createGoalEntry = void 0;
var cache_1 = require("next/cache");
var server_1 = require("@/lib/supabase/server");
function isKind(v) {
    return v === 'journey';
}
function assertGoalOwnership(params) {
    return __awaiter(this, void 0, void 0, function () {
        var supabase, userId, goalId, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    supabase = params.supabase, userId = params.userId, goalId = params.goalId;
                    return [4 /*yield*/, supabase
                            .from('goals')
                            .select('id')
                            .eq('id', goalId)
                            .or("user_id.eq." + userId + ",owner_id.eq." + userId)
                            .maybeSingle()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw new Error('operation_failed');
                    if (!(data === null || data === void 0 ? void 0 : data.id))
                        throw new Error('operation_failed');
                    return [2 /*return*/];
            }
        });
    });
}
function createGoalEntry(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, goal_id, rawKind, content, note, baseData, error, error2, error3;
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
                    goal_id = formData.get('goal_id') || '';
                    rawKind = formData.get('kind') || '';
                    content = (formData.get('content') || '').trim();
                    note = (formData.get('note') || '').trim();
                    if (!goal_id || !rawKind || !content)
                        throw new Error('missing_fields');
                    if (!isKind(rawKind))
                        throw new Error('operation_failed');
                    return [4 /*yield*/, assertGoalOwnership({ supabase: supabase, userId: user.id, goalId: goal_id })];
                case 3:
                    _b.sent();
                    baseData = {
                        goal_id: goal_id,
                        kind: rawKind,
                        content: content,
                        note: note,
                        status: 'open'
                    };
                    return [4 /*yield*/, supabase.from('goal_entries').insert(__assign(__assign({}, baseData), { user_id: user.id, owner_id: user.id }))];
                case 4:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 9];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 8];
                    return [4 /*yield*/, supabase.from('goal_entries').insert(__assign(__assign({}, baseData), { user_id: user.id }))];
                case 5:
                    error2 = (_b.sent()).error;
                    if (!error2) return [3 /*break*/, 7];
                    return [4 /*yield*/, supabase.from('goal_entries').insert(__assign(__assign({}, baseData), { owner_id: user.id }))];
                case 6:
                    error3 = (_b.sent()).error;
                    if (error3)
                        throw new Error('operation_failed');
                    _b.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8: throw new Error('operation_failed');
                case 9:
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.createGoalEntry = createGoalEntry;
function updateGoalEntry(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, content, note, error, legacyError;
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
                    id = formData.get('id') || '';
                    goal_id = formData.get('goal_id') || '';
                    content = (formData.get('content') || '').trim();
                    note = (formData.get('note') || '').trim();
                    if (!id || !goal_id || !content)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, assertGoalOwnership({ supabase: supabase, userId: user.id, goalId: goal_id })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ content: content, note: note })
                            .eq('id', id)
                            .eq('goal_id', goal_id)
                            .eq('owner_id', user.id)
                            .eq('status', 'open')];
                case 4:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 7];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 6];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ content: content, note: note })
                            .eq('id', id)
                            .eq('goal_id', goal_id)
                            .eq('user_id', user.id)
                            .eq('status', 'open')];
                case 5:
                    legacyError = (_b.sent()).error;
                    if (legacyError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 7];
                case 6: throw new Error('operation_failed');
                case 7:
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateGoalEntry = updateGoalEntry;
function archiveGoalEntry(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, error, legacyError;
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
                    id = formData.get('id') || '';
                    goal_id = formData.get('goal_id') || '';
                    if (!id || !goal_id)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'archived' })
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'archived' })
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    legacyError = (_b.sent()).error;
                    if (legacyError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 6];
                case 5: throw new Error('operation_failed');
                case 6:
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.archiveGoalEntry = archiveGoalEntry;
function unarchiveGoalEntry(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, error, legacyError;
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
                    id = formData.get('id') || '';
                    goal_id = formData.get('goal_id') || '';
                    if (!id || !goal_id)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'open' })
                            .eq('id', id)
                            .eq('owner_id', user.id)
                            .eq('goal_id', goal_id)
                            .eq('status', 'archived')];
                case 3:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'open' })
                            .eq('id', id)
                            .eq('user_id', user.id)
                            .eq('goal_id', goal_id)
                            .eq('status', 'archived')];
                case 4:
                    legacyError = (_b.sent()).error;
                    if (legacyError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 6];
                case 5: throw new Error('operation_failed');
                case 6:
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.unarchiveGoalEntry = unarchiveGoalEntry;
function deleteGoalEntry(formData) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, id, goal_id, error, legacyError;
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
                    id = formData.get('id') || '';
                    goal_id = formData.get('goal_id') || '';
                    if (!id || !goal_id)
                        throw new Error('missing_fields');
                    return [4 /*yield*/, supabase
                            .from('goal_entries')["delete"]()
                            .eq('id', id)
                            .eq('owner_id', user.id)];
                case 3:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 6];
                    if (!(error.code === '42703' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('column')))) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')["delete"]()
                            .eq('id', id)
                            .eq('user_id', user.id)];
                case 4:
                    legacyError = (_b.sent()).error;
                    if (legacyError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 6];
                case 5: throw new Error('operation_failed');
                case 6:
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.deleteGoalEntry = deleteGoalEntry;
function convertGoalEntryToAction(formData) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var supabase, user, entry_id, goal_id, title, description, rawType, type, priority, start_date, end_date, baseActionData, _f, data, error, actionId, _g, legacyData, legacyError, _h, futureData, futureError, updateError, legacyUpdateError;
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
                    entry_id = formData.get('entry_id') || '';
                    goal_id = formData.get('goal_id') || '';
                    title = (formData.get('title') || '').trim();
                    description = (formData.get('description') || '').trim();
                    rawType = formData.get('type') || '';
                    type = rawType || 'core';
                    priority = (formData.get('priority') || '').trim() || 'medium';
                    start_date = formData.get('start_date') || '';
                    end_date = formData.get('end_date') || '';
                    if (!entry_id || !goal_id || !title || !start_date || !end_date)
                        throw new Error('missing_fields');
                    if (new Date(end_date) < new Date(start_date))
                        throw new Error('invalid_date_range');
                    return [4 /*yield*/, assertGoalOwnership({ supabase: supabase, userId: user.id, goalId: goal_id })];
                case 3:
                    _j.sent();
                    baseActionData = {
                        goal_id: goal_id,
                        title: title,
                        description: description,
                        type: type,
                        priority: priority,
                        start_date: start_date,
                        end_date: end_date,
                        completed: false
                    };
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .insert(__assign(__assign({}, baseActionData), { user_id: user.id, owner_id: user.id }))
                            .select('id')
                            .single()];
                case 4:
                    _f = _j.sent(), data = _f.data, error = _f.error;
                    actionId = (_a = data === null || data === void 0 ? void 0 : data.id) !== null && _a !== void 0 ? _a : null;
                    if (!error) return [3 /*break*/, 10];
                    if (!(error.code === '42703' || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('column')))) return [3 /*break*/, 9];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .insert(__assign(__assign({}, baseActionData), { user_id: user.id }))
                            .select('id')
                            .single()];
                case 5:
                    _g = _j.sent(), legacyData = _g.data, legacyError = _g.error;
                    if (!legacyError) return [3 /*break*/, 7];
                    return [4 /*yield*/, supabase
                            .from('actions')
                            .insert(__assign(__assign({}, baseActionData), { owner_id: user.id }))
                            .select('id')
                            .single()];
                case 6:
                    _h = _j.sent(), futureData = _h.data, futureError = _h.error;
                    if (futureError)
                        throw new Error('operation_failed');
                    actionId = (_c = futureData === null || futureData === void 0 ? void 0 : futureData.id) !== null && _c !== void 0 ? _c : null;
                    return [3 /*break*/, 8];
                case 7:
                    actionId = (_d = legacyData === null || legacyData === void 0 ? void 0 : legacyData.id) !== null && _d !== void 0 ? _d : null;
                    _j.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9: throw new Error('operation_failed');
                case 10:
                    if (!actionId)
                        throw new Error('operation_failed');
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'archived', converted_action_id: actionId })
                            .eq('id', entry_id)
                            .eq('owner_id', user.id)
                            .eq('goal_id', goal_id)
                            .eq('status', 'open')];
                case 11:
                    updateError = (_j.sent()).error;
                    if (!updateError) return [3 /*break*/, 14];
                    if (!(updateError.code === '42703' || ((_e = updateError.message) === null || _e === void 0 ? void 0 : _e.includes('column')))) return [3 /*break*/, 13];
                    return [4 /*yield*/, supabase
                            .from('goal_entries')
                            .update({ status: 'archived', converted_action_id: actionId })
                            .eq('id', entry_id)
                            .eq('user_id', user.id)
                            .eq('goal_id', goal_id)
                            .eq('status', 'open')];
                case 12:
                    legacyUpdateError = (_j.sent()).error;
                    if (legacyUpdateError)
                        throw new Error('operation_failed');
                    return [3 /*break*/, 14];
                case 13: throw new Error('operation_failed');
                case 14:
                    cache_1.revalidatePath('/today');
                    cache_1.revalidatePath('/dashboard');
                    cache_1.revalidatePath("/goals/" + goal_id);
                    return [2 /*return*/];
            }
        });
    });
}
exports.convertGoalEntryToAction = convertGoalEntryToAction;
