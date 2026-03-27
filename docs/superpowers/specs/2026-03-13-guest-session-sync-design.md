---
title: Guest Session Storage and Sync to Supabase
date: 2026-03-13
status: approved
---

# Overview

Enable Budgetin to be used without login. Guest data is stored in `sessionStorage` and is cleared when the browser window/tab is closed. When the user logs in or registers, the guest data is merged into Supabase and becomes part of the authenticated account. If the account already has data, the sync performs a merge based on wallet and category names; transactions are treated as distinct records.

# Goals

- Allow full app usage without authentication.
- Store guest data in `sessionStorage` only.
- Show a browser close warning when guest data exists and user is still anonymous.
- On login/register, sync guest data into Supabase and merge with existing data.
- Prevent accidental data loss during the transition from guest to authenticated user.

# Non-goals

- Cross-device guest data persistence.
- Full offline-first sync engine.
- Background sync without user action.

# Assumptions

- Supabase tables already include `user_id` and RLS policies per user.
- Default categories and wallets are seeded per new user (via trigger).
- Name matching is case-insensitive and whitespace-normalized; no fuzzy matching.

# Proposed Solution

## Guest Storage (Client)

- Store guest state in `sessionStorage` under key `budgetin:guest:v1`.
- Persist these entities:
  - `transactions`
  - `categories`
  - `wallets`
  - `profile` (limited to `name`, `email`, `theme` if needed)
  - `meta` (timestamps and version)
- On app load:
  - If user is authenticated: load from API.
  - If not authenticated: load from `sessionStorage` and initialize in-memory state.

## Sync Trigger

- On successful login/register:
  - Read guest data from `sessionStorage`.
  - If data exists, call a new API endpoint `/api/sync`.
  - After successful sync, clear `sessionStorage`.
  - Reload data from API to ensure canonical state.

## Merge Rules

- Wallets and categories:
  - Normalize name: `trim`, `toLowerCase`, collapse whitespace.
  - If normalized name matches an existing wallet/category in Supabase, reuse that ID.
  - Otherwise, create a new wallet/category in Supabase.
- Transactions:
  - Always inserted as new entries.
  - `wallet_id` and `category_id` are mapped using the name-based mapping above.

## Idempotency

- Add `client_id` on transactions (and optionally on categories/wallets).
- Store a UUID created on the client to prevent duplicate inserts on repeated syncs.
- Enforce uniqueness with a composite unique index (`user_id`, `client_id`).

## Warning on Close

- If in guest mode and `sessionStorage` has data, attach a `beforeunload` handler.
- This triggers the standard browser warning dialog before closing.
- Also add an in-app banner notifying the user that guest data is temporary.

# Data Model Changes (Supabase)

Recommended:
- `transactions.client_id UUID NULL`
- Optional:
  - `categories.client_id UUID NULL`
  - `wallets.client_id UUID NULL`

Add unique indexes:
- `transactions (user_id, client_id)`
- Optional similar indexes for categories/wallets.

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
- Fetch existing wallets/categories for the user.
- Build name-based mapping with normalization.
- Upsert wallets/categories as needed.
- Insert transactions with mapped IDs.
- Respect `client_id` uniqueness to prevent duplicates.

Response:
```json
{ "status": "ok", "inserted": { "transactions": 10, "categories": 2, "wallets": 1 } }
```

# Client Changes

- `AuthGate` becomes optional or is bypassed for guest mode.
- `DataLoader`:
  - If authenticated: load from API as today.
  - If not authenticated: hydrate from `sessionStorage`.
- `budgetStore`:
  - Add helpers to load/save state to `sessionStorage`.
  - Wrap mutating actions so guest changes persist to `sessionStorage`.
- Add a banner component for guest mode.
- Add `beforeunload` warning when guest data exists.

# Error Handling

- If sync fails:
  - Keep `sessionStorage` intact.
  - Show a visible error message and allow retry.
- If mapping fails:
  - Fallback to creating new categories/wallets to avoid data loss.

# Testing Plan

- Guest mode CRUD operations stored in `sessionStorage`.
- Data cleared after closing the browser tab (session scope).
- Login/register with existing data:
  - Wallet/category merge by normalized name.
  - Transactions inserted and linked to mapped IDs.
- Sync idempotency:
  - Multiple logins do not duplicate records.
- Error path:
  - Simulated sync failure keeps guest data.

# Rollout

1. Add DB columns and indexes.
2. Implement `/api/sync`.
3. Update client store and loaders.
4. Add guest banner and close warning.
5. QA flows for guest -> login -> merged state.

# Risks and Open Questions

- "Similar name" matching is strict normalization, not fuzzy. If fuzzy matching is needed, define rules and thresholds.
- Browser `beforeunload` message is not customizable in most modern browsers.
