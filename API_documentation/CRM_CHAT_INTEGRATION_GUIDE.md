# CRM Chat Integration Guide

## Product Overview — Customer Chat Agent

This section explains how the customer-facing chat agent works from a product perspective. It is intended for product managers and stakeholders who need to understand the user experience before diving into technical details.

### What It Does

The customer chat agent is an AI-powered support assistant embedded in the CRM. When a user (typically a property agent or customer) has a question about PropertyEngine, they type it into a chat window. The system searches our knowledge base, finds the most relevant information, and responds with a helpful answer — all in real time.

### The User Journey

**Step 1 — User Opens Chat**
The user sees a chat window with a welcome message. Their identity (name, email, agency, office) is automatically pulled from the CRM — they don't need to log in or identify themselves.

**Step 2 — User Asks a Question**
The user types a question, e.g. "How do I process a refund?" and hits send. While the backend processes the request, a loading indicator is shown.

**Step 3 — Bot Responds**
The backend searches the knowledge base, finds matching articles, and generates a response. The user sees:
- The AI-generated answer
- Source references (the KB articles used to build the answer)
- A confidence score indicating how sure the system is about the answer

**Step 4a — Good Answer (Confident Response)**
If the system is confident in its answer, the user sees **feedback buttons** (thumbs up / thumbs down) below the response. This lets them rate whether the answer was helpful. Feedback is one-time per message — once rated, the buttons are disabled. The user can then continue asking more questions in the same session.

**Step 4b — Poor Answer (Low Confidence / Escalation)**
If the system is **not confident** it found a good answer, it flags the response for escalation. Instead of feedback buttons, the user sees a prompt:

> "I couldn't find a confident answer. Would you like to create a support ticket?"

The user has two options:
- **"Yes, Create Ticket"** — A support ticket is automatically created in Freshdesk with all the context: who the user is, what they asked, what the bot replied, and the full conversation history. The user sees a personalised confirmation: *"Hi Jane, I've created support ticket #9630 for you and emailed a copy to jane@company.com for your reference. A support agent will reach out to you shortly with more details."*
- **"No Thanks"** — The ticket prompt is dismissed and the user can continue chatting.

### What Happens Behind the Scenes

| Step | What the user sees | What happens in the backend |
|---|---|---|
| User sends message | Loading spinner | Message sent to AI agent with user context and session history |
| Bot responds (confident) | Answer + feedback buttons | Knowledge base searched, best match found, response generated |
| Bot responds (low confidence) | Answer + ticket prompt | Same as above, but confidence below threshold triggers escalation flag |
| User creates ticket | Confirmation with ticket number | Failure logged in Firebase, ticket created in Freshdesk, email sent to user |
| User gives feedback | "Thanks!" indicator | Feedback recorded with full context (question, answer, user, confidence) |

### Session Behaviour

- Each conversation is a **session**. The backend tracks context across messages within a session, so follow-up questions work naturally.
- Sessions are **not persistent** — if the user refreshes the page or closes the chat, the session ends and a new one starts.
- There is **rate limiting** — users can only send a set number of queries per time period. If they hit the limit, they see a message telling them when they can try again.

### Key Business Rules

1. **Feedback and escalation are mutually exclusive** — a message either gets feedback buttons OR an escalation prompt, never both.
2. **Tickets are created in Freshdesk** — the backend handles the Freshdesk integration. The chat UI never talks to Freshdesk directly.
3. **Email confirmations are automatic** — when a ticket is created, the backend sends a confirmation email to the user.
4. **All interactions are logged** — every question, answer, feedback rating, and ticket creation is recorded for analytics and audit purposes.
5. **No authentication required from the chat UI** — user identity is passed with each request from the CRM's existing user data.

### Agent Types

| Agent | Purpose | Audience |
|---|---|---|
| `customer` | Customer-facing support | End users / property agents |
| `support` | Internal support agent | Internal staff |
| `test` | Debug & testing | Developers only — includes detailed debug metrics |

For the CRM integration, you will use the **customer** agent. The API contract is identical across all three — only the backend behaviour and response detail level differs.

---

## Technical Integration Guide

The sections below are for the **development team** building the CRM chat integration. They describe the exact API endpoints, request/response formats, and implementation details.

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
                    |   Show: "Hi {name}, I've created support ticket #{id}
                    |          for you and emailed a copy to {email}..."
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
