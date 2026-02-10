# Backend Endpoint Specification: Duplicate Check

## Overview
This endpoint checks for duplicate or similar entries before creating new KB entries.  
Uses **vector similarity search** in Astra DB to find semantically similar content.

---

## Endpoint

```
POST /api/kb/check-duplicates
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "title": "string",      // Entry title (required)
  "content": "string",    // Full entry content (required)
  "type": "string"        // Entry type: "definition", "how_to", "error", etc. (required)
}
```

### Example Request
```json
{
  "title": "How to create a listing",
  "content": "Step 1: Navigate to properties...\nStep 2: Click Add New...",
  "type": "how_to"
}
```

---

## Response

### Success Response (200 OK)

#### No duplicates found:
```json
{
  "has_duplicates": false,
  "similar_entries": []
}
```

#### Duplicates found:
```json
{
  "has_duplicates": true,
  "similar_entries": [
    {
      "id": "abc123xyz",
      "title": "Creating a New Listing",
      "similarity_score": 0.92,
      "type": "how_to",
      "category": "portal",
      "content_snippet": "Step 1: Navigate to properties section...",
      "created_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "def456uvw",
      "title": "Add Property Workflow",
      "similarity_score": 0.78,
      "type": "workflow",
      "category": "portal",
      "content_snippet": "This workflow explains how to add...",
      "created_at": "2025-12-20T14:22:00Z"
    }
  ]
}
```

### Error Response (500 Internal Server Error)
```json
{
  "error": "Failed to check duplicates",
  "detail": "Astra DB connection error"
}
```

---

## Implementation Details

### Algorithm
1. **Generate embedding** for the incoming content using OpenAI embedding model
2. **Vector search** in Astra DB using cosine similarity
3. **Filter results** with similarity threshold ≥ 0.70 (70%)
4. **Sort by similarity** (highest first)
5. **Limit to top 5** similar entries
6. **Return results** with metadata

### Similarity Thresholds
- **0.90 - 1.00**: Very similar (likely duplicate)
- **0.75 - 0.89**: Similar (possible duplicate)
- **0.70 - 0.74**: Somewhat similar (review recommended)
- **< 0.70**: Not similar (don't return)

### Content Snippet
- Return first **200 characters** of content
- Preserve formatting (newlines → spaces)
- Add "..." if truncated

---

## Python Implementation Example

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import openai
from datetime import datetime

router = APIRouter()

class DuplicateCheckRequest(BaseModel):
    title: str
    content: str
    type: str

class SimilarEntry(BaseModel):
    id: str
    title: str
    similarity_score: float
    type: str
    category: Optional[str] = None
    content_snippet: str
    created_at: Optional[str] = None

class DuplicateCheckResponse(BaseModel):
    has_duplicates: bool
    similar_entries: List[SimilarEntry]

@router.post("/api/kb/check-duplicates", response_model=DuplicateCheckResponse)
async def check_duplicates(request: DuplicateCheckRequest):
    try:
        # Step 1: Generate embedding for incoming content
        embedding_response = openai.embeddings.create(
            model="text-embedding-3-large",
            input=request.content
        )
        embedding = embedding_response.data[0].embedding
        
        # Step 2: Vector similarity search in Astra DB
        # Using your existing astra_collection
        results = astra_collection.vector_find(
            vector=embedding,
            limit=5,  # Top 5 similar entries
            include_similarity=True
        )
        
        # Step 3: Filter by threshold and format response
        similar_entries = []
        SIMILARITY_THRESHOLD = 0.70
        
        for doc in results:
            similarity = doc.get('$similarity', 0)
            
            if similarity >= SIMILARITY_THRESHOLD:
                # Extract content snippet (first 200 chars)
                content = doc.get('content', '')
                snippet = content[:200] if len(content) > 200 else content
                
                similar_entries.append(SimilarEntry(
                    id=doc.get('_id', ''),
                    title=doc.get('title', 'Untitled'),
                    similarity_score=round(similarity, 2),
                    type=doc.get('metadata', {}).get('entryType', 'unknown'),
                    category=doc.get('metadata', {}).get('category'),
                    content_snippet=snippet.replace('\n', ' '),
                    created_at=doc.get('createdAt')
                ))
        
        return DuplicateCheckResponse(
            has_duplicates=len(similar_entries) > 0,
            similar_entries=similar_entries
        )
        
    except Exception as e:
        print(f"Duplicate check error: {str(e)}")
        # Fail gracefully - return empty result instead of blocking
        return DuplicateCheckResponse(
            has_duplicates=False,
            similar_entries=[]
        )
```

---

## Important Notes

### Graceful Failure
- If this endpoint fails (timeout, error, etc.), frontend will **continue with save**
- Don't block entry creation if duplicate check fails
- Return `has_duplicates: false` on error to allow save

### Performance
- Target response time: **< 2 seconds**
- Use async/await for embedding generation
- Cache embeddings if possible (future optimization)

### Vector DB Query
- Use your **existing Astra DB collection** (`kb_entries_collection`)
- Use **same embedding model** as regular KB entries (`text-embedding-3-large`)
- Query includes **all entry types** (definition, how_to, error, workflow)

### Testing
```bash
# Test with curl
curl -X POST http://localhost:8000/api/kb/check-duplicates \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to create a listing",
    "content": "Step 1: Navigate to properties...",
    "type": "how_to"
  }'
```

---

## Frontend Integration (Already Implemented)

The frontend now:
1. ✅ Calls this endpoint automatically when user clicks "Create Entry"
2. ✅ Shows loading state: "Checking for duplicates..."
3. ✅ If duplicates found → Shows dialog with similar entries
4. ✅ User can review/compare or proceed anyway
5. ✅ If no duplicates → Saves immediately

---

## Questions?
Contact: [Your Name/Team]
