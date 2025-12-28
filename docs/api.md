# IdeaBoard API Documentation

**Version:** 1.0  
**Base URL:** `https://your-project.supabase.co`  
**Date:** December 28, 2025

---

## Overview

IdeaBoard uses **Supabase** as the backend, which provides:
- **REST API** - Auto-generated from PostgreSQL schema
- **Supabase Auth** - Authentication endpoints
- **Realtime** - WebSocket subscriptions (future)

All data access is controlled by **Row Level Security (RLS)** policies.

---

## Authentication

### Headers

All authenticated requests require:

```http
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
```

### Auth Endpoints

#### Sign Up with Email

```http
POST /auth/v1/signup
Content-Type: application/json
apikey: <supabase_anon_key>
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "data": {
    "display_name": "John Doe"
  }
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "created_at": "2025-12-28T10:00:00Z"
  }
}
```

---

#### Sign In with Email

```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json
apikey: <supabase_anon_key>
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

---

#### Sign In with Google OAuth

```http
GET /auth/v1/authorize?provider=google&redirect_to=<callback_url>
```

**Flow:**
1. Redirect user to this URL
2. User authenticates with Google
3. Supabase redirects back to `callback_url` with tokens

---

#### Sign Out

```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
```

**Response (204 No Content)**

---

#### Get Current User

```http
GET /auth/v1/user
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "user_metadata": {
    "display_name": "John Doe"
  },
  "created_at": "2025-12-28T10:00:00Z"
}
```

---

#### Refresh Token

```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json
apikey: <supabase_anon_key>
```

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

---

#### Reset Password Request

```http
POST /auth/v1/recover
Content-Type: application/json
apikey: <supabase_anon_key>
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

## REST API (Auto-generated)

Base path: `/rest/v1/`

### Common Headers

```http
Authorization: Bearer <access_token>
apikey: <supabase_anon_key>
Content-Type: application/json
Prefer: return=representation  # Return created/updated record
```

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `select` | Columns to return | `select=id,title` |
| `order` | Sort order | `order=created_at.desc` |
| `limit` | Max rows | `limit=10` |
| `offset` | Skip rows | `offset=20` |
| `eq`, `neq` | Equals, not equals | `id=eq.uuid` |
| `gt`, `gte`, `lt`, `lte` | Comparisons | `created_at=gte.2025-01-01` |
| `like`, `ilike` | Pattern matching | `title=ilike.*search*` |
| `in` | In array | `id=in.(uuid1,uuid2)` |
| `is` | Is null/true/false | `is_archived=is.false` |

---

## Profiles

### Get Current User Profile

```http
GET /rest/v1/profiles?id=eq.<user_id>&select=*
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-here",
    "display_name": "John Doe",
    "bio": null,
    "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=abc123",
    "avatar_type": "dicebear",
    "dicebear_seed": "abc123",
    "dicebear_style": "adventurer",
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  }
]
```

### Update Profile

```http
PATCH /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "display_name": "Jane Doe",
  "bio": "Interactive fiction author"
}
```

---

## Stories

### List User Stories

```http
GET /rest/v1/stories?select=*&order=updated_at.desc
Authorization: Bearer <access_token>
```

**Query Examples:**
```http
# Only non-archived
GET /rest/v1/stories?is_archived=is.false&order=updated_at.desc

# Favorites only
GET /rest/v1/stories?is_favorite=is.true&order=title.asc

# Search by title
GET /rest/v1/stories?title=ilike.*adventure*
```

**Response (200 OK):**
```json
[
  {
    "id": "story-uuid",
    "user_id": "user-uuid",
    "title": "My First Story",
    "description": "An epic adventure",
    "thumbnail_url": null,
    "is_archived": false,
    "is_favorite": false,
    "settings": {},
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T12:00:00Z"
  }
]
```

### Get Story by ID

```http
GET /rest/v1/stories?id=eq.<story_id>&select=*
Authorization: Bearer <access_token>
```

### Get Story with Related Data

