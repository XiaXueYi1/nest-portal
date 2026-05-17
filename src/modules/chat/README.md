# Chat Module

## Current flow

The backend now supports the chat flow below:

1. Frontend enters the chat page and requests `GET /chat/conversations?agentKey=...`
2. Frontend clicks one conversation and requests `GET /chat/conversations/:id`
3. Frontend continues an existing conversation by calling `POST /chat/send` or `POST /chat/stream` with `conversationId`
4. Frontend creates a new conversation by calling `POST /chat/send` or `POST /chat/stream` without `conversationId` but with `agentKey`
5. Backend creates a conversation first, stores the user message, creates an assistant placeholder message, calls the LLM, then writes the final assistant content back to the same conversation

## Why this refactor was needed

The previous implementation had several gaps:

- Chat history was converted into one plain string prompt instead of real multi-turn `messages[]`
- There was no role-based conversation dimension on the conversation record
- Streaming capability existed in `llm` but was not connected to chat persistence
- The repository did not contain Prisma migration SQL for chat tables

## API summary

### `GET /chat/conversations`

Query params:

- `page`
- `pageSize`
- `agentKey` optional, used to load history for one role/persona

### `GET /chat/conversations/:id`

Returns one conversation with all messages ordered by `seq ASC`.

### `POST /chat/send`

Request body:

```json
{
  "conversationId": "optional-existing-id",
  "agentKey": "sales-coach",
  "model": "deepseek-chat",
  "message": "Hello"
}
```

Behavior:

- If `conversationId` exists, append the new user message to that conversation
- If `conversationId` is missing, create a new conversation first
- Generate the assistant reply and store it into the placeholder assistant message

### `POST /chat/stream`

Request body is the same as `POST /chat/send`.

SSE event examples:

```text
data: {"type":"conversation","conversationId":"...","userMessageId":"...","assistantMessageId":"..."}

data: {"type":"delta","conversationId":"...","assistantMessageId":"...","content":"Hello"}

data: {"type":"done","conversationId":"...","assistantMessageId":"...","content":"Hello world"}

data: [DONE]
```

Behavior:

- First event returns the generated ids so the frontend can bind UI state immediately
- Stream deltas come from the LLM provider
- When the stream completes, the final assistant message is written back to the database
- If the client disconnects, the in-flight assistant message is marked as `stopped`

### `POST /chat/conversations/:id/stop`

Marks the active assistant message as `stopped` and aborts the in-flight stream if there is one in the current process.

## Frontend integration suggestion

For a role-based chat page, the frontend can follow this sequence:

1. Enter page with one `agentKey`
2. Load `GET /chat/conversations?agentKey=<agentKey>`
3. Click an item and load `GET /chat/conversations/:id`
4. Send follow-up message to `POST /chat/stream` with `conversationId`
5. Click "new chat" and send the first message to `POST /chat/stream` without `conversationId` but with `agentKey`

## Migration

Run:

```bash
pnpm prisma migrate deploy --config prisma.config.ts
```

or in development:

```bash
pnpm prisma migrate dev --config prisma.config.ts
```
