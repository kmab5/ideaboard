# IdeaBoard Entity Relationship Diagram (ERD)

**Version:** 1.0  
**Date:** December 28, 2025  
**Database:** PostgreSQL (Supabase)

---

## Visual ERD

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    IDEABOARD ERD                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │   auth.users     │
                                    │   (Supabase)     │
                                    ├──────────────────┤
                                    │ id (PK)          │
                                    │ email            │
                                    │ encrypted_pass   │
                                    │ ...              │
                                    └────────┬─────────┘
                                             │
                                             │ 1:1
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PROFILES                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ id              UUID        PK, FK → auth.users(id) ON DELETE CASCADE                        │
│ display_name    VARCHAR(100) NOT NULL                                                         │
│ bio             TEXT                                                                          │
│ avatar_url      TEXT                                                                          │
│ avatar_type     ENUM        'custom' | 'dicebear'                                            │
│ dicebear_seed   VARCHAR(255)                                                                  │
│ dicebear_style  ENUM        'adventurer' | 'avataaars' | 'bottts' | ...                      │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                                                     │
│ updated_at      TIMESTAMPTZ DEFAULT NOW()                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
                                             │ 1:N
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        STORIES                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ id              UUID        PK, DEFAULT uuid_generate_v4()                                   │
│ user_id         UUID        FK → profiles(id) ON DELETE CASCADE                              │
│ title           VARCHAR(255) NOT NULL                                                         │
│ description     TEXT                                                                          │
│ thumbnail_url   TEXT                                                                          │
│ is_archived     BOOLEAN     DEFAULT FALSE                                                     │
│ is_favorite     BOOLEAN     DEFAULT FALSE                                                     │
│ settings        JSONB       DEFAULT '{}'                                                      │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                                                     │
│ updated_at      TIMESTAMPTZ DEFAULT NOW()                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
           │                          │                              │
           │ 1:N                      │ 1:N                          │ 1:N
           ▼                          ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────────────────────────┐