```http
GET /rest/v1/stories?id=eq.<story_id>&select=*,boards(*),components(*)
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "story-uuid",
    "title": "My Story",
    "boards": [
      {
        "id": "board-uuid",
        "title": "Main Board",
        "sort_order": 0
      }
    ],
    "components": [
      {
        "id": "component-uuid",
        "name": "health",
        "type": "number",
        "default_value": 100
      }
    ]
  }
]
```

### Create Story

```http
POST /rest/v1/stories
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "title": "New Story",
  "description": "Optional description"
}
```

**Note:** `user_id` is automatically set via RLS from the auth token.

**Response (201 Created):**
```json
[
  {
    "id": "new-story-uuid",
    "user_id": "user-uuid",
    "title": "New Story",
    "description": "Optional description",
    "is_archived": false,
    "is_favorite": false,
    "created_at": "2025-12-28T14:00:00Z",
    "updated_at": "2025-12-28T14:00:00Z"
  }
]
```

### Update Story

```http
PATCH /rest/v1/stories?id=eq.<story_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "is_favorite": true
}
```

### Delete Story

```http
DELETE /rest/v1/stories?id=eq.<story_id>
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

---

## Boards

### List Boards in Story

```http
GET /rest/v1/boards?story_id=eq.<story_id>&select=*&order=sort_order.asc
Authorization: Bearer <access_token>
```

### Create Board

```http
POST /rest/v1/boards
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "story_id": "story-uuid",
  "title": "New Board",
  "sort_order": 0
}
```

### Update Board

```http
PATCH /rest/v1/boards?id=eq.<board_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "title": "Renamed Board",
  "viewport_x": 150.5,
  "viewport_y": -200.0,
  "viewport_zoom": 0.8
}
```

### Delete Board

```http
DELETE /rest/v1/boards?id=eq.<board_id>
Authorization: Bearer <access_token>
```

---

## Components

### List Components in Story

```http
GET /rest/v1/components?story_id=eq.<story_id>&select=*&order=sort_order.asc
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "component-uuid",
    "story_id": "story-uuid",
    "name": "health",
    "type": "number",
    "default_value": 100,
    "current_value": 100,
    "description": "Player health points",
    "color_tag": "#FF5733",
    "sort_order": 0,
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  }
]
```

### Create Component

```http
POST /rest/v1/components
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "story_id": "story-uuid",
  "name": "gold",
  "type": "number",
  "default_value": 0,
  "current_value": 0,
  "description": "Player's gold coins"
}
```

### Update Component

```http
PATCH /rest/v1/components?id=eq.<component_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "current_value": 150,
  "description": "Updated description"
}
```

### Delete Component

```http
DELETE /rest/v1/components?id=eq.<component_id>
Authorization: Bearer <access_token>
```

---

## Notes

### List Notes in Board

```http
GET /rest/v1/notes?board_id=eq.<board_id>&select=*
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "note-uuid",
    "board_id": "board-uuid",
    "container_id": null,
    "type": "normal",
    "title": "Start Here",
    "content": {
      "blocks": [
        {
          "type": "paragraph",
          "content": "Welcome to the story!"
        }
      ]
    },
    "position_x": 100.0,
    "position_y": 200.0,
    "width": 200.0,
    "height": 150.0,
    "color": "#FFFFFF",
    "is_collapsed": false,
    "is_locked": false,
    "z_index": 0,
    "condition_data": null,
    "technical_data": null,
    "tags": [],
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  }
]
```

### Create Note

```http
POST /rest/v1/notes
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "board_id": "board-uuid",
  "type": "normal",
  "title": "New Note",
  "content": {
    "blocks": []
  },
  "position_x": 300,
  "position_y": 150,
  "width": 200,
  "height": 150,
  "color": "#FFF9C4"
}
```

### Update Note

```http
PATCH /rest/v1/notes?id=eq.<note_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": {
    "blocks": [
      {
        "type": "paragraph",
        "content": "Updated content with @health reference"
      }
    ]
  },
  "position_x": 350,
  "position_y": 200
}
```

### Batch Update Notes (Position)

For efficient canvas updates, use RPC function:

```http
POST /rest/v1/rpc/batch_update_note_positions
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "updates": [
    { "id": "note-1", "position_x": 100, "position_y": 200 },
    { "id": "note-2", "position_x": 300, "position_y": 400 }
  ]
}
```

### Delete Note

```http
DELETE /rest/v1/notes?id=eq.<note_id>
Authorization: Bearer <access_token>
```

---

## Connections

### List Connections in Board

```http
GET /rest/v1/connections?board_id=eq.<board_id>&select=*
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "connection-uuid",
    "board_id": "board-uuid",
    "source_note_id": "note-1-uuid",
    "target_note_id": "note-2-uuid",
    "source_anchor": "bottom",
    "target_anchor": "top",
    "label": "leads to",
    "color": "#000000",
    "style": "solid",
    "thickness": 2,
    "arrow_type": "single",
    "curvature": "curved",
    "branch_label": null,
    "branch_order": null,
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  }
]
```

### Create Connection

```http
POST /rest/v1/connections
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "board_id": "board-uuid",
  "source_note_id": "note-1-uuid",
  "target_note_id": "note-2-uuid",
  "source_anchor": "bottom",
  "target_anchor": "top",
  "label": "then",
  "color": "#333333",
  "arrow_type": "single"
}
```

### Update Connection

```http
PATCH /rest/v1/connections?id=eq.<connection_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "label": "Updated label",
  "color": "#FF0000"
}
```

### Delete Connection

```http
DELETE /rest/v1/connections?id=eq.<connection_id>
Authorization: Bearer <access_token>
```

---

## Containers

### List Containers in Board

```http
GET /rest/v1/containers?board_id=eq.<board_id>&select=*
Authorization: Bearer <access_token>
```

### Create Container

```http
POST /rest/v1/containers
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body:**
```json
{
  "story_id": "story-uuid",
  "board_id": "board-uuid",
  "name": "Chapter 1",
  "description": "The beginning",
  "position_x": 50,
  "position_y": 50,
  "width": 500,
  "height": 400,
  "color": "#E3F2FD"
}
```

