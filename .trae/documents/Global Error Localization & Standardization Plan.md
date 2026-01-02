I have identified several areas where error messages are hardcoded in English or where raw database errors are exposed. Here is the plan to fix these issues and ensure proper localization (i18n):

### 1. Define Standard Error Codes
I will standardize error codes across the application to facilitate frontend translation mapping.
*   `unauthenticated`: User not logged in.
*   `missing_fields`: Required fields are missing.
*   `invalid_date_range`: End date is before start date.
*   `operation_failed`: Generic database operation failure (create, update, delete).
*   `name_too_long`: Profile name exceeds limit.

### 2. Update Localization Files (`src/i18n/*.json`)
I will add the new error keys to both `en.json` and `zh.json`.

**New entries to add:**
*   `errors.unauthenticated`
*   `errors.missing_fields`
*   `errors.invalid_date_range`
*   `errors.operation_failed`
*   `errors.name_too_long`

### 3. Refactor Server Actions (`actions.ts`)
I will modify the server actions to throw/return these standardized error codes instead of raw messages or hardcoded English strings.

**Files to modify:**
*   `src/app/(authenticated)/goals/actions.ts`:
    *   Replace "End date cannot be earlier than start date" -> `invalid_date_range`
    *   Replace "User not authenticated" -> `unauthenticated`
    *   Replace "Missing required fields" -> `missing_fields`
    *   Catch and map raw errors in `createGoal`, `updateGoal`, `deleteGoal`, `createAction`, `updateAction`, `deleteAction`.
*   `src/app/(authenticated)/profile/actions.ts`:
    *   Replace "User not authenticated" -> `unauthenticated`
    *   Replace "Name too long" -> `name_too_long`
    *   Catch and map raw errors in `updateProfile`, `updateAvatarUrl`, `deleteAccount`.
*   `src/app/(authenticated)/dashboard/actions.ts`:
    *   Catch and map raw errors in `submitScore`, `toggleAction`.

### 4. Update Frontend Error Handling
I will ensure that the frontend components receiving these errors map the codes to the localized strings from the dictionary.
*   Review how `GoalForm` (if exists) or the pages calling these actions handle the error messages. (Note: Since most are Server Actions used in forms or event handlers, I need to ensure the client-side `toast` or error display logic uses the translation dictionary).

**Note**: For Server Actions invoked via `useServerAction` or similar hooks, the error caught on the client side will contain the message thrown. By throwing the *code* (e.g., `Error('invalid_date_range')`), the client can simply look up `dict.errors[error.message]`.

### Execution Steps
1.  Update `src/i18n/en.json` and `src/i18n/zh.json`.
2.  Refactor `src/app/(authenticated)/goals/actions.ts`.
3.  Refactor `src/app/(authenticated)/profile/actions.ts`.
4.  Refactor `src/app/(authenticated)/dashboard/actions.ts`.
