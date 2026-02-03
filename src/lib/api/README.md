# API Client Structure

Clean, feature-based organization for all backend API calls.

## 📁 Directory Structure

```
src/lib/api/
├── kb/                      ← Knowledge Base operations
│   ├── entries.ts          ← CRUD operations (create, update, delete, archive)
│   ├── documents.ts        ← Document upload & processing
│   ├── vectors.ts          ← Vector database operations
│   ├── sync.ts             ← Vector synchronization
│   ├── reads.ts            ← Direct Firebase reads (fast!)
│   └── index.ts            ← Convenience re-exports
│
├── agents/                  ← AI Agent operations
│   ├── test-agent.ts       ← Test agent chat
│   └── index.ts            ← Convenience re-exports
│
├── admin/                   ← Admin operations
│   ├── users.ts            ← User management (CRUD)
│   └── index.ts            ← Convenience re-exports
│
├── system.ts               ← System health monitoring
└── config.ts               ← Shared API configuration
```

## 🎯 Usage Examples

### Import from category index (recommended):
```typescript
import { createKBEntry, getKBEntries, archiveKBEntry } from '@/lib/api/kb'
import { testAgentChat } from '@/lib/api/agents'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api/admin'
import { checkSystemHealth } from '@/lib/api/system'
```

### Import from specific files (optional):
```typescript
import { createKBEntry } from '@/lib/api/kb/entries'
import { uploadDocument } from '@/lib/api/kb/documents'
import { getVectorEntries } from '@/lib/api/kb/vectors'
```

## 📝 Available Functions

### KB Entries (`kb/entries.ts`)
- `createKBEntry(data)` - Create new entry
- `updateKBEntry(id, updates)` - Update existing entry
- `archiveKBEntry(id)` - Soft delete entry
- `restoreKBEntry(id)` - Restore archived entry
- `permanentlyDeleteKBEntry(id)` - Hard delete entry
- `deleteKBEntry(id)` - Alias for archive

### KB Documents (`kb/documents.ts`)
- `uploadDocument(input)` - Upload & process document
- `getDocumentStatus(entryId)` - Check processing status

### KB Vectors (`kb/vectors.ts`)
- `getVectorEntries(limit?)` - Get all vectors
- `deleteVectorEntry(entryId)` - Delete vector & chunks

### KB Sync (`kb/sync.ts`)
- `syncKBEntry(entryId)` - Sync to vector DB

### KB Reads (`kb/reads.ts`)
- `getKBEntries()` - Get all entries (Firebase direct)
- `getKBEntriesByCategory(category)` - Get by category (Firebase direct)

### Agents (`agents/test-agent.ts`)
- `testAgentChat(message, conversationId?)` - Chat with test agent

### Admin Users (`admin/users.ts`)
- `getUsers()` - Get all users (Firebase direct - fast!)
- `createUser(userData)` - Create new user (via backend)
- `updateUser(email, updates)` - Update user details (via backend)
- `deleteUser(email)` - Delete user (via backend)

### System (`system.ts`)
- `checkSystemHealth()` - Check all service health

## 🔧 Configuration

All functions use `VITE_BACKEND_URL` from environment variables:
```env
VITE_BACKEND_URL=http://localhost:8000
```

## ✅ Benefits of This Structure

1. **Clear Separation** - Each file has a single responsibility
2. **Easy to Find** - Logical grouping by feature
3. **Scales Well** - Add new features without bloating existing files
4. **Clean Imports** - Import from `@/lib/api/kb` for convenience
5. **Maintainable** - Each file ~50-150 lines (sweet spot!)