### Update Container

```http
PATCH /rest/v1/containers?id=eq.<container_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

### Delete Container

```http
DELETE /rest/v1/containers?id=eq.<container_id>
Authorization: Bearer <access_token>
```

---

## Storage (File Uploads)

### Upload Avatar

```http
POST /storage/v1/object/avatars/<user_id>/<filename>
Authorization: Bearer <access_token>
Content-Type: image/png
```

**Body:** Binary image data

**Response (200 OK):**
```json
{
  "Key": "avatars/user-uuid/avatar.png"
}
```

### Get Avatar URL

```http
GET /storage/v1/object/public/avatars/<user_id>/<filename>
```

Returns the image file directly (public bucket).

### Delete Avatar

```http
DELETE /storage/v1/object/avatars/<user_id>/<filename>
Authorization: Bearer <access_token>
```

---

## Error Responses

### 400 Bad Request

```json
{
  "code": "PGRST102",
  "details": null,
  "hint": null,
  "message": "Invalid input syntax for type uuid"
}
```

### 401 Unauthorized

```json
{
  "message": "Invalid JWT"
}
```

### 403 Forbidden (RLS)

```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy"
}
```

### 404 Not Found

```json
{
  "code": "PGRST116",
  "details": null,
  "hint": null,
  "message": "The result contains 0 rows"
}
```

### 409 Conflict (Unique Constraint)

```json
{
  "code": "23505",
  "details": "Key (story_id, name)=(uuid, health) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint"
}
```

---

## Rate Limits (Supabase Free Tier)

| Resource | Limit |
|----------|-------|
| API Requests | 500,000/month |
| Database Size | 500 MB |
| Storage | 1 GB |
| Bandwidth | 2 GB/month |
| Concurrent Connections | 60 |

---

*Last Updated: December 28, 2025*
