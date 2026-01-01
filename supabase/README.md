# Supabase Database Initialization Guide

[中文](README_ZH.md) | **English**

This directory contains all the SQL scripts required to initialize the Goal System database. Please execute these scripts in the Supabase SQL Editor in the following order.

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

## Execution Steps

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** of your project.
3. Copy and run the contents of the above files in order:
   - First, run `00_init_tables.sql`
   - Second, run `01_rls_policies.sql`
   - Third, run `02_storage_setup.sql`
   - Finally, run `03_functions_and_triggers.sql`
4. Once completed, the database initialization is finished.
