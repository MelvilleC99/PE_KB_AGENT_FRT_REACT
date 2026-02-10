# Backend Specification: Audit Trail for KB Entries

## Overview

The frontend now tracks **who created, modified, and archived/deleted** KB entries. The backend needs to accept and store these audit trail fields.

---

## 📋 **New Fields to Support**

### **1. Creation Audit Fields**
When creating a new KB entry (`POST /api/kb/entries`):

```json
{
  "type": "definition",
  "title": "Example Entry",
  "content": "...",
  "metadata": { ... },
  "rawFormData": { ... },
  
  // NEW: Creation audit fields
  "createdBy": "agent_123",           // User ID (agent_id or Firebase uid)
  "createdByEmail": "john@example.com",
  "createdByName": "John Smith",
  "createdAt": "2026-02-06T10:30:00.000Z"  // ISO 8601 timestamp
}
```

### **2. Modification Audit Fields**
When updating a KB entry (`PUT /api/kb/entries/{id}`):

```json
{
  "title": "Updated Title",
  "content": "...",
  "metadata": { ... },
  
  // NEW: Last modification audit fields
  "lastModifiedBy": "agent_456",
  "lastModifiedByEmail": "jane@example.com",
  "lastModifiedByName": "Jane Doe",
  "lastModifiedAt": "2026-02-06T11:45:00.000Z",
  "updatedAt": "2026-02-06T11:45:00.000Z"  // Also update standard timestamp
}
```

### **3. Archive/Delete Audit Fields**
When archiving a KB entry (`POST /api/kb/entries/{id}/archive`):

```json
{
  // NEW: Archive audit fields (sent in request body)
  "archivedBy": "agent_789",
  "archivedByEmail": "admin@example.com",
  "archivedByName": "Admin User",
  "archivedAt": "2026-02-06T12:00:00.000Z",
  "reason": "User archived from Firebase page"  // Optional reason
}
```

---

## 🔧 **Backend Implementation Requirements**

### **1. Firestore Schema Updates**

Update your Firestore documents to include these fields:

```python
# Example: When creating an entry
entry_data = {
    "id": entry_id,
    "type": request.type,
    "title": request.title,
    "content": request.content,
    "metadata": request.metadata,
    "rawFormData": request.rawFormData,
    
    # Existing timestamps
    "createdAt": firestore.SERVER_TIMESTAMP,
    "updatedAt": firestore.SERVER_TIMESTAMP,
    
    # NEW: Creation audit trail
    "createdBy": request.get("createdBy", "system"),
    "createdByEmail": request.get("createdByEmail", "unknown"),
    "createdByName": request.get("createdByName", "System"),
    
    # Initialize modification fields as None
    "lastModifiedBy": None,
    "lastModifiedByEmail": None,
    "lastModifiedByName": None,
    "lastModifiedAt": None,
    
    # Initialize archive fields as None
    "archivedBy": None,
    "archivedByEmail": None,
    "archivedByName": None,
    "archivedAt": None,
    "archivedReason": None
}
```

### **2. Pydantic Model Updates**

Update your Pydantic models to accept these optional fields:

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class KBEntryCreate(BaseModel):
    type: str
    title: str
    content: str
    metadata: dict
    rawFormData: Optional[dict] = None
    
    # NEW: Creation audit fields (optional with defaults)
    createdBy: Optional[str] = "system"
    createdByEmail: Optional[str] = "unknown"
    createdByName: Optional[str] = "System"
    createdAt: Optional[str] = None  # Will use SERVER_TIMESTAMP if not provided

class KBEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None
    rawFormData: Optional[dict] = None
    userType: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    
    # NEW: Modification audit fields
    lastModifiedBy: Optional[str] = None
    lastModifiedByEmail: Optional[str] = None
    lastModifiedByName: Optional[str] = None
    lastModifiedAt: Optional[str] = None
    updatedAt: Optional[str] = None

class KBEntryArchive(BaseModel):
    # NEW: Archive audit fields
    archivedBy: Optional[str] = None
    archivedByEmail: Optional[str] = None
    archivedByName: Optional[str] = None
    archivedAt: Optional[str] = None
    reason: Optional[str] = "Archived by user"
```

### **3. Endpoint Updates**

#### **POST /api/kb/entries** (Create)
```python
@router.post("/kb/entries")
async def create_kb_entry(entry: KBEntryCreate):
    """Create a new KB entry with creation audit trail"""
    
    entry_data = {
        "type": entry.type,
        "title": entry.title,
        "content": entry.content,
        "metadata": entry.metadata,
        "rawFormData": entry.rawFormData,
        
        # Timestamps
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        
        # NEW: Store creation audit trail
        "createdBy": entry.createdBy,
        "createdByEmail": entry.createdByEmail,
        "createdByName": entry.createdByName,
        
        # Initialize other audit fields
        "lastModifiedBy": None,
        "lastModifiedByEmail": None,
        "lastModifiedByName": None,
        "lastModifiedAt": None,
        "archivedBy": None,
        "archivedByEmail": None,
        "archivedByName": None,
        "archivedAt": None,
        "archivedReason": None
    }
    
    # Save to Firestore
    doc_ref = firestore_db.collection("kb_entries").add(entry_data)
    
    return {"success": True, "entry_id": doc_ref[1].id}
