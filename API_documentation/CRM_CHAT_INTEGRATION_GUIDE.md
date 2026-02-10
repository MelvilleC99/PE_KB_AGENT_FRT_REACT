# CRM Chat Integration Guide

## Overview

This document describes how to integrate a chat interface in your CRM system with the PropertyEngine Knowledge Base backend. Your CRM chat UI will connect directly to our backend API to provide AI-powered support responses, ticket escalation, and feedback collection.

The backend handles all AI processing, knowledge base lookups, ticket creation, and email notifications. Your CRM frontend only needs to:

1. Send user messages and receive responses (Chat)
2. Handle escalation when the bot can't answer confidently (Escalation / Tickets)
3. Allow users to rate responses (Feedback)

---

## Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:8000` |
| Production | `https://knowledge-base-backend-577215182671.us-central1.run.app` |

All endpoint paths below are relative to this base URL.

---

## Authentication

There are **no auth headers, tokens, or API keys** required. User identity is passed inside the request body on every call. Your CRM system is responsible for providing accurate user information in each request.

All requests use:

```
Content-Type: application/json
```

---

## User Information Your CRM Must Provide

Every chat request includes a `user_info` object. Your CRM needs to populate this from its own user/agent data.

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | Yes | Unique identifier for the user in your CRM |
| `email` | string | Yes | User's email address |
| `name` | string | Yes | User's first name or full name |
| `phone` | string | No | User's phone number |
| `agency` | string | Yes | The agency or department the user belongs to |
| `office` | string | Yes | The office or branch location |
| `company` | string | No | Company name |
| `division` | string | No | Division or team within the company |
| `user_type` | string | No | Role type (e.g. "agent", "admin") |

This same user data is also used during escalation (flattened into individual fields - see Escalation section).

---

## Session Management

- **Session IDs are generated client-side.** Your CRM creates the session ID when a new conversation starts.
- **Format:** `"{agentType}-session-{timestamp}"` — e.g. `"support-session-1707500000123"`
- **Reuse** the same session ID for all messages within a single conversation. This is how the backend maintains conversation context.
- **If the backend returns a `session_id`** in a chat response, use that value for all subsequent messages instead.
- **New conversation = new session ID.** When the user starts a fresh chat, generate a new one.

---

## Endpoints

### 1. Chat — Send a Message

Send the user's question and get an AI-generated response.

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/agent/{agent_type}/` |
| Trailing Slash | **Required** |

Where `{agent_type}` is one of: `test`, `support`, `customer`

> For your CRM integration you will most likely use `support` or `customer` depending on the use case. The `test` agent is for internal testing/debugging only.

#### Request Body

```json
{
  "message": "How do I reset a user's password?",
  "session_id": "support-session-1707500000123",
  "user_info": {
    "agent_id": "crm_user_456",
    "email": "jane.smith@company.com",
    "name": "Jane Smith",
    "phone": "+27123456789",
    "agency": "Sales",
    "office": "Cape Town",
    "company": "PropertyEngine",
    "division": "Residential",
    "user_type": "agent"
  }
}
```

#### Response (200 OK)

```json
{
  "response": "To reset a user's password, navigate to Settings > User Management...",
  "session_id": "support-session-1707500000123",
  "timestamp": "2024-02-09T10:30:45.123Z",
  "requires_escalation": false,
  "classification_confidence": 0.92,
  "sources": [
    {
      "title": "Password Reset Guide",
      "confidence": 0.95,
      "entry_type": "how_to",
      "entry_id": "kb_001"
    }
  ]
}
```

**Key fields your UI should use:**

| Field | Type | What to do with it |
|---|---|---|
| `response` | string | Display this as the bot's reply |
| `session_id` | string | Store and reuse for subsequent messages |
| `requires_escalation` | boolean | If `true`, trigger the escalation flow (see below) |
| `sources` | array | Optionally display as reference links |
| `classification_confidence` | number (0-1) | Optionally display as a confidence indicator |

#### Response (429 Rate Limited)

```json
{
  "detail": {
    "reset_in_seconds": 3600
  }
}
```

When you receive a 429, **block the user from sending further messages** and show a message like: *"You've reached your query limit. Please try again in X minutes."*

#### Response (Error — any other non-200)

```json
{
  "detail": "Error description",
  "error": "Error message"
}
```

Show a generic error message to the user: *"Unable to connect right now. Please try again shortly."*

---

### 2. Escalation — Record Failure (Automatic)

When a chat response comes back with `requires_escalation: true`, **immediately call this endpoint** to log the failed interaction. This happens before the user makes any choice.

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/agent-failure/` |
| Trailing Slash | **Required** |

