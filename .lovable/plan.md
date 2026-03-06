

# Plan: Full Conversational AI Sensei Chat

Transform the current one-shot "critique" panel into a full back-and-forth chat experience where users can have an ongoing conversation with Sensei about their trade.

## What Changes

### 1. Update Edge Function to Support Conversation Mode
**File: `supabase/functions/analyze-trade-sensei/index.ts`**

- Accept a `messages` array (full chat history) alongside trade context
- When `messages` is provided, use conversational mode: prepend the system prompt + trade context, then pass the full history
- When `messages` is absent, fall back to the current single-shot critique behavior
- Both Gemini and Lovable AI paths will support multi-turn conversation

### 2. Redesign TradeView Sensei Panel as a Chat Interface
**File: `src/pages/TradeView.tsx`**

- Replace the single `streamedText` string with a `messages` array (`{ role: "user" | "assistant", content: string }[]`)
- Add a text input + send button at the bottom of the Sensei panel
- "Get Sensei's Critique" button triggers the initial analysis (first message)
- After the initial critique, the input field appears and the user can ask follow-up questions like "Why was my entry bad?", "What should I have done differently?", "How do I manage this setup next time?"
- Each message streams in with the existing typewriter effect
- Full conversation history is sent with each request so Sensei has context
- The panel becomes a scrollable chat with distinct user/assistant message bubbles
- Persist the full conversation (not just the first critique) to `aiCritique` as JSON

### 3. Add Sensei Chat Page (Global Access)
**File: `src/pages/SenseiChat.tsx`** (new)

- A dedicated full-page chat with Sensei accessible from the sidebar
- Users can discuss general trading psychology, review patterns, or ask questions without a specific trade context
- The system prompt adapts: if no trade is provided, Sensei acts as a general trading mentor
- Add route `/sensei` and sidebar nav item with Brain icon

### 4. Update Sidebar Navigation
**File: `src/components/layout/AppSidebar.tsx`**

- Add "Sensei" nav item with Brain icon pointing to `/sensei`

### 5. Update App Router
**File: `src/App.tsx`**

- Add `/sensei` route

## Technical Details

- **Edge function payload** gains an optional `messages` field. When present, multi-turn; when absent, single-shot (backward compatible)
- **Gemini multi-turn**: Uses `contents` array with alternating `user`/`model` roles
- **Lovable AI multi-turn**: Already OpenAI-compatible, just pass the messages array
- **Chat state**: Stored in component state as `{ role, content }[]`. Persisted to `aiCritique` as JSON string for the trade-specific chat
- **UI**: User bubbles right-aligned with muted background, Sensei bubbles left-aligned with primary tint. Input bar pinned to bottom of panel