```

#### **PUT /api/kb/entries/{id}** (Update)
```python
@router.put("/kb/entries/{id}")
async def update_kb_entry(id: str, updates: KBEntryUpdate):
    """Update a KB entry with modification audit trail"""
    
    update_data = {}
    
    # Only include fields that were provided
    if updates.title is not None:
        update_data["title"] = updates.title
    if updates.content is not None:
        update_data["content"] = updates.content
    if updates.metadata is not None:
        update_data["metadata"] = updates.metadata
    if updates.rawFormData is not None:
        update_data["rawFormData"] = updates.rawFormData
    
    # Always update timestamp
    update_data["updatedAt"] = firestore.SERVER_TIMESTAMP
    
    # NEW: Store modification audit trail if provided
    if updates.lastModifiedBy:
        update_data["lastModifiedBy"] = updates.lastModifiedBy
    if updates.lastModifiedByEmail:
        update_data["lastModifiedByEmail"] = updates.lastModifiedByEmail
    if updates.lastModifiedByName:
        update_data["lastModifiedByName"] = updates.lastModifiedByName
    if updates.lastModifiedAt:
        update_data["lastModifiedAt"] = updates.lastModifiedAt
    
    # Update Firestore
    firestore_db.collection("kb_entries").document(id).update(update_data)
    
    return {"success": True}
```

#### **POST /api/kb/entries/{id}/archive** (Archive)
```python
@router.post("/kb/entries/{id}/archive")
async def archive_kb_entry(id: str, archive_info: KBEntryArchive = None):
    """Archive a KB entry with archive audit trail"""
    
    update_data = {
        "archived": True,
        "archivedAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }
    
    # NEW: Store archive audit trail if provided
    if archive_info:
        if archive_info.archivedBy:
            update_data["archivedBy"] = archive_info.archivedBy
        if archive_info.archivedByEmail:
            update_data["archivedByEmail"] = archive_info.archivedByEmail
        if archive_info.archivedByName:
            update_data["archivedByName"] = archive_info.archivedByName
        if archive_info.reason:
            update_data["archivedReason"] = archive_info.reason
    
    # Update Firestore
    firestore_db.collection("kb_entries").document(id).update(update_data)
    
    return {"success": True}
```

---

## 🧪 **Testing**

### **Test 1: Create Entry with Audit Trail**
```bash
curl -X POST http://localhost:8000/api/kb/entries \
  -H "Content-Type: application/json" \
  -d '{
    "type": "definition",
    "title": "Test Entry",
    "content": "Test content",
    "metadata": {"entryType": "definition"},
    "createdBy": "agent_123",
    "createdByEmail": "test@example.com",
    "createdByName": "Test User"
  }'
```

Expected: Entry created with `createdBy`, `createdByEmail`, `createdByName` stored in Firestore.

### **Test 2: Update Entry with Audit Trail**
```bash
curl -X PUT http://localhost:8000/api/kb/entries/{entry_id} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "lastModifiedBy": "agent_456",
    "lastModifiedByEmail": "editor@example.com",
    "lastModifiedByName": "Editor User",
    "lastModifiedAt": "2026-02-06T12:00:00.000Z"
  }'
```

Expected: Entry updated with `lastModifiedBy` fields stored. Should return `200 OK`, **NOT 422**.

### **Test 3: Archive Entry with Audit Trail**
```bash
curl -X POST http://localhost:8000/api/kb/entries/{entry_id}/archive \
  -H "Content-Type: application/json" \
  -d '{
    "archivedBy": "agent_789",
    "archivedByEmail": "admin@example.com",
    "archivedByName": "Admin User",
    "reason": "Outdated content"
  }'
```

Expected: Entry archived with `archivedBy` fields stored.

---

## ⚠️ **Current Issue**

The frontend is **already sending** these fields, but the backend is returning:

```
422 Unprocessable Entity
PUT /api/kb/entries/8TDszdEeMHvq0pgSrbbw
```

This suggests:
1. Pydantic validation is rejecting the new fields
2. Or the fields are not declared in the model

**Solution:** Update Pydantic models to accept these fields as **optional** (with defaults).

---

## 📊 **Benefits**

Once implemented, you'll be able to:
- Track who created each KB entry
- Track who last modified each entry
- Track who archived/deleted entries
- Build audit logs and reports
- Show "Last edited by..." in the UI
- Comply with data governance requirements

---

## 🚀 **Priority**

**HIGH** - The frontend is already deployed and sending these fields. Update endpoints ASAP to prevent 422 errors.