#### Request Body

```json
{
  "session_id": "support-session-1707500000123",
  "agent_id": "crm_user_456",
  "query": "How do I fix error code X1234?",
  "agent_response": "I'm not confident I can help with this specific error.",
  "confidence_score": 0.35,
  "escalation_reason": "low_confidence",
  "user_email": "jane.smith@company.com",
  "user_name": "Jane Smith",
  "user_agency": "Sales",
  "user_office": "Cape Town",
  "agent_type": "support"
}
```

| Field | Type | Description |
|---|---|---|
| `session_id` | string | Current chat session ID |
| `agent_id` | string | User's unique ID from your CRM |
| `query` | string | The question the user asked |
| `agent_response` | string | The bot's response that triggered escalation |
| `confidence_score` | number | The `classification_confidence` from the chat response |
| `escalation_reason` | string | Use `"low_confidence"` or `"no_results"` |
| `user_email` | string | User's email |
| `user_name` | string | User's full name |
| `user_agency` | string | User's agency |
| `user_office` | string | User's office |
| `agent_type` | string | The agent type used (`"support"`, `"customer"`, etc.) |

#### Response (200 OK)

```json
{
  "failure_id": "abc-123-def"
}
```

> **Note:** The backend may return the ID as `failure_id` or `id`. Check `failure_id` first, fall back to `id`.

**Store the `failure_id` — you need it for the next step.**

---

### 3. Escalation — Create Support Ticket (User Accepts)

After recording the failure, prompt the user: *"Would you like to create a support ticket?"*

If the user says **yes**, call this endpoint.

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/agent-failure/{failure_id}/create-ticket` |
| Trailing Slash | **No** |

Where `{failure_id}` is the ID returned from the Record Failure call.

#### Request Body

```json
{
  "conversation_history": [
    {
      "role": "user",
      "content": "How do I fix error code X1234?",
      "timestamp": "2024-02-09T10:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "I'm not confident I can help with this specific error.",
      "timestamp": "2024-02-09T10:30:05.123Z"
    }
  ]
}
```

Send the **full conversation history** for the current session. Each entry needs:

| Field | Type | Description |
|---|---|---|
| `role` | string | `"user"` for user messages, `"assistant"` for bot replies |
| `content` | string | The message text |
| `timestamp` | string | ISO 8601 timestamp |

#### Response (200 OK)

```json
{
  "ticket_id": "12345"
}
```

> **Note:** The backend may return the ID as `ticket_id` or `id`. Check `ticket_id` first, fall back to `id`.

Display a confirmation to the user: *"Ticket #12345 created. Email confirmation sent."*

---

### 4. Escalation — Decline Ticket (User Declines)

If the user says **no** to creating a ticket, call this endpoint.

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/agent-failure/{failure_id}/decline` |
| Trailing Slash | **No** |

Where `{failure_id}` is the ID returned from the Record Failure call.

#### Request Body

**Empty** — no JSON body needed. Just send the POST with the `Content-Type` header.

#### Response (200 OK)

```json
{
  "success": true
}
```

Display: *"No problem! Feel free to ask another question."*

---

### 5. Feedback — Rate a Response

After each bot response (that did **not** trigger escalation), show thumbs up / thumbs down buttons so the user can rate the response.

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `/api/feedback` |
| Trailing Slash | **No** |

#### Request Body

```json
{
  "message_id": "1707500000001",
  "session_id": "support-session-1707500000123",
  "feedback_type": "helpful",
  "query": "How do I reset a password?",
  "response": "To reset a password, navigate to Settings...",
  "agent_type": "support",
  "user_info": {
    "agent_id": "crm_user_456",
    "email": "jane.smith@company.com",
    "full_name": "Jane Smith"
  },
  "confidence_score": 0.95,
  "sources_used": ["Password Reset Guide", "Account Security"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message_id` | string | Yes | Unique ID for the message being rated. Generate as `Date.now().toString()` or use your own unique ID |
