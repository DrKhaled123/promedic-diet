# 🔐 Security Integration Guide

**Date:** 2026-03-26  
**Status:** ✅ SECURED & INTEGRATED

---

## What Changed

### 1. Backend (Database Rules)

Applied secure collection rules to prevent unauthorized data access:

```javascript
// Before (INSECURE - PUBLIC ACCESS)
listRule: ""    // Anyone can list all records
viewRule: ""    // Anyone can view any record
createRule: ""  // Anyone can create
updateRule: ""  // Anyone can update any record
deleteRule: ""  // Anyone can delete any record

// After (SECURE - USER-SCOPED)
listRule: "@request.auth.id != '' && user_id = @request.auth.id"
viewRule: "@request.auth.id != '' && user_id = @request.auth.id"
createRule: "@request.auth.id != ''"  // Note: no user_id check here
deleteRule: "@request.auth.id != '' && user_id = @request.auth.id"
```

**Key Point:** `createRule` does NOT check `user_id` because the record doesn't exist yet. The frontend MUST set `user_id` when creating.

---

### 2. Frontend (Auth Integration)

#### Auth Flow

```
User Opens App
    ↓
App.tsx calls useAuth()
    ↓
ensureAuth() runs
    ↓
Device ID generated (crypto.randomUUID)
    ↓
Login with device credentials
    ↓
Token stored in localStorage
    ↓
App renders after auth ready
    ↓
All API calls include auth token automatically
```

#### Critical Implementation Detail

**On CREATE operations, always set `user_id`:**

```typescript
// WRONG - Record created but unreachable
await pb.collection('diet_follow_ups').create({ weight: 75 });

// CORRECT - Record accessible by owner
await pb.collection('diet_follow_ups').create({
  weight: 75,
  user_id: pb.authStore.model.id,  // ← REQUIRED
});
```

---

### 3. Token Refresh

Tokens expire after 7 days. The app automatically:
1. Refreshes token if < 24 hours until expiry
2. Re-authenticates if token invalid
3. Persists token across browser sessions

---

## File Structure

```
services/
  └── pocketbase.ts       # Core auth & API service

hooks/
  ├── useAuth.ts          # Auth state management
  ├── useDietData.ts      # Secure data access
  └── index.ts            # Exports

App.tsx                   # Auth integration at root
```

---

## Testing Security

### Verify Data Isolation

```bash
# Without auth - should return empty
GET /api/collections/diet_follow_ups/records
→ {"items": [], "totalItems": 0}

# With auth - should return only user's data
GET /api/collections/diet_follow_ups/records (with Bearer token)
→ {"items": [user_data], "totalItems": 1}
```

### Verify Another User Cannot Access Data

```bash
# Login as User A
curl -X POST /api/collections/users/auth-with-password \
  -d '{"identity":"userA@device.local","password":"..."}'

# Get User A's data
# Note the record ID

# Login as User B
curl -X POST /api/collections/users/auth-with-password \
  -d '{"identity":"userB@device.local","password":"..."}'

# Try to access User A's data
curl /api/collections/diet_follow_ups/records/RECORD_ID_OF_USER_A \
  -H "Authorization: Bearer USER_B_TOKEN"
→ 404 Not Found  ✅ Security working
```

---

## Rollback

If issues occur:

```bash
cd /root/diet-pocketbase
./pocketbase migrate down

cd /root/coach-pocketbase
./pocketbase migrate down

cd /root
./pocketbase migrate down
```

---

## Building & Deploying

```bash
cd /var/www/diet-plans
npm run build

# Caddy serves from dist/ automatically
# Verify: curl -I https://diet.promedic1.com
```

---

## Monitoring

Check for auth errors:

```bash
# Caddy logs
tail -f /var/log/caddy/diet.promedic1.com.log | jq '. | select(.status >= 400)'

# PocketBase logs
journalctl -u diet-pocketbase -f
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React App                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │   useAuth    │──│  ensureAuth  │──│    pb      │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  │           │                 │              │         │   │
│  │           └─────────────────┴──────────────┘         │   │
│  │                         │                            │   │
│  │              Token stored in localStorage             │   │
│  └─────────────────────────┬────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────┘
                              │ HTTPS + Authorization: Bearer
┌─────────────────────────────▼────────────────────────────────┐
│                     Caddy Proxy                              │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                   PocketBase API                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Collection Rules (Row-Level Security)               │    │
│  │  • user_id = @request.auth.id                        │    │
│  │  • @request.auth.id != ''                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────┐      │
│  │  SQLite Database                                    │      │
│  │  Records filtered by auth rules automatically       │      │
│  └─────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

---

## References

- Original security fix: `/root/SECURITY_FIX_SUMMARY.md`
- System status: `/root/PROMEDIC_STATUS.md`