│   BOARD_FOLDERS     │    │     COMPONENTS      │    │               BOARDS                  │
├─────────────────────┤    ├─────────────────────┤    ├──────────────────────────────────────┤
│ id         UUID  PK │    │ id         UUID  PK │    │ id            UUID        PK         │
│ story_id   UUID  FK │    │ story_id   UUID  FK │    │ story_id      UUID        FK         │
│ name       VARCHAR  │    │ name       VARCHAR  │    │ folder_id     UUID        FK (opt)   │
│ color      VARCHAR  │    │ type       ENUM     │    │ title         VARCHAR(255) NOT NULL  │
│ sort_order INTEGER  │    │ default_value JSONB │    │ description   TEXT                   │
│ created_at TIMESTAMP│    │ current_value JSONB │    │ thumbnail_url TEXT                   │
│ updated_at TIMESTAMP│    │ description  TEXT   │    │ sort_order    INTEGER                │
└─────────────────────┘    │ color_tag  VARCHAR  │    │ viewport_x    REAL        DEFAULT 0  │
                           │ sort_order INTEGER  │    │ viewport_y    REAL        DEFAULT 0  │
                           │ created_at TIMESTAMP│    │ viewport_zoom REAL        DEFAULT 1  │
                           │ updated_at TIMESTAMP│    │ settings      JSONB                  │
                           │                     │    │ created_at    TIMESTAMPTZ            │
                           │ UNIQUE(story_id,    │    │ updated_at    TIMESTAMPTZ            │
                           │        name)        │    └──────────────────────────────────────┘
                           └─────────────────────┘              │              │
                                      ▲                         │              │
                                      │                         │ 1:N          │ 1:N
                                      │ referenced by           ▼              ▼
                                      │              ┌─────────────────┐  ┌─────────────────┐
                                      │              │   CONTAINERS    │  │     NOTES       │
                                      │              ├─────────────────┤  ├─────────────────┤
                                      │              │ id       UUID PK│  │ id       UUID PK│
                                      │              │ story_id UUID FK│  │ board_id UUID FK│
                                      │              │ board_id UUID FK│  │ container_id FK │
                                      │              │ name     VARCHAR│  │ type     ENUM   │
                                      │              │ description TEXT│  │ title    VARCHAR│
                                      │              │ position_x REAL │  │ content  JSONB  │
                                      │              │ position_y REAL │  │ position_x REAL │
                                      │              │ width      REAL │  │ position_y REAL │
                                      │              │ height     REAL │  │ width      REAL │
                                      │              │ color    VARCHAR│  │ height     REAL │
                                      │              │ background_     │  │ color    VARCHAR│
                                      │              │   opacity  REAL │  │ is_collapsed BOO│
                                      │              │ is_collapsed BOO│  │ is_locked   BOOL│
                                      │              │ is_locked   BOOL│  │ z_index  INTEGER│
                                      │              │ mini_board_data │  │ condition_data  │
                                      │              │           JSONB │  │           JSONB │
                                      │              │ z_index  INTEGER│  │ technical_data  │
                                      │              │ created_at      │  │           JSONB │
                                      │              │ updated_at      │  │ drawing_data    │
                                      │              │                 │  │           JSONB │
                                      │              │ UNIQUE(board_id,│  │ tags     TEXT[] │
                                      │              │        name)    │  │ created_at      │
                                      │              └─────────────────┘  │ updated_at      │
                                      │                                   └─────────────────┘
                                      │                                           │
                                      │                              ┌────────────┴────────────┐
                                      │                              │                         │
                                      │                              │ source/target           │
                                      │                              ▼                         │
                                      │              ┌──────────────────────────────────────────┐
                                      │              │              CONNECTIONS                 │
                                      │              ├──────────────────────────────────────────┤
                                      │              │ id              UUID        PK           │
                                      │              │ board_id        UUID        FK → boards  │
                                      │              │ source_note_id  UUID        FK → notes   │
                                      │              │ target_note_id  UUID        FK → notes   │
                                      │              │ source_anchor   ENUM        top|bottom|.│
                                      │              │ target_anchor   ENUM        top|bottom|.│
                                      │              │ label           VARCHAR(255)             │
                                      │              │ color           VARCHAR(7)  DEFAULT #000│
                                      │              │ style           ENUM        solid|dashed│
                                      │              │ thickness       INTEGER     1-5          │
                                      │              │ arrow_type      ENUM        none|single │
                                      │              │ curvature       ENUM        straight|.. │
                                      │              │ branch_label    VARCHAR(50)              │
                                      │              │ branch_order    INTEGER                  │
                                      │              │ created_at      TIMESTAMPTZ              │
                                      │              │ updated_at      TIMESTAMPTZ              │
                                      │              │                                          │
                                      │              │ UNIQUE(source_note_id, target_note_id,  │
                                      │              │        source_anchor, target_anchor)    │
                                      │              └──────────────────────────────────────────┘
                                      │
                           ┌──────────┴───────────────────────────────────────────────┐
                           │                  COMPONENT_REFERENCES                     │
                           ├───────────────────────────────────────────────────────────┤
                           │ id             UUID        PK                             │
                           │ component_id   UUID        FK → components ON DELETE CASC │
                           │ note_id        UUID        FK → notes (nullable)          │
                           │ container_id   UUID        FK → containers (nullable)     │
                           │ reference_type VARCHAR(50) 'content'|'condition'|'tech'  │
                           │ created_at     TIMESTAMPTZ                                │
                           │                                                           │
                           │ CHECK (note_id IS NOT NULL OR container_id IS NOT NULL)  │
                           └───────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    STORY_SHARES                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ id                  UUID        PK                                                           │
│ story_id            UUID        FK → stories ON DELETE CASCADE                               │
│ share_token         VARCHAR(64) UNIQUE (for link sharing)                                    │
│ permission_level    VARCHAR(20) 'view' | 'comment' | 'edit'                                  │
│ password_hash       VARCHAR(255) (optional)                                                   │
│ expires_at          TIMESTAMPTZ  (optional)                                                   │
│ shared_with_user_id UUID        FK → profiles (for user-specific sharing)                    │
│ created_at          TIMESTAMPTZ                                                               │
│ updated_at          TIMESTAMPTZ                                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VERSION_HISTORY                                             │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ id                 UUID        PK                                                            │
│ entity_type        VARCHAR(50) 'story' | 'board' | 'note' | 'component' | 'container' | ... │
│ entity_id          UUID        (references various tables)                                   │
│ snapshot           JSONB       (full entity state at time of change)                         │
│ changed_by         UUID        FK → profiles (nullable)                                      │
│ change_type        VARCHAR(20) 'create' | 'update' | 'delete'                                │
│ change_description TEXT                                                                       │
│ created_at         TIMESTAMPTZ                                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Relationships Summary

