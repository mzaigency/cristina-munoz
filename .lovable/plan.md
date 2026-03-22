

## Plan: Fix NodeJS namespace build errors

The build is failing because `NodeJS` namespace (from `@types/node`) isn't available in the browser TypeScript config.

### Changes

1. **`src/components/feed/StoriesCarousel.tsx` (line 45)** — Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

2. **`src/components/messages/ChatWindow.tsx` (line 75)** — Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

3. **`src/pages/Auth.tsx` (lines 66-67)** — Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` and `NodeJS.Timer` with `ReturnType<typeof setInterval>`

These are simple type annotation fixes — no logic changes.

