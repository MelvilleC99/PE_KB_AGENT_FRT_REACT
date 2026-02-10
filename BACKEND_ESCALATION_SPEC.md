# Backend Escalation Logic Specification

## Issue
Frontend shows feedback buttons but NOT the "Create Ticket" option when agent can't answer questions.

## Root Cause
Backend is not returning `requires_escalation: true` in the response when confidence is low.

---

## Current Backend Response (Missing Escalation Flag)

```json
{
  "response": "I'm sorry, I couldn't find relevant information...",
  "session_id": "test-session-123",
  "timestamp": "2026-02-05T10:30:00Z",
  "sources": [],
  "classification_confidence": 0.2,
  "requires_escalation": false  // ❌ Should be TRUE when confidence is low!
}
```

---

## Required Backend Response (With Escalation)

```json
{
  "response": "I'm sorry, I couldn't find relevant information to answer your question.",
  "session_id": "test-session-123",
  "timestamp": "2026-02-05T10:30:00Z",
  "sources": [],
  "classification_confidence": 0.2,
  "requires_escalation": true  // ✅ TRUE triggers ticket creation UI
}
```

---

## When to Set `requires_escalation: true`

### **Condition 1: Low Confidence**
```python
if classification_confidence < 0.5:
    requires_escalation = True
```

### **Condition 2: No Sources Found**
```python
if not sources or len(sources) == 0:
    requires_escalation = True
```

### **Condition 3: Generic "Can't Help" Response**
```python
if "couldn't find" in response.lower() or "unable to" in response.lower():
    requires_escalation = True
```

### **Condition 4: Empty/Failed Search**
```python
if search_results_count == 0:
    requires_escalation = True
```

---

## Python Implementation Example

```python
@app.post("/api/agent/{agent_type}/")
async def agent_endpoint(agent_type: str, request: AgentRequest):
    # ... existing agent logic ...
    
    # After generating response and sources:
    classification_confidence = calculate_confidence(sources)
    
    # ✅ ESCALATION LOGIC
    requires_escalation = False
    
    if classification_confidence < 0.5:
        requires_escalation = True
        logger.info(f"Low confidence ({classification_confidence:.2f}) - requiring escalation")
    
    elif not sources or len(sources) == 0:
        requires_escalation = True
        logger.info("No sources found - requiring escalation")
    
    elif any(phrase in response.lower() for phrase in ["couldn't find", "unable to", "don't have information"]):
        requires_escalation = True
        logger.info("Generic failure response - requiring escalation")
    
    # Build response
    return {
        "response": response,
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "sources": sources,
        "classification_confidence": classification_confidence,
        "requires_escalation": requires_escalation,  # ✅ Include this!
        
        # Optional debug fields
        "enhanced_query": enhanced_query,
        "query_metadata": query_metadata,
        "search_attempts": search_attempts
    }
```

---

## Frontend Behavior (Already Implemented)

### When `requires_escalation: false`
Shows: **👍👎 Feedback Buttons**

### When `requires_escalation: true`
Shows: **🎫 "Would you like to create a support ticket?"**
- User can click "Yes" → Creates Freshdesk ticket
- User can click "No Thanks" → Just closes the prompt

---

## Testing

### Test Case 1: Nonsense Query
```bash
curl -X POST http://localhost:8000/api/agent/test/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "asdfghjkl xyz nonsense",
    "session_id": "test-123"
  }'
```

**Expected Response:**
```json
{
  "response": "I couldn't find relevant information...",
  "requires_escalation": true  // ✅
}
```

### Test Case 2: Valid Question
```bash
curl -X POST http://localhost:8000/api/agent/test/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a listing?",
    "session_id": "test-123"
  }'
```

**Expected Response:**
```json
{
  "response": "To create a listing, follow these steps...",
  "sources": [{...}],
  "classification_confidence": 0.92,
  "requires_escalation": false  // ✅
}
```

---

## Configuration (Recommended)

Make the threshold configurable:

```python
# config.py or environment variables
ESCALATION_CONFIDENCE_THRESHOLD = float(os.getenv("ESCALATION_THRESHOLD", "0.5"))

# In agent endpoint:
if classification_confidence < ESCALATION_CONFIDENCE_THRESHOLD:
    requires_escalation = True
```

---

## Current Issue Summary

✅ **Frontend:** Correctly checks for `requires_escalation` field  
❌ **Backend:** Not setting `requires_escalation: true` when it should  
🎯 **Fix:** Add escalation logic to all agent endpoints

---

## Endpoints to Update

All three agent endpoints need this logic:
- `POST /api/agent/test/`
- `POST /api/agent/support/`
- `POST /api/agent/customer/`

---

## Questions?
Contact: [Your Team]