| Parent | Child | Relationship | On Delete |
|--------|-------|--------------|-----------|
| auth.users | profiles | 1:1 | CASCADE |
| profiles | stories | 1:N | CASCADE |
| stories | board_folders | 1:N | CASCADE |
| stories | components | 1:N | CASCADE |
| stories | boards | 1:N | CASCADE |
| stories | containers | 1:N | CASCADE |
| board_folders | boards | 1:N | SET NULL |
| boards | containers | 1:N | CASCADE |
| boards | notes | 1:N | CASCADE |
| boards | connections | 1:N | CASCADE |
| containers | notes | 1:N | SET NULL |
| notes | connections (source) | 1:N | CASCADE |
| notes | connections (target) | 1:N | CASCADE |
| components | component_references | 1:N | CASCADE |
| notes | component_references | 1:N | CASCADE |
| containers | component_references | 1:N | CASCADE |
| stories | story_shares | 1:N | CASCADE |
| profiles | story_shares | 1:N | CASCADE |
| profiles | version_history | 1:N | SET NULL |

---

## Enum Types

### avatar_type
```sql
'custom' | 'dicebear'
```

### dicebear_style
```sql
'adventurer' | 'adventurer-neutral' | 'avataaars' | 'avataaars-neutral' | 
'big-ears' | 'big-ears-neutral' | 'big-smile' | 'bottts' | 'bottts-neutral' | 
'croodles' | 'croodles-neutral' | 'fun-emoji' | 'icons' | 'identicon' | 
'initials' | 'lorelei' | 'lorelei-neutral' | 'micah' | 'miniavs' | 
'notionists' | 'notionists-neutral' | 'open-peeps' | 'personas' | 
'pixel-art' | 'pixel-art-neutral' | 'shapes' | 'thumbs'
```

### component_type
```sql
'number' | 'string' | 'boolean' | 'list'
```

### note_type
```sql
'normal' | 'drawing' | 'conditional' | 'technical'
```

### anchor_position
```sql
'top' | 'bottom' | 'left' | 'right'
```

### line_style
```sql
'solid' | 'dashed' | 'dotted'
```

### arrow_type
```sql
'none' | 'single' | 'double'
```

### curvature_type
```sql
'straight' | 'curved' | 'orthogonal'
```

---

## Indexes

### Primary Indexes (Automatic)
- All `id` columns (Primary Keys)

### Foreign Key Indexes
```sql
idx_stories_user_id              ON stories(user_id)
idx_components_story_id          ON components(story_id)
idx_board_folders_story_id       ON board_folders(story_id)
idx_boards_story_id              ON boards(story_id)
idx_boards_folder_id             ON boards(folder_id)
idx_containers_story_id          ON containers(story_id)
idx_containers_board_id          ON containers(board_id)
idx_notes_board_id               ON notes(board_id)
idx_notes_container_id           ON notes(container_id)
idx_connections_board_id         ON connections(board_id)
idx_connections_source           ON connections(source_note_id)
idx_connections_target           ON connections(target_note_id)
idx_component_refs_component     ON component_references(component_id)
idx_component_refs_note          ON component_references(note_id)
idx_component_refs_container     ON component_references(container_id)
idx_story_shares_story           ON story_shares(story_id)
idx_story_shares_token           ON story_shares(share_token)
idx_story_shares_user            ON story_shares(shared_with_user_id)
idx_version_history_entity       ON version_history(entity_type, entity_id)
```

