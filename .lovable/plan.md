

# Fix Edge Function Errors

## Problem Summary

The `analyze-text` edge function is failing with:
```
TypeError: supabaseAdmin.from(...).insert(...).catch is not a function
```

This happens because the Supabase client's `.insert()` returns a special query builder object, not a standard Promise. You cannot chain `.catch()` or `.then()` directly on it.

## Changes Required

### 1. Fix `analyze-text/index.ts` (Line 179)

**Current (broken):**
```typescript
supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "text_analysis" }).catch(() => {});
```

**Fixed:**
```typescript
// Fire and forget with proper async handling
(async () => {
  try {
    await supabaseAdmin.from("usage_logs").insert({ user_id: user.id, action_type: "text_analysis" });
  } catch (e) {
    console.error("Error logging usage:", e);
  }
})();
```

### 2. Fix `generate-podcast/index.ts` (Lines 383-388)

**Current (broken):**
```typescript
supabaseAdmin.from("usage_logs").insert({
  user_id: user.id,
  action_type: "podcast_generation",
}).then(({ error }) => {
  if (error) console.error("Error logging usage:", error);
});
```

**Fixed:**
```typescript
(async () => {
  const { error } = await supabaseAdmin.from("usage_logs").insert({
    user_id: user.id,
    action_type: "podcast_generation",
  });
  if (error) console.error("Error logging usage:", error);
})();
```

### 3. Update CORS Headers in `_shared-index.ts`

Add missing Supabase client headers to prevent CORS errors:

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
```

## Technical Details

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `analyze-text/index.ts` | 179 | `.catch()` on PostgrestFilterBuilder | Wrap in async IIFE with await |
| `generate-podcast/index.ts` | 383-388 | `.then()` on PostgrestFilterBuilder | Wrap in async IIFE with await |
| `analyze-text/_shared-index.ts` | 4 | Missing CORS headers | Add `x-supabase-client-*` headers |

## Outcome

After these fixes:
- Text analysis will complete successfully and log usage
- Podcast generation will work with proper usage logging
- No more "non-2xx status code" errors from the edge functions