| `session_id` | string | Yes | Current chat session ID |
| `feedback_type` | string | Yes | `"helpful"` (thumbs up) or `"unhelpful"` (thumbs down) |
| `query` | string | Yes | The user's original question |
| `response` | string | Yes | The bot's response being rated |
| `agent_type` | string | Yes | `"support"`, `"customer"`, or `"test"` |
| `user_info.agent_id` | string | Yes | User's unique ID |
| `user_info.email` | string | Yes | User's email |
| `user_info.full_name` | string | Yes | User's full name |
| `confidence_score` | number | No | Confidence score from the chat response |
| `sources_used` | string[] | No | Titles of KB sources from the chat response |

#### Response (200 OK)

```json
{
  "success": true
}
```

**Feedback is one-time per message.** Once submitted, disable the feedback buttons for that message.

---

### 6. Health Check (Optional)

Use this to check if the backend is available before starting a chat session.

| Property | Value |
|---|---|
| Method | `GET` |
| URL | `/api/health` |
| Trailing Slash | **No** |
| Suggested Timeout | 15 seconds |

#### Response (200 OK)

```json
{
  "overall_status": "healthy",
  "services": {
    "redis": { "status": "healthy" },
    "firebase": { "status": "healthy" },
    "astra": { "status": "healthy" },
    "openai_chat": { "status": "healthy" },
    "openai_embeddings": { "status": "healthy" }
  },
  "summary": {
    "total": 5,
    "healthy": 5,
    "degraded": 0,
    "down": 0
  }
}
```

Status values: `"healthy"`, `"degraded"`, `"down"`

---

## Complete Flow Diagram

```
USER TYPES MESSAGE
        |
        v
  POST /api/agent/support/
  (message + session_id + user_info)
        |
        v
  BACKEND RESPONDS
        |
        +---> requires_escalation: false
        |           |
        |           v
        |     DISPLAY RESPONSE
        |     Show feedback buttons (thumbs up/down)
        |           |
        |           v
        |     User clicks thumbs up/down
        |           |
        |           v
        |     POST /api/feedback
        |
        +---> requires_escalation: true
                    |
                    v
              DISPLAY RESPONSE
              Auto-call: POST /api/agent-failure/
              (returns failure_id)
                    |
                    v
              PROMPT USER: "Create a support ticket?"
                    |
                    +---> YES
                    |       |
                    |       v
                    |   POST /api/agent-failure/{failure_id}/create-ticket
                    |   Show: "Ticket #12345 created"
                    |
                    +---> NO
                            |
                            v
                        POST /api/agent-failure/{failure_id}/decline
                        Show: "No problem!"
```

---

## Important Notes

### Trailing Slashes
This is critical — some endpoints require a trailing slash and some don't. Getting this wrong will result in 301 redirects or 404 errors.

| Endpoint | Trailing Slash |
|---|---|
| `/api/agent/{type}/` | **Yes** |
| `/api/agent-failure/` | **Yes** |
| `/api/agent-failure/{id}/create-ticket` | No |
| `/api/agent-failure/{id}/decline` | No |
| `/api/feedback` | No |
| `/api/health` | No |

### No Streaming
All chat responses are standard synchronous HTTP. The backend processes the query and returns the full response in a single JSON payload. There is no SSE, WebSocket, or chunked transfer encoding.

### Feedback vs Escalation Are Mutually Exclusive
- If `requires_escalation` is `false` → show feedback buttons (thumbs up/down)
- If `requires_escalation` is `true` → show escalation prompt (create ticket yes/no), **no feedback buttons**

### Rate Limiting
Chat endpoints may return HTTP 429. When this happens, parse `detail.reset_in_seconds` from the response and prevent the user from sending messages until that time has elapsed.

### Error Handling
All error responses return JSON. Common fields are `detail` and/or `error` as strings. Always show a user-friendly message rather than raw error details.
