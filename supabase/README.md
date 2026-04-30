# Supabase Database Initialization Guide

[中文](README_ZH.md) | **English**

This directory contains all the SQL scripts required to initialize the FlowSpark database. Please execute these scripts in the Supabase SQL Editor in the following order.

## Script Descriptions

### 1. `00_init_tables.sql` (Core Schema)

Initializes the core data tables for the project:

- `user_profiles`: Stores additional user information (name, avatar, timezone, etc.).
- `goals`: Stores users' long-term goals.
- `actions`: Stores specific action items associated with goals.
- `daily_scores`: Stores users' daily scoring data.

**Note**: To maintain compatibility with existing backend logic, some tables define both `user_id` and `owner_id` fields.

### 2. `01_rls_policies.sql` (Security Policies)

Configures Row Level Security (RLS) policies to ensure data security:

- Enables RLS for all tables.
- Restricts users to query, insert, update, and delete only their own data (based on `auth.uid()`).

### 3. `02_storage_setup.sql` (Storage Configuration)

Configures the file storage system:

- Creates the `avatars` bucket for storing user avatars.
- Configures Public Read permissions.
- Configures permissions so only authenticated users can upload/modify their own files.

### 4. `03_functions_and_triggers.sql` (Automation Logic)

Sets up automated database triggers:

- **New User Handling**: Automatically creates a corresponding record in the `user_profiles` table when a user registers.
- **Timestamp Updates**: Automatically updates the `updated_at` field to the current time when a record is updated.

### 5. `04_gamification.sql` (Gamification Schema)

Adds minimal gamification columns and tables:

- `user_profiles`: Adds `xp` and `level`.
- `xp_logs`: Logs XP changes.

### 6. `05_gamification_rls.sql` (Gamification RLS)

Enables RLS and policies for `xp_logs`.

### 7. `06_ai_feedback.sql` (AI Feedback Storage)

Adds `ai_recent_events` to `user_profiles` for basic AI feedback/event tracking.

### 8. `07_inbox.sql` (Quick Capture Inbox)

Adds `inbox_items` table for quick capture, tags, and conversion to actions.

### 9. `08_inbox_rls.sql` (Inbox RLS)

Enables RLS and policies for `inbox_items`.

### 10. `09_goal_entries.sql` (Goal Entries)

Adds `goal_entries` table for inspiration/journey entries under goals and conversion to actions.

### 11. `10_goal_entries_rls.sql` (Goal Entries RLS)

Enables RLS and policies for `goal_entries`.

### 12. `11_goal_shares.sql` (Goal Read-only Sharing)

Adds `goal_shares` table for public read-only goal links (`token + snapshot`).

### 13. `12_goal_shares_rls.sql` (Goal Shares RLS)

Enables RLS for `goal_shares`; owners can manage their records, public reads are limited to active (not revoked / not expired) records.

## Execution Steps

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** of your project.
3. Copy and run the contents of the above files in order:
   - `00_init_tables.sql`
   - `01_rls_policies.sql`
   - `02_storage_setup.sql`
   - `03_functions_and_triggers.sql`
   - `04_gamification.sql`
   - `05_gamification_rls.sql`
   - `06_ai_feedback.sql`
   - `07_inbox.sql`
   - `08_inbox_rls.sql`
   - `09_goal_entries.sql`
   - `10_goal_entries_rls.sql`
   - `11_goal_shares.sql`
   - `12_goal_shares_rls.sql`
4. Once completed, the database initialization is finished.