### Query Optimization Indexes
```sql
idx_stories_user_archived        ON stories(user_id, is_archived)
idx_stories_user_favorite        ON stories(user_id, is_favorite)
idx_stories_updated_at           ON stories(updated_at DESC)
idx_components_name              ON components(story_id, name)
idx_boards_story_order           ON boards(story_id, sort_order)
idx_containers_name              ON containers(story_id, name)
idx_notes_type                   ON notes(board_id, type)
idx_notes_position               ON notes(board_id, position_x, position_y)
idx_version_history_created      ON version_history(created_at DESC)
```

### Full-Text Search Indexes
```sql
idx_notes_content_search         ON notes USING GIN (to_tsvector(...))
idx_stories_title_search         ON stories USING GIN (to_tsvector(...))
```

### Array Indexes
```sql
idx_notes_tags                   ON notes USING GIN(tags)
```

---

## Unique Constraints

| Table | Constraint | Columns |
|-------|------------|---------|
| components | unique_component_name_per_story | (story_id, name) |
| containers | unique_container_name_per_board | (board_id, name) |
| containers | unique_container_name_per_story | (story_id, name) |
| connections | unique_connection | (source_note_id, target_note_id, source_anchor, target_anchor) |
| story_shares | share_token | share_token |

---

## Check Constraints

| Table | Constraint | Condition |
|-------|------------|-----------|
| connections | thickness | thickness >= 1 AND thickness <= 5 |
| story_shares | permission_level | permission_level IN ('view', 'comment', 'edit') |
| component_references | valid_reference | note_id IS NOT NULL OR container_id IS NOT NULL |

---

## JSON/JSONB Schemas

### stories.settings
```json
{
  "theme": "light" | "dark",
  "defaultNoteColor": "#FFFFFF",
  "gridEnabled": true,
  "snapToGrid": false,
  "gridSize": 20
}
```

### boards.settings
```json
{
  "background": "blank" | "dotted" | "lined" | "grid",
  "gridSize": 20,
  "snapToGrid": false
}
```

### notes.content (TipTap/ProseMirror format)
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello " },
        { 
          "type": "componentReference", 
          "attrs": { "componentId": "uuid", "componentName": "health" }
        },
        { "type": "text", "text": " points" }
      ]
    }
  ]
}
```

### notes.condition_data (for conditional notes)
```json
{
  "conditions": [
    {
      "expression": "@health > 50",
      "branchLabel": "healthy",
      "branchOrder": 0
    },
    {
      "expression": "@health > 0",
      "branchLabel": "injured",
      "branchOrder": 1
    }
  ],
  "defaultBranch": "dead"
}
```

### notes.technical_data (for technical notes)
```json
{
  "operations": [
    {
      "componentId": "uuid",
      "componentName": "health",
      "operation": "add",
      "value": 20
    },
    {
      "componentId": "uuid",
      "componentName": "hasKey",
      "operation": "set",
      "value": true
    }
  ]
}
```

### notes.drawing_data (for drawing notes)
```json
{
  "strokes": [
    {
      "id": "stroke-uuid",
      "points": [
        { "x": 10, "y": 20, "pressure": 0.5 },
        { "x": 15, "y": 25, "pressure": 0.6 },
        { "x": 20, "y": 30, "pressure": 0.5 }
      ],
      "color": "#000000",
      "width": 2,
      "opacity": 1.0,
      "tool": "pen"
    }
  ],
  "backgroundColor": "transparent",
  "bounds": {
    "minX": 10,
    "minY": 20,
    "maxX": 100,
    "maxY": 150
  }
}
```

### containers.mini_board_data
```json
{
  "notes": [
    {
      "id": "local-uuid",
      "type": "normal",
      "title": "Mini note",
      "content": {},
      "position_x": 10,
      "position_y": 10,
      "width": 150,
      "height": 100,
      "color": "#FFFFFF"
    }
  ],
  "connections": [
    {
      "id": "local-uuid",
      "source_note_id": "local-uuid-1",
      "target_note_id": "local-uuid-2",
      "label": null
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| avatars | Yes | User profile pictures |
| thumbnails | Yes | Story/board thumbnails |
| attachments | No | File attachments in notes |

### Storage Path Conventions
```
avatars/{user_id}/{filename}
thumbnails/stories/{story_id}/{filename}
thumbnails/boards/{board_id}/{filename}
attachments/{story_id}/{note_id}/{filename}
```

---

*Last Updated: December 28, 2025*
