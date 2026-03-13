---
title: Guest Local Storage and Atomic Sync to Supabase
date: 2026-03-13
status: approved
---

# Overview

Enable Budgetin to be used without login. Guest data is stored in `localStorage` and persists until the user successfully logs in/registers and sync completes. When the user logs in or registers, the guest data is merged into Supabase and becomes part of the authenticated account. If the account already has data, the sync performs a merge based on wallet and category names; transactions are treated as distinct records. Sync is atomic: if any part fails, the entire sync is rolled back.

# Goals

- Allow full app usage without authentication.
- Store guest data in `localStorage` only.
- On login/register, sync guest data into Supabase and merge with existing data.
- Prevent accidental data loss during the transition from guest to authenticated user.
- Prevent partial writes by using database transactions in `/api/sync`.
- Block new transaction input during sync to avoid race conditions.

# Non-goals

- Cross-device guest data persistence.
- Full offline-first sync engine.
- Background sync without user action.

# Assumptions

- Supabase tables already include `user_id` and RLS policies per user.
- Default categories and wallets are seeded per new user (via trigger).
- Name matching is case-insensitive and whitespace-normalized; no fuzzy matching.
- Wallet balances on server are authoritative and derived from transactions, not trusted from client.

# Proposed Solution

## Guest Storage (Client)

- Store guest state in `localStorage` under key `budgetin:guest:v1`.
- Persist these entities:
  - `transactions`
  - `categories`
  - `wallets`
  - `profile` (not synced; guest profile is ignored after login)
  - `meta` (timestamps and version)
- On app load:
  - If user is authenticated: load from API.
  - If not authenticated: load from `localStorage` and initialize in-memory state.

## Sync Trigger

- On successful login/register:
  - Read guest data from `localStorage`.
  - If data exists, call a new API endpoint `/api/sync`.
  - If the response is 200/201: clear `localStorage`.
  - Reload data from API to ensure canonical state.

## Hybrid State Banner

- If `isAuthenticated == true` but guest data still exists in `localStorage`, show a persistent banner:
  - Message: "Ada data offline yang belum tersimpan."
  - Action: "Sinkronisasi Sekarang" (triggers `/api/sync`).
- The retry action must be available on the main dashboard, not only during login.

## Global Sync Lock

- While `SyncService` is running, set a global loading state to disable transaction input.
- Purpose: prevent users from editing data during the critical sync window.

## Cross-Tab Sync

- Listen to the `storage` event to detect updates from another tab (e.g., sync cleared `localStorage`).
- When changes are detected, refresh in-memory state accordingly.

## Merge Rules

- Wallets and categories:
  - Normalize name: `trim`, `toLowerCase`, collapse whitespace.
  - Categories match by `(normalized name, type)` to keep income vs expense distinct.
  - If normalized name (and type for categories) matches an existing record, reuse that ID.
  - Otherwise, create a new wallet/category in Supabase.
- Transactions:
  - Always inserted as new entries.
  - `wallet_id` and `category_id` are mapped using the name-based mapping above.
- Wallet balance rule:
  - Ignore any `wallet.balance` from client.
  - After inserting guest transactions, update wallet balances by applying the sum of guest transactions (income - expense), or recompute from all transactions.

## Saldo Awal as Transaction

- "Saldo Awal/Adjustment" is a system income category.
- When a guest creates a wallet with an initial balance, the app creates an implicit income transaction in that category.
- On sync, the category is ensured to exist (type `income`), and the transaction is inserted like any other.

## Idempotency

- Add `client_id` on transactions, categories, and wallets.
- Store a UUID created on the client to prevent duplicate inserts on repeated syncs.
- Enforce uniqueness with a composite unique index (`user_id`, `client_id`).

# Data Model Changes (Supabase)

Required:

- `transactions.client_id UUID NULL`
- `categories.client_id UUID NULL`
- `wallets.client_id UUID NULL`

Add unique indexes:
- `transactions (user_id, client_id)`
- `categories (user_id, client_id)`
- `wallets (user_id, client_id)`

# API Changes

## New Endpoint: `POST /api/sync`

Request body:
```json
{
  "categories": [{ "clientId": "uuid", "name": "Food", "icon": "FOOD", "color": "#f97316", "type": "expense" }],
  "wallets": [{ "clientId": "uuid", "name": "Cash" }],
  "transactions": [
    {
      "clientId": "uuid",
      "type": "expense",
      "amount": 25000,
      "categoryName": "Food",
      "walletName": "Cash",
      "date": "2026-03-13",
      "note": "Lunch"
    }
  ]
}
```

Server responsibilities:
- Validate auth (must be logged in).
- Start a DB transaction (atomic sync).
- Fetch existing wallets/categories for the user.
- Build name-based mapping with normalization (and category type).
- Upsert wallets/categories as needed (ignore client `balance`).
- Ensure "Saldo Awal/Adjustment" category exists (type `income`).
- Insert transactions with mapped IDs.
- Update wallet balances based on transaction deltas (or recompute).
- Respect `client_id` uniqueness to prevent duplicates.
- Commit only if all steps succeed; otherwise rollback and return error.

Response:
```json
{ "status": "ok", "inserted": { "transactions": 10, "categories": 2, "wallets": 1 } }
```

# Client Changes

- `AuthGate` becomes optional or is bypassed for guest mode.
- `DataLoader`:
  - If authenticated: load from API as today.
  - If not authenticated: hydrate from `localStorage`.
- `budgetStore`:
  - Add helpers to load/save state to `localStorage`.
  - Wrap mutating actions so guest changes persist to `localStorage`.
- Add a persistent hybrid-state banner with retry action when `isAuthenticated == true` and guest data exists.
- Implement global loading state that disables transaction input while sync runs.
- Add `storage` event listeners to sync state across tabs.

# Error Handling

- If sync fails (e.g., 500):
  - Keep `localStorage` intact.
  - Show a visible error message and allow retry from the dashboard banner.
  - App remains usable (no blank screen).
- Only clear `localStorage` when `/api/sync` returns 200/201.

# Testing Plan

- Guest mode CRUD operations stored in `localStorage`.
- Data persists after browser close until login/register success.
- Login/register with existing data:
  - Wallet/category merge by normalized name.
  - Transactions inserted and linked to mapped IDs.
  - Wallet balances updated based on transaction deltas.
- Sync idempotency:
  - Multiple syncs do not duplicate records.
- Timezone test:
  - Guest transaction in local timezone syncs to Supabase `timestamptz` without date shift.
- Partial auth test:
  - Valid token but `/api/sync` returns 500 -> data local tetap, app usable.
- Cross-tab sync:
  - Login in tab 1; tab 2 detects `localStorage` changes and refreshes.

# Rollout

1. Add DB columns and unique indexes.
2. Implement `/api/sync` with DB transaction.
3. Update client store, loaders, and sync service.
4. Add hybrid-state banner, retry action, and global sync lock.
5. QA flows for guest -> login -> merged state.

# Risks and Open Questions

- Name matching is strict normalization; no fuzzy matching.
- Balance recompute vs. delta update should follow existing wallet balance rules in codebase.
- Ensure the "Saldo Awal/Adjustment" category does not appear in normal category pickers unless intended.

