# Product Requirements Document (PRD)

## IdeaBoard - Visual Note & Idea Organization App

**Version:** 1.0  
**Date:** December 28, 2025  
**Author:** Product Team  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision

IdeaBoard is a visual note-organizing application that enables users to capture, organize, and connect ideas on an infinite digital whiteboard. The app empowers users to think visually by placing movable notes (cards) on a canvas and establishing relationships between ideas using directional arrows, creating dynamic mind maps and concept diagrams.

### 1.2 Problem Statement

Traditional note-taking apps organize information linearly (lists, folders, documents), which doesn't reflect how humans naturally think and connect ideas. Users struggle to:

- Visualize relationships between concepts
- Reorganize ideas fluidly during brainstorming
- See the "big picture" of interconnected thoughts
- Collaborate visually in real-time

### 1.3 Solution

A whiteboard-based note application where:

- Ideas exist as movable, resizable note cards
- Connections between ideas are represented by directional arrows
- The canvas is infinite and zoomable
- Users can think spatially and reorganize freely

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

| Goal             | Description                                             |
| ---------------- | ------------------------------------------------------- |
| User Acquisition | Acquire 100,000 active users within 12 months of launch |
| User Retention   | Achieve 40% monthly active user retention rate          |
| Monetization     | Convert 5% of free users to premium subscribers         |
| Market Position  | Become a top-5 visual thinking tool in app stores       |

### 2.2 Key Performance Indicators (KPIs)

| Metric                   | Target          | Measurement         |
| ------------------------ | --------------- | ------------------- |
| Daily Active Users (DAU) | 25,000+         | Analytics dashboard |
| Boards Created per User  | 5+ avg          | In-app tracking     |
| Session Duration         | 15+ minutes avg | Analytics           |
| Notes per Board          | 20+ avg         | In-app tracking     |
| Connections per Board    | 15+ avg         | In-app tracking     |
| NPS Score                | 50+             | User surveys        |

---

## 3. Target Users

### 3.1 Primary Personas

#### Persona 1: Creative Professional - "Maya"

- **Age:** 28-40
- **Role:** UX Designer, Product Manager, Content Strategist
- **Goals:** Brainstorm ideas, create user flows, map content strategies
- **Pain Points:** Existing tools are too rigid; switching between apps for different thinking stages
- **Tech Comfort:** High

#### Persona 2: Student - "Alex"

- **Age:** 18-25
- **Role:** University student
- **Goals:** Study effectively, connect course concepts, prepare for exams
- **Pain Points:** Linear notes don't show relationships; hard to review interconnected topics
- **Tech Comfort:** High

#### Persona 3: Knowledge Worker - "Jordan"

- **Age:** 30-50
- **Role:** Consultant, Researcher, Analyst
- **Goals:** Organize research, map stakeholder relationships, plan projects
- **Pain Points:** Information overload; difficulty synthesizing complex information
- **Tech Comfort:** Medium-High

#### Persona 4: Entrepreneur - "Sam"

- **Age:** 25-45
- **Role:** Startup founder, Business owner
- **Goals:** Business planning, pitch deck ideation, strategy mapping
- **Pain Points:** Ideas scattered across tools; can't visualize business model connections
- **Tech Comfort:** Medium

#### Persona 5: ChoiceScript Author - "Casey"

- **Age:** 20-40
- **Role:** Interactive fiction writer, Game narrative designer
- **Goals:** Plan branching narratives, track variables/stats across story paths, visualize player choices and consequences
- **Pain Points:** Difficulty tracking story variables across branches; hard to see how choices connect; existing tools don't support conditional logic visualization
- **Tech Comfort:** Medium-High
- **Special Needs:** Variable/component tracking, conditional branching visualization, reference management for story stats

### 3.2 Secondary Personas

- Writers and Authors (plot mapping, character relationships)
- Teachers and Educators (lesson planning, concept teaching)
- Project Managers (workflow visualization)
- Interactive Fiction Developers (Twine, Ink, ChoiceScript)

---

## 4. Core Features

### 4.1 The Whiteboard Canvas

#### 4.1.1 Infinite Canvas

| Requirement        | Description                                    | Priority |
| ------------------ | ---------------------------------------------- | -------- |
| Infinite Scroll    | Canvas extends infinitely in all directions    | P0       |
| Zoom Controls      | Zoom from 10% to 400% with smooth transitions  | P0       |
| Minimap            | Overview navigation panel showing entire board | P1       |
| Grid/Guides        | Optional snap-to-grid and alignment guides     | P1       |
| Background Options | Blank, dotted, lined, or grid backgrounds      | P2       |

#### 4.1.2 Canvas Navigation

- Pan via click-and-drag (middle mouse / two-finger)
- Zoom via scroll wheel / pinch gesture
- Keyboard shortcuts for navigation (Arrow keys, +/-)
- "Fit all to screen" button
- Save and restore viewport positions (bookmarks)

### 4.2 Notes (Cards/Nodes)

#### 4.2.1 Note Types

| Type             | Description                                                | Priority |
| ---------------- | ---------------------------------------------------------- | -------- |
| Normal Note      | Free-form rich text content where users can input anything | P0       |
| Conditional Note | Branching note with conditions that determine flow paths   | P0       |
| Technical Note   | Note for updating/modifying component values               | P0       |
| Image Note       | Embedded images with captions                              | P1       |
| Link Note        | URL previews with thumbnails                               | P1       |
| Checklist Note   | Task lists with checkboxes                                 | P1       |
| Code Note        | Syntax-highlighted code blocks                             | P2       |
| File Note        | Attached documents (PDF, etc.)                             | P2       |
| Embed Note       | YouTube, Figma, Google Docs embeds                         | P2       |

#### 4.2.1.1 Normal Note Details

The default note type for capturing any content:

- Rich text formatting (bold, italic, lists, headings)
- Support for @mentions to reference Components (see 4.6)
- Inline images and links
- Free-form content with no structural constraints

#### 4.2.1.2 Conditional Note Details

Specialized note for branching logic and decision points:

| Feature             | Description                                               | Priority |
| ------------------- | --------------------------------------------------------- | -------- |
| Condition Editor    | Define conditions using components (e.g., `@health > 50`) | P0       |
| Multiple Branches   | Support 2+ outgoing paths based on conditions             | P0       |
| Branch Labels       | Name each branch (e.g., "If true", "If false")            | P0       |
| Else/Default Branch | Fallback path when no conditions match                    | P0       |
| Visual Indicators   | Distinct styling to identify conditional notes            | P0       |
| Condition Preview   | Show evaluated condition in collapsed view                | P1       |

**Condition Syntax Examples:**

- `@strength >= 10` - Check if strength component is 10 or higher
- `@hasKey == true` - Check if boolean component is true
- `@playerName == "Hero"` - String comparison
- `@gold > 100 AND @reputation > 50` - Compound conditions

#### 4.2.1.3 Technical Note Details

Specialized note for modifying component values:

| Feature            | Description                                            | Priority |
| ------------------ | ------------------------------------------------------ | -------- |
| Component Selector | Dropdown/autocomplete to select component to modify    | P0       |
| Operation Type     | Set, Add, Subtract, Multiply, Toggle, Append           | P0       |
| Value Input        | Input field for new value or expression                | P0       |
| Multiple Updates   | Update multiple components in one note                 | P1       |
| Visual Indicators  | Distinct styling (e.g., gear icon) for technical notes | P0       |
| Change Preview     | Show what will change (e.g., "@health + 10")           | P1       |

**Technical Note Examples:**

- Set `@health` to `100`
- Add `10` to `@gold`
- Toggle `@hasVisitedCave` to `true`
- Append `"sword"` to `@inventory`

#### 4.2.2 Note Properties

| Property        | Description                            | Priority |
| --------------- | -------------------------------------- | -------- |
| Title           | Optional header for the note           | P0       |
| Body            | Main content area                      | P0       |
| Color           | Background color (12+ palette options) | P0       |
| Size            | Resizable width and height             | P0       |
| Position        | X, Y coordinates on canvas             | P0       |
| Tags            | Categorization labels                  | P1       |
| Icon/Emoji      | Visual identifier                      | P1       |
| Collapse/Expand | Minimize to title only                 | P1       |
| Lock            | Prevent accidental movement            | P1       |

#### 4.2.3 Note Interactions

- **Create:** Double-click canvas, keyboard shortcut (N), or toolbar button
- **Move:** Drag and drop anywhere on canvas
- **Resize:** Drag corners or edges
- **Edit:** Click to enter edit mode, click outside to save
- **Duplicate:** Ctrl/Cmd + D or context menu
- **Delete:** Delete key or context menu
- **Multi-select:** Shift+click or lasso selection
- **Group Move:** Move multiple selected notes together

### 4.3 Connections (Arrows/Edges)

#### 4.3.1 Connection Types

| Type                | Visual | Use Case                 | Priority |
| ------------------- | ------ | ------------------------ | -------- |
| Directional Arrow   | →      | Shows flow/dependency    | P0       |
| Bidirectional Arrow | ↔      | Mutual relationship      | P1       |
| Dotted Line         | - - →  | Weak/optional connection | P1       |
| Thick Line          | ═══►   | Strong connection        | P1       |
| Custom Color        | Any    | Category coding          | P1       |

#### 4.3.2 Connection Properties

| Property   | Description                  | Priority |
| ---------- | ---------------------------- | -------- |
| Label      | Text on the connection line  | P0       |
| Color      | Line color                   | P0       |
| Style      | Solid, dashed, dotted        | P1       |
| Thickness  | Line weight (1-5px)          | P1       |
| Arrow Type | None, single, double         | P0       |
| Curvature  | Straight, curved, orthogonal | P1       |

#### 4.3.3 Connection Interactions

- **Create:** Drag from note anchor point to another note
- **Anchor Points:** 4 points per note (top, bottom, left, right)
- **Re-route:** Drag connection line to adjust curvature
- **Edit Label:** Click on connection to add/edit label
- **Delete:** Select + Delete key or context menu
- **Auto-routing:** Connections avoid overlapping notes

### 4.4 Organization Features

#### 4.4.1 Frames/Groups

| Feature        | Description                          | Priority |
| -------------- | ------------------------------------ | -------- |
| Frames         | Visual containers for grouping notes | P1       |
| Frame Title    | Named section headers                | P1       |
| Frame Color    | Background tinting                   | P1       |
| Collapse Frame | Hide frame contents                  | P2       |
| Move Frame     | Moves all contained notes            | P1       |

#### 4.4.2 Layers

| Feature          | Description                   | Priority |
| ---------------- | ----------------------------- | -------- |
| Bring to Front   | Change note z-order           | P1       |
| Send to Back     | Change note z-order           | P1       |
| Layer Panels     | Named layers for organization | P2       |
| Layer Visibility | Show/hide layers              | P2       |

#### 4.4.3 Search & Filter

| Feature           | Description                | Priority |
| ----------------- | -------------------------- | -------- |
| Full-text Search  | Search all note content    | P0       |
| Filter by Color   | Show only specific colors  | P1       |
| Filter by Tag     | Show only tagged notes     | P1       |
| Highlight Results | Visual emphasis on matches | P0       |
| Navigate Results  | Jump between matches       | P1       |

### 4.5 Board Management

#### 4.5.1 Board Operations

| Feature          | Description                  | Priority |
| ---------------- | ---------------------------- | -------- |
| Create Board     | New blank or from template   | P0       |
| Rename Board     | Edit board title             | P0       |
| Duplicate Board  | Copy entire board            | P1       |
| Delete Board     | Remove with confirmation     | P0       |
| Archive Board    | Move to archive              | P1       |
| Board Thumbnails | Visual previews in dashboard | P1       |

#### 4.5.2 Multi-Board System

Users can create and manage multiple boards within a single project, enabling complex projects to be organized across separate canvases while maintaining connections between them.

| Feature                | Description                                         | Priority |
| ---------------------- | --------------------------------------------------- | -------- |
| Unlimited Boards       | Create as many boards as needed per project         | P0       |
| Board Tabs             | Quick switching between open boards via tab bar     | P0       |
| Board List Sidebar     | Collapsible sidebar showing all project boards      | P0       |
| Board Search           | Find boards by name or content                      | P1       |
| Board Folders          | Organize boards into folders/categories             | P1       |
| Board Linking          | Create connections/links between boards             | P0       |
| Cross-Board Navigation | Click link to jump to another board                 | P0       |
| Shared Components      | Components can be shared across boards in a project | P1       |
| Board Overview         | Dashboard view showing all boards with thumbnails   | P1       |
| Recent Boards          | Quick access to recently edited boards              | P0       |

#### 4.5.2.1 Board Linking & References

| Feature               | Description                                            | Priority |
| --------------------- | ------------------------------------------------------ | -------- |
| Link to Board         | Use `#boardname` syntax to create board links in notes | P0       |
| Link to Specific Note | Use `#boardname/noteid` to link to a specific note     | P1       |
| Link to Container     | Use `#boardname/containername` to link to a container  | P1       |
| Backlinks             | See which boards/notes link to the current board       | P1       |
| Link Preview          | Hover over link to preview destination board thumbnail | P2       |
| Broken Link Detection | Warning when linked board/note is deleted              | P1       |

#### 4.5.3 Templates

| Template      | Description                            | Priority |
| ------------- | -------------------------------------- | -------- |
| Blank Canvas  | Empty starting point                   | P0       |
| Mind Map      | Central idea with branches             | P1       |
| Flowchart     | Process flow structure                 | P1       |
| Kanban        | Column-based layout                    | P1       |
| SWOT Analysis | 4-quadrant grid                        | P2       |
| User Journey  | Timeline structure                     | P2       |
| Org Chart     | Hierarchical structure                 | P2       |
| Story Branch  | ChoiceScript-style branching narrative | P1       |

### 4.6 Components System

Components are user-defined variables that can be referenced throughout notes using the `@` symbol. This feature is essential for tracking state, statistics, and values across a board—particularly useful for interactive fiction authors, game designers, and anyone managing dynamic data.

#### 4.6.1 Component Types

| Type    | Description                           | Example Values        | Priority |
| ------- | ------------------------------------- | --------------------- | -------- |
| Number  | Numeric values (integers or decimals) | `100`, `3.14`, `-50`  | P0       |
| String  | Text values                           | `"Hero"`, `"sword"`   | P0       |
| Boolean | True/false values                     | `true`, `false`       | P0       |
| List    | Array of values (strings or numbers)  | `["sword", "shield"]` | P1       |

#### 4.6.2 Component Properties

| Property      | Description                                         | Priority |
| ------------- | --------------------------------------------------- | -------- |
| Name          | Unique identifier (used with @ symbol)              | P0       |
| Type          | Data type (Number, String, Boolean, List)           | P0       |
| Default Value | Initial value for the component                     | P0       |
| Description   | User-written explanation of the component's purpose | P0       |
| Current Value | Runtime value (for simulation/preview)              | P1       |
| Color Tag     | Optional color for visual categorization            | P2       |

#### 4.6.3 Component Panel (Floating Window)

A dedicated floating window for managing components:

| Feature              | Description                                         | Priority |
| -------------------- | --------------------------------------------------- | -------- |
| Floating/Draggable   | Window can be positioned anywhere on screen         | P0       |
| Sticky Position      | Stays in position relative to viewport (not canvas) | P0       |
| Collapsible          | Can be minimized to save screen space               | P0       |
| Resizable            | Adjustable width and height                         | P1       |
| Component List       | Scrollable list of all defined components           | P0       |
| Add Component Button | Quick-add new component with type selector          | P0       |
| Inline Editing       | Edit component properties directly in the panel     | P0       |
| Delete Component     | Remove with confirmation (warns if referenced)      | P0       |
| Search/Filter        | Find components by name or description              | P1       |
| Sort Options         | Sort by name, type, or custom order                 | P1       |
| Group by Type        | Organize components by their data type              | P2       |

#### 4.6.4 Component References in Notes

| Feature            | Description                                            | Priority |
| ------------------ | ------------------------------------------------------ | -------- |
| @ Trigger          | Typing `@` opens autocomplete for component names      | P0       |
| Autocomplete       | Fuzzy search through available components              | P0       |
| Inline Display     | Referenced components shown with distinct styling      | P0       |
| Click to Navigate  | Clicking a reference jumps to Component Panel          | P0       |
| Hover Preview      | Hovering shows component description and current value | P1       |
| Invalid Reference  | Visual warning for references to undefined components  | P0       |
| Rename Propagation | Renaming a component updates all references            | P1       |

#### 4.6.5 Component Usage Tracking

| Feature          | Description                                        | Priority |
| ---------------- | -------------------------------------------------- | -------- |
| Reference List   | View all notes that reference a specific component | P0       |
| Go to Reference  | Click to navigate directly to a referencing note   | P0       |
| Usage Count      | Display number of references for each component    | P1       |
| Unused Warning   | Highlight components with zero references          | P2       |
| Dependency Graph | Visual map of component relationships (future)     | P3       |

#### 4.6.6 Component Panel Interactions

**Opening the Panel:**

- Keyboard shortcut (Ctrl/Cmd + Shift + C)
- Toolbar button
- Right-click context menu option

**Panel States:**

- **Expanded:** Full list with all details visible
- **Collapsed:** Minimal bar showing component count
- **Docked:** Optionally dock to left/right edge

**Drag Behavior:**

- Grab title bar to move
- Remembers position between sessions
- Snaps to screen edges
- Cannot be dragged outside viewport

### 4.7 Containers System

Containers allow users to designate and name regions of the whiteboard, creating logical groupings that can be referenced elsewhere in the board or across boards. Unlike simple frames, containers are referenceable entities that integrate with the component system.

#### 4.7.1 Container Basics

| Feature             | Description                                           | Priority |
| ------------------- | ----------------------------------------------------- | -------- |
| Click-Drag Creation | Click and drag on canvas to draw container boundaries | P0       |
| Named Containers    | Each container has a unique, user-defined name        | P0       |
| Resizable           | Drag edges/corners to resize container area           | P0       |
| Movable             | Drag container to reposition (moves all contents)     | P0       |
| Visual Boundary     | Distinct border style to differentiate from frames    | P0       |
| Background Color    | Optional background tint for visual organization      | P1       |
| Description         | Optional description field for container purpose      | P1       |
| Collapse/Expand     | Minimize container to show only header                | P1       |

#### 4.7.2 Container Properties

| Property      | Description                                     | Priority |
| ------------- | ----------------------------------------------- | -------- |
| Name          | Unique identifier (used for references)         | P0       |
| Description   | User-written explanation of container's purpose | P1       |
| Color         | Border and/or background color                  | P1       |
| Position      | X, Y coordinates on canvas                      | P0       |
| Size          | Width and height dimensions                     | P0       |
| Locked        | Prevent accidental movement or resize           | P1       |
| Contents List | Auto-tracked list of notes within the container | P0       |

#### 4.7.3 Container Panel (Floating Window)

A dedicated floating window for managing containers, similar to the Component Panel:

| Feature                | Description                                         | Priority |
| ---------------------- | --------------------------------------------------- | -------- |
| Floating/Draggable     | Window can be positioned anywhere on screen         | P0       |
| Sticky Position        | Stays in position relative to viewport (not canvas) | P0       |
| Collapsible            | Can be minimized to save screen space               | P0       |
| Resizable              | Adjustable width and height                         | P1       |
| Container List         | Scrollable list of all containers in current board  | P0       |
| Add Container Button   | Quick-add via panel (then draw on canvas)           | P1       |
| Inline Editing         | Edit container name/description directly in panel   | P0       |
| Delete Container       | Remove with option to keep or delete contents       | P0       |
| Search/Filter          | Find containers by name or description              | P1       |
| Go to Container        | Click to pan canvas to center on container          | P0       |
| Contents Preview       | Expandable list showing notes inside each container | P1       |
| Cross-Board Containers | Show containers from other boards (for reference)   | P2       |

#### 4.7.4 Container References

Containers can be referenced as read-only components throughout the board:

| Feature                | Description                                                     | Priority |
| ---------------------- | --------------------------------------------------------------- | -------- |
| @ Reference Syntax     | Use `@ContainerName` to reference a container                   | P0       |
| Autocomplete           | Containers appear in @ autocomplete (distinct icon)             | P0       |
| Reference as Component | Container references behave like read-only components           | P0       |
| Click to Navigate      | Clicking reference pans canvas to container location            | P0       |
| Hover Preview          | Show container description and contents count on hover          | P1       |
| Cross-Board Reference  | Reference containers from other boards with `#board/@container` | P1       |
| Contents Access        | Access notes within container via reference (future)            | P3       |

#### 4.7.5 Container vs Frame Comparison

| Feature          | Container                     | Frame                      |
| ---------------- | ----------------------------- | -------------------------- |
| Naming           | Required, unique              | Optional                   |
| Referenceable    | Yes (via @ symbol)            | No                         |
| Panel Management | Yes (Container Panel)         | No                         |
| Cross-Board Link | Yes                           | No                         |
| Purpose          | Logical grouping & references | Visual grouping only       |
| Use Case         | Story scenes, chapters, acts  | Ad-hoc visual organization |

#### 4.7.6 Container Panel Interactions

**Opening the Panel:**

- Keyboard shortcut (Ctrl/Cmd + Shift + T)
- Toolbar button
- Right-click context menu option

**Panel States:**

- **Expanded:** Full list with all details visible
- **Collapsed:** Minimal bar showing container count
- **Docked:** Optionally dock to left/right edge (can stack with Component Panel)

**Drag Behavior:**

- Grab title bar to move
- Remembers position between sessions
- Snaps to screen edges
- Cannot be dragged outside viewport

### 4.8 User Accounts & Authentication

#### 4.8.1 Registration & Login

| Feature                | Description                                        | Priority |
| ---------------------- | -------------------------------------------------- | -------- |
| Email/Password Sign-up | Register with email address and password           | P0       |
| Email Verification     | Confirm email via verification link                | P0       |
| Password Requirements  | Min 8 chars, 1 uppercase, 1 number, 1 special char | P0       |
| Google OAuth           | Sign in with Google account                        | P0       |
| Remember Me            | Persistent login sessions                          | P1       |
| Forgot Password        | Password reset via email link                      | P0       |
| Account Lockout        | Lock after 5 failed attempts (15 min cooldown)     | P1       |

#### 4.8.2 User Profile

| Feature          | Description                                           | Priority |
| ---------------- | ----------------------------------------------------- | -------- |
| Display Name     | User-chosen name shown in app and collaborations      | P0       |
| Profile Picture  | Uploadable avatar image                               | P0       |
| Default Avatar   | Auto-generated DiceBear avatar if no picture uploaded | P0       |
| Avatar Styles    | DiceBear styles: Adventurer, Avataaars, Bottts, etc.  | P1       |
| Email (private)  | Account email, not publicly visible                   | P0       |
| Bio              | Optional short description                            | P2       |
| Profile Settings | Edit display name, avatar, password                   | P0       |

#### 4.8.3 Profile Picture System

| Feature             | Description                                     | Priority |
| ------------------- | ----------------------------------------------- | -------- |
| Upload Custom       | Upload JPG, PNG, GIF (max 5MB)                  | P0       |
| Crop Tool           | Crop/resize uploaded image to square            | P1       |
| DiceBear Default    | Random avatar generated on registration         | P0       |
| DiceBear Regenerate | Button to generate new random avatar            | P1       |
| DiceBear Seed       | Avatar based on user email hash for consistency | P0       |
| Remove Picture      | Revert to DiceBear avatar                       | P0       |

#### 4.8.4 Session Management

| Feature            | Description                             | Priority |
| ------------------ | --------------------------------------- | -------- |
| Active Sessions    | View all logged-in devices/browsers     | P1       |
| Session Revocation | Log out of specific or all sessions     | P1       |
| Session Expiry     | Auto-logout after 30 days of inactivity | P0       |
| Secure Tokens      | JWT with refresh token rotation         | P0       |

### 4.9 Export & Import System

Users can export stories for backup, sharing, or migration purposes. Two formats are supported for single stories, plus bulk export for all stories.

#### 4.9.1 Export Formats

| Format   | Extension | Description                                                    | Priority |
| -------- | --------- | -------------------------------------------------------------- | -------- |
| Full     | `.ibs`    | **I**dea**B**oard **S**tory - compressed archive with ALL data | P0       |
| Portable | `.zip`    | ZIP archive with JSON files, fully importable                  | P0       |
| Bulk     | `.zip`    | ZIP containing multiple `.ibs` files (all user stories)        | P1       |

#### 4.9.2 Full Export (.ibs Format)

The `.ibs` (**I**dea**B**oard **S**tory) format is a custom compressed archive containing complete story data for full backup and restoration.

**Contents:**

```bash
story.ibs (compressed archive)
├── manifest.json           # Version, export date, checksums
├── story.json              # Story metadata and settings
├── components.json         # All components with values
├── boards/
│   ├── {board-id}.json     # Board data, viewport, settings
│   └── ...
├── containers/
│   ├── {container-id}.json # Container data with mini_board_data
│   └── ...
├── notes/
│   ├── {note-id}.json      # Full note data including content
│   └── ...
├── connections/
│   ├── {connection-id}.json
│   └── ...
├── assets/
│   ├── thumbnails/         # Story/board thumbnails
│   └── attachments/        # Embedded file attachments
└── history/                # Optional: version history snapshots
    └── versions.json
```

**manifest.json Structure:**

```json
{
  "format_version": "1.0",
  "app_version": "1.0.0",
  "export_date": "2025-12-29T10:00:00Z",
  "story_id": "uuid",
  "story_title": "My Story",
  "checksum": "sha256-hash",
  "includes_history": true,
  "includes_assets": true,
  "total_boards": 5,
  "total_notes": 120,
  "total_components": 15
}
```

| Feature                  | Description                                    | Priority |
| ------------------------ | ---------------------------------------------- | -------- |
| Complete Data            | All story data including history               | P0       |
| Asset Embedding          | Thumbnails and attachments included            | P0       |
| Compression              | gzip/deflate for smaller file size             | P0       |
| Integrity Check          | SHA-256 checksum for validation                | P1       |
| Version History          | Optional inclusion of version snapshots        | P2       |
| Password Protection      | Optional encryption with user password         | P2       |

#### 4.9.3 Portable Export (.zip Format)

The `.zip` format provides a human-readable, fully importable export. All necessary data is included so the story can be imported back into IdeaBoard.

**Contents:**

```bash
story-export.zip
├── manifest.json           # Format version, export info
├── story.json              # Story metadata and settings
├── components.json         # All components with full data
└── boards/
    ├── {board-name}.json   # Board with embedded notes/connections/containers
    └── ...
```

**story.json Structure:**

```json
{
  "title": "My Story",
  "description": "Story description",
  "settings": {},
  "created_at": "2025-12-29T10:00:00Z",
  "exported_at": "2025-12-29T12:00:00Z"
}
```

**board-{name}.json Structure:**

```json
{
  "title": "Main Board",
  "description": "The main storyline",
  "sort_order": 0,
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "settings": {},
  "notes": [
    {
      "ref_id": "note-1",
      "title": "Chapter 1",
      "type": "normal",
      "content": { "type": "doc", "content": [...] },
      "position": { "x": 100, "y": 100 },
      "size": { "width": 200, "height": 150 },
      "color": "#FFFFFF",
      "tags": ["intro"]
    }
  ],
  "connections": [
    {
      "from_ref": "note-1",
      "to_ref": "note-2",
      "source_anchor": "right",
      "target_anchor": "left",
      "label": "Go north",
      "color": "#333333",
      "style": "solid",
      "thickness": 2,
      "arrow_type": "single",
      "curvature": "curved"
    }
  ],
  "containers": [
    {
      "ref_id": "container-1",
      "name": "Combat Section",
      "description": "All combat scenes",
      "position": { "x": 500, "y": 300 },
      "size": { "width": 400, "height": 300 },
      "color": "#FFF3E0",
      "mini_board_data": {
        "notes": [...],
        "connections": [...]
      }
    }
  ]
}
```

| Feature               | Description                                      | Priority |
| --------------------- | ------------------------------------------------ | -------- |
| Human Readable        | JSON files can be opened in any text editor      | P0       |
| Fully Importable      | Contains all data needed to recreate the story   | P0       |
| Reference IDs         | Uses local ref_ids for cross-referencing         | P0       |
| Rich Text Preserved   | Full TipTap/ProseMirror content structure kept   | P0       |
| Standard ZIP          | Compatible with any ZIP tool                     | P0       |
| Selective Export      | Choose specific boards to export                 | P1       |
| No External Assets    | Thumbnails/attachments not included (lighter)    | P0       |

#### 4.9.4 Bulk Export (All Stories)

Export all user stories in a single ZIP file containing individual `.ibs` files.

**Contents:**

```bash
ideaboard-backup-2025-12-29.zip
├── manifest.json           # Export metadata, story list
├── my-first-story.ibs
├── adventure-game.ibs
├── project-notes.ibs
└── ...
```

**manifest.json Structure:**

```json
{
  "format_version": "1.0",
  "app_version": "1.0.0",
  "export_date": "2025-12-29T10:00:00Z",
  "user_id": "uuid",
  "total_stories": 15,
  "stories": [
    { "filename": "my-first-story.ibs", "title": "My First Story", "boards": 3 },
    { "filename": "adventure-game.ibs", "title": "Adventure Game", "boards": 12 }
  ]
}
```

| Feature               | Description                                    | Priority |
| --------------------- | ---------------------------------------------- | -------- |
| Full Backup           | All stories exported as .ibs files             | P1       |
| Single Download       | One ZIP file for entire account                | P1       |
| Manifest              | Index of all included stories                  | P1       |
| Selective Bulk        | Choose which stories to include                | P2       |
| Scheduled Backup      | Auto-export on schedule (weekly/monthly)       | P2       |

#### 4.9.5 Import System

**Supported Import Formats:**

- `.ibs` - Single story full restore
- `.zip` - Single story portable format
- `.zip` (bulk) - Multiple .ibs files from bulk export

| Feature                  | Description                                        | Priority |
| ------------------------ | -------------------------------------------------- | -------- |
| Import .ibs              | Full restoration of exported story                 | P0       |
| Import .zip (story)      | Restore story from portable format                 | P0       |
| Import .zip (bulk)       | Import multiple stories from bulk export           | P1       |
| Duplicate Detection      | Warn if importing story that already exists        | P1       |
| Import as New            | Always create as new story (new IDs)               | P0       |
| Import & Merge           | Merge into existing story (advanced)               | P2       |
| Conflict Resolution      | Handle component name conflicts                    | P1       |
| Validation               | Check file integrity before import                 | P0       |
| Progress Indicator       | Show import progress for large stories             | P1       |
| Import Preview           | Preview contents before importing                  | P1       |
| Bulk Import Selection    | Choose which stories to import from bulk ZIP       | P1       |

#### 4.9.6 Export/Import UI

| Feature              | Description                                    | Priority |
| -------------------- | ---------------------------------------------- | -------- |
| Export from Menu     | Story menu → Export → Choose format            | P0       |
| Export from Dashboard| Right-click story → Export                     | P0       |
| Bulk Export Button   | Dashboard → Export All Stories                 | P1       |
| Import from Menu     | File → Import Story                            | P0       |
| Drag & Drop Import   | Drop .ibs or .zip file onto dashboard          | P1       |
| Export Options Modal | Select format, include history, password, etc. | P0       |
| Import Preview Modal | Show story summary before confirming import    | P1       |
| Bulk Import Modal    | Select which stories to import from bulk ZIP   | P1       |

---

## 5. User Experience

### 5.1 Information Architecture

```bash
App
├── Authentication
│   ├── Login (Email/Password)
│   ├── Login (Google OAuth)
│   ├── Register
│   ├── Forgot Password
│   └── Email Verification
├── User Profile
│   ├── Display Name
│   ├── Profile Picture (Upload / DiceBear)
│   ├── Account Settings
│   └── Session Management
├── Dashboard (Home)
│   ├── My Stories
│   ├── Recent Stories
│   ├── Shared with Me
│   ├── Favorites
│   ├── Archive
│   └── Trash
├── Story View
│   ├── Story Settings
│   ├── Board List Sidebar
│   ├── Global Components (story-level)
│   └── Global Containers (story-level)
├── Board View (Canvas)
│   ├── Board Tab Bar (multi-board navigation)
│   ├── Board List Sidebar (collapsible)
│   ├── Toolbar
│   │   ├── Note Type Selector (Normal/Conditional/Technical)
│   │   ├── Container Tool
│   │   └── Standard Tools
│   ├── Canvas Area
│   ├── Properties Panel
│   ├── Component Panel (Floating)
│   │   ├── Component List
│   │   ├── Add/Edit/Delete Components
│   │   └── Reference Navigation
│   ├── Container Panel (Floating)
│   │   ├── Container List
│   │   ├── Add/Edit/Delete Containers
│   │   └── Contents Preview
│   ├── Minimap
│   └── Zoom Controls
├── Templates Gallery
├── Settings
│   ├── Account
│   ├── Preferences
│   ├── Keyboard Shortcuts
│   └── Integrations
└── Help & Support
```

### 5.2 Key User Flows

#### Flow 1: Create and Connect Notes

1. User opens/creates a board
2. Double-clicks canvas to create first note
3. Types content and presses Escape to finish
4. Creates second note nearby
5. Hovers over first note to reveal anchor points
6. Drags from anchor to second note
7. Connection arrow is created
8. Clicks connection to add label (optional)

#### Flow 2: Organize Ideas Spatially

1. User has multiple notes on canvas
2. Multi-selects related notes (Shift+click or lasso)
3. Drags selection to new area
4. Creates a frame around the group
5. Names the frame for context
6. Adjusts colors for visual coding

#### Flow 3: Navigate Large Boards

1. User opens a board with 100+ notes
2. Uses minimap to see overview
3. Clicks minimap to jump to area
4. Uses search to find specific content
5. Presses Enter to navigate to result
6. Uses "Fit all" to see entire board

#### Flow 4: Create and Use Components (ChoiceScript/IF Author Flow)

1. User opens Component Panel (Ctrl/Cmd + Shift + C)
2. Clicks "Add Component" button
3. Names the component (e.g., "health")
4. Selects type (Number) and sets default value (100)
5. Adds description ("Player's health points, 0 = death")
6. Creates a Normal Note and types "Player starts with @health points"
7. Autocomplete suggests "health" after typing @
8. Selects component; it appears styled in the note
9. Creates a Technical Note to modify: "Add 20 to @health"
10. Component reference links back to panel

#### Flow 5: Create Branching Narrative with Conditional Notes

1. User creates a Normal Note: "You encounter a locked door"
2. Creates a Conditional Note connected to it
3. Sets condition: `@hasKey == true`
4. Creates two outgoing branches:
    - True branch → "The door opens" (Normal Note)
    - False branch → "The door is locked" (Normal Note)
5. Adds a Technical Note after True branch: "Set @hasKey to false"
6. Visual flow clearly shows branching paths

#### Flow 6: Track Component References

1. User opens Component Panel
2. Clicks on a component (e.g., "gold")
3. Panel shows "Referenced in 12 notes"
4. Clicks "View References" to see list
5. Clicks any reference to jump directly to that note
6. Uses this to audit all places a variable is used

#### Flow 7: Create and Use Containers

1. User selects Container Tool from toolbar (or presses Ctrl/Cmd + Shift + T)
2. Clicks and drags on canvas to draw container boundaries
3. Names the container (e.g., "Chapter 1 - The Beginning")
4. Adds description: "Opening scene where player meets the guide"
5. Drags existing notes into the container
6. Creates new notes inside the container
7. Opens Container Panel to see list of all containers
8. In another note, types "Continue to @Chapter 1 - The Beginning"
9. Clicks the reference to jump to that container

#### Flow 8: Multi-Board Workflow

1. User creates a new project with multiple boards:
    - "Main Story" board for primary narrative
    - "Side Quests" board for optional content
    - "Characters" board for character details
2. Opens Board List Sidebar to see all boards
3. Double-clicks to open "Characters" board in new tab
4. Creates notes for each character with @components (stats)
5. Switches back to "Main Story" tab
6. In a note, types "See #Characters/hero-profile" to link
7. Clicks link to jump directly to that note on Characters board
8. Uses backlinks to see all references to this board

#### Flow 9: Cross-Board Container References

1. User has "Act 1" container in "Main Story" board
2. Opens "Side Quests" board
3. Creates a note: "This quest unlocks after #Main Story/@Act 1"
4. Clicking the reference opens Main Story board and pans to Act 1 container
5. Container Panel shows cross-board references

### 5.3 Keyboard Shortcuts

| Action                     | Windows         | Mac            |
| -------------------------- | --------------- | -------------- |
| New Normal Note            | N               | N              |
| New Conditional Note       | Shift+N         | Shift+N        |
| New Technical Note         | Alt+N           | Option+N       |
| Delete Selected            | Delete          | Backspace      |
| Duplicate                  | Ctrl+D          | Cmd+D          |
| Undo                       | Ctrl+Z          | Cmd+Z          |
| Redo                       | Ctrl+Shift+Z    | Cmd+Shift+Z    |
| Select All                 | Ctrl+A          | Cmd+A          |
| Search                     | Ctrl+F          | Cmd+F          |
| Zoom In                    | Ctrl++          | Cmd++          |
| Zoom Out                   | Ctrl+-          | Cmd+-          |
| Fit to Screen              | Ctrl+0          | Cmd+0          |
| Save                       | Ctrl+S          | Cmd+S          |
| Pan Mode                   | Space (hold)    | Space (hold)   |
| Connect Mode               | C               | C              |
| Toggle Component Panel     | Ctrl+Shift+C    | Cmd+Shift+C    |
| Toggle Container Panel     | Ctrl+Shift+T    | Cmd+Shift+T    |
| Insert Component (@)       | @               | @              |
| Go to Component Definition | Ctrl+Click on @ | Cmd+Click on @ |
| New Board                  | Ctrl+Shift+N    | Cmd+Shift+N    |
| Switch Board (Next)        | Ctrl+Tab        | Cmd+Tab        |
| Switch Board (Previous)    | Ctrl+Shift+Tab  | Cmd+Shift+Tab  |
| Toggle Board Sidebar       | Ctrl+B          | Cmd+B          |
| Create Container           | Ctrl+Shift+R    | Cmd+Shift+R    |

### 5.4 Responsive Design Requirements

| Platform      | Requirements                                  |
| ------------- | --------------------------------------------- |
| Desktop (Web) | Full feature set, 1024px+ width               |
| Tablet        | Touch-optimized, simplified toolbar           |
| Mobile        | View-only with basic editing, bottom sheet UI |

---

## 6. Technical Requirements

### 6.1 Platform Support

| Platform          | Version           | Priority |
| ----------------- | ----------------- | -------- |
| Web (Chrome)      | Latest 2 versions | P0       |
| Web (Firefox)     | Latest 2 versions | P0       |
| Web (Safari)      | Latest 2 versions | P0       |
| Web (Edge)        | Latest 2 versions | P0       |
| Desktop (Windows) | Windows 10+       | P1       |
| Desktop (macOS)   | macOS 11+         | P1       |
| iOS               | iOS 15+           | P2       |
| Android           | Android 10+       | P2       |

### 6.2 Performance Requirements

| Metric                    | Target                    |
| ------------------------- | ------------------------- |
| Initial Load Time         | < 3 seconds               |
| Time to Interactive       | < 5 seconds               |
| Canvas FPS                | 60fps during interactions |
| Max Notes per Board       | 10,000+                   |
| Max Connections per Board | 50,000+                   |
| Offline Capability        | Full editing offline      |
| Sync Latency              | < 500ms for changes       |

### 6.3 Data & Storage

| Requirement     | Description                  |
| --------------- | ---------------------------- |
| Auto-save       | Save changes every 2 seconds |
| Version History | Last 30 days / 100 versions  |
| Export Formats  | PNG, JPG, SVG, PDF, JSON     |
| Import Formats  | JSON, Markdown, CSV          |
| Cloud Storage   | AWS S3 / equivalent          |
| Local Storage   | IndexedDB for offline        |

### 6.4 Security Requirements

| Requirement    | Description                                      |
| -------------- | ------------------------------------------------ |
| Authentication | Email/password, OAuth (Google, Apple, Microsoft) |
| Authorization  | Role-based access control                        |
| Encryption     | TLS 1.3 in transit, AES-256 at rest              |
| Data Residency | User-selectable region (US, EU)                  |
| Compliance     | GDPR, CCPA compliant                             |
| SSO            | SAML 2.0 for enterprise                          |

### 6.5 Technology Stack (Recommended)

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Frontend         | React/Next.js + TypeScript                |
| Canvas Engine    | HTML5 Canvas or WebGL (Pixi.js/Fabric.js) |
| State Management | Zustand or Redux Toolkit                  |
| Real-time Sync   | WebSockets + CRDT (Yjs)                   |
| Backend          | Node.js / Go                              |
| Database         | PostgreSQL + Redis                        |
| File Storage     | AWS S3                                    |
| Search           | Elasticsearch / Meilisearch               |
| Hosting          | AWS / Vercel                              |

### 6.6 Data Model & Structure

The application follows a hierarchical data structure where users own stories, and stories contain all project-related entities.

#### 6.6.1 Entity Hierarchy

```bash
User
└── Stories (1:many)
    ├── Components (1:many) - Story-level variables
    │   └── Values - Current and default values
    ├── Containers (1:many) - Story-level named regions
    │   ├── Mini-Board - Embedded canvas within container
    │   │   ├── Notes (1:many)
    │   │   └── Components (references to story components)
    │   └── Connections (within mini-board)
    └── Boards (1:many)
        ├── Components (references to story components)
        ├── Containers (1:many) - Board-level containers
        │   ├── Mini-Board
        │   │   ├── Notes
        │   │   └── Components (references)
        │   └── Connections
        ├── Notes (1:many)
        │   ├── Normal Notes
        │   ├── Conditional Notes
        │   └── Technical Notes
        └── Connections (1:many) - Arrows between notes
```

#### 6.6.2 User Entity

| Field          | Type      | Description                            |
| -------------- | --------- | -------------------------------------- |
| id             | UUID      | Unique identifier                      |
| email          | String    | Login email (unique)                   |
| password_hash  | String    | Bcrypt hashed password                 |
| display_name   | String    | Public display name                    |
| avatar_url     | String    | URL to profile picture or DiceBear URL |
| avatar_type    | Enum      | 'custom' or 'dicebear'                 |
| dicebear_seed  | String    | Seed for DiceBear generation           |
| dicebear_style | String    | DiceBear style (adventurer, avataaars) |
| oauth_provider | String    | 'google' or null                       |
| oauth_id       | String    | OAuth provider's user ID               |
| email_verified | Boolean   | Email verification status              |
| created_at     | Timestamp | Account creation date                  |
| updated_at     | Timestamp | Last profile update                    |

#### 6.6.3 Story Entity

| Field         | Type      | Description                        |
| ------------- | --------- | ---------------------------------- |
| id            | UUID      | Unique identifier                  |
| user_id       | UUID      | Owner reference (FK)               |
| title         | String    | Story name                         |
| description   | String    | Optional story description         |
| thumbnail_url | String    | Auto-generated or custom thumbnail |
| is_archived   | Boolean   | Archived status                    |
| is_favorite   | Boolean   | Favorited status                   |
| created_at    | Timestamp | Creation date                      |
| updated_at    | Timestamp | Last modification                  |
| settings      | JSON      | Story-specific settings            |

#### 6.6.4 Component Entity

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| id            | UUID      | Unique identifier                     |
| story_id      | UUID      | Parent story reference (FK)           |
| name          | String    | Component name (unique within story)  |
| type          | Enum      | 'number', 'string', 'boolean', 'list' |
| default_value | JSON      | Initial value                         |
| current_value | JSON      | Runtime/preview value                 |
| description   | String    | Purpose description                   |
| color_tag     | String    | Optional color for categorization     |
| created_at    | Timestamp | Creation date                         |
| updated_at    | Timestamp | Last modification                     |

#### 6.6.5 Container Entity

| Field           | Type      | Description                           |
| --------------- | --------- | ------------------------------------- |
| id              | UUID      | Unique identifier                     |
| story_id        | UUID      | Parent story reference (FK)           |
| board_id        | UUID      | Parent board reference (FK, nullable) |
| name            | String    | Container name (unique within scope)  |
| description     | String    | Purpose description                   |
| position_x      | Float     | X coordinate on canvas                |
| position_y      | Float     | Y coordinate on canvas                |
| width           | Float     | Container width                       |
| height          | Float     | Container height                      |
| color           | String    | Border/background color               |
| is_collapsed    | Boolean   | Collapsed state                       |
| is_locked       | Boolean   | Prevent movement                      |
| mini_board_data | JSON      | Embedded mini-board content           |
| created_at      | Timestamp | Creation date                         |
| updated_at      | Timestamp | Last modification                     |

#### 6.6.6 Board Entity

| Field         | Type      | Description                    |
| ------------- | --------- | ------------------------------ |
| id            | UUID      | Unique identifier              |
| story_id      | UUID      | Parent story reference (FK)    |
| title         | String    | Board name                     |
| description   | String    | Optional board description     |
| thumbnail_url | String    | Auto-generated thumbnail       |
| sort_order    | Integer   | Order in board list            |
| folder_id     | UUID      | Optional folder reference (FK) |
| viewport_x    | Float     | Last viewport X position       |
| viewport_y    | Float     | Last viewport Y position       |
| viewport_zoom | Float     | Last zoom level                |
| created_at    | Timestamp | Creation date                  |
| updated_at    | Timestamp | Last modification              |

#### 6.6.7 Note Entity

| Field          | Type      | Description                               |
| -------------- | --------- | ----------------------------------------- |
| id             | UUID      | Unique identifier                         |
| board_id       | UUID      | Parent board reference (FK)               |
| container_id   | UUID      | Parent container reference (FK, nullable) |
| type           | Enum      | 'normal', 'conditional', 'technical'      |
| title          | String    | Optional note title                       |
| content        | JSON      | Rich text content with @ references       |
| position_x     | Float     | X coordinate on canvas                    |
| position_y     | Float     | Y coordinate on canvas                    |
| width          | Float     | Note width                                |
| height         | Float     | Note height                               |
| color          | String    | Background color                          |
| is_collapsed   | Boolean   | Collapsed to title only                   |
| is_locked      | Boolean   | Prevent movement                          |
| z_index        | Integer   | Layer order                               |
| condition_data | JSON      | Condition config (for conditional notes)  |
| technical_data | JSON      | Modification config (for technical notes) |
| created_at     | Timestamp | Creation date                             |
| updated_at     | Timestamp | Last modification                         |

#### 6.6.8 Connection Entity

| Field          | Type      | Description                           |
| -------------- | --------- | ------------------------------------- |
| id             | UUID      | Unique identifier                     |
| board_id       | UUID      | Parent board reference (FK)           |
| source_note_id | UUID      | Origin note reference (FK)            |
| target_note_id | UUID      | Destination note reference (FK)       |
| source_anchor  | Enum      | 'top', 'bottom', 'left', 'right'      |
| target_anchor  | Enum      | 'top', 'bottom', 'left', 'right'      |
| label          | String    | Optional connection label             |
| color          | String    | Line color                            |
| style          | Enum      | 'solid', 'dashed', 'dotted'           |
| thickness      | Integer   | Line weight (1-5)                     |
| arrow_type     | Enum      | 'none', 'single', 'double'            |
| curvature      | Enum      | 'straight', 'curved', 'orthogonal'    |
| branch_label   | String    | For conditional branches (true/false) |
| created_at     | Timestamp | Creation date                         |
| updated_at     | Timestamp | Last modification                     |

#### 6.6.9 Entity Relationship Diagram

```bash
┌──────────────┐
│     USER     │
│──────────────│
│ id           │
│ email        │
│ display_name │
│ avatar_url   │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴───────┐
│    STORY     │
│──────────────│
│ id           │
│ user_id (FK) │
│ title        │
└──┬───┬───┬───┘
   │   │   │
   │   │   │ *         ┌──────────────┐
   │   │   └──────────►│  COMPONENT   │
   │   │               │──────────────│
   │   │               │ id           │
   │   │               │ story_id(FK) │
   │   │               │ name, type   │
   │   │               │ value        │
   │   │               └──────────────┘
   │   │
   │   │ *             ┌──────────────┐
   │   └─────────────► │  CONTAINER   │
   │                   │──────────────│
   │                   │ id           │
   │                   │ story_id(FK) │
   │                   │ board_id(FK) │
   │                   │ mini_board   │───┐
   │                   └──────────────┘   │ contains
   │                                      │ Notes &
   │ *                 ┌──────────────┐   │ Component refs
   └─────────────────► │    BOARD     │   │
                       │──────────────│   │
                       │ id           │   │
                       │ story_id(FK) │   │
                       │ title        │   │
                       └─────┬───┬────┘   │
                             │   │        │
                ┌────────────┘   │        │
                │ *              │ *      │
         ┌──────┴───────┐  ┌─────┴────────┐
         │     NOTE     │  │ CONNECTION   │
         │──────────────│  │──────────────│
         │ id           │  │ id           │
         │ board_id(FK) │  │ board_id(FK) │
         │ container_id │◄─│ source_note  │
         │ type         │  │ target_note  │
         │ content      │  │ label        │
         └──────────────┘  └──────────────┘
```

#### 6.6.10 Mini-Board (Embedded in Containers)

Containers have an embedded "mini-board" that functions as a self-contained canvas:

| Feature              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| Embedded Notes       | Notes exist within container's local coordinate space |
| Component References | Can reference story-level components via @            |
| Local Connections    | Connections between notes within the container        |
| Independent Viewport | Scroll/zoom within container bounds                   |
| Expand View          | Option to open mini-board in full-screen mode         |

---

## 7. Collaboration Features (P1)

### 7.1 Sharing

| Feature             | Description            | Priority |
| ------------------- | ---------------------- | -------- |
| Share Link          | Public or private URL  | P1       |
| Permission Levels   | View, Comment, Edit    | P1       |
| Password Protection | Optional link password | P2       |
| Expiring Links      | Time-limited access    | P2       |

### 7.2 Real-time Collaboration

| Feature              | Description              | Priority |
| -------------------- | ------------------------ | -------- |
| Presence Indicators  | See who's viewing        | P1       |
| Live Cursors         | See collaborator cursors | P1       |
| Simultaneous Editing | Multiple editors at once | P1       |
| Conflict Resolution  | CRDT-based sync          | P1       |

### 7.3 Communication

| Feature           | Description             | Priority |
| ----------------- | ----------------------- | -------- |
| Comments on Notes | Threaded discussions    | P1       |
| @Mentions         | Notify team members     | P2       |
| Activity Feed     | Board change history    | P2       |
| Notifications     | In-app and email alerts | P2       |

---

## 8. Monetization

### 8.1 Pricing Tiers

| Feature                 | Free       | Pro ($10/mo) | Team ($15/user/mo) |
| ----------------------- | ---------- | ------------ | ------------------ |
| Boards                  | 3          | Unlimited    | Unlimited          |
| Notes per Board         | 100        | Unlimited    | Unlimited          |
| Collaborators per Board | 3          | 10           | Unlimited          |
| File Uploads            | 10MB total | 5GB          | 100GB              |
| Version History         | 7 days     | 30 days      | Unlimited          |
| Templates               | Basic      | All          | All + Custom       |
| Export Options          | PNG only   | All formats  | All formats        |
| Priority Support        | ❌         | ✅           | ✅                 |
| SSO/Admin               | ❌         | ❌           | ✅                 |
| API Access              | ❌         | ❌           | ✅                 |

### 8.2 Additional Revenue Streams

- **Education Discount:** 50% off for verified students/teachers
- **Nonprofit Discount:** 30% off for registered nonprofits
- **Enterprise Plans:** Custom pricing for 100+ users
- **Template Marketplace:** User-created templates (future)

---

## 9. Integrations (P2)

### 9.1 Import Integrations

| Service        | Capability                 |
| -------------- | -------------------------- |
| Notion         | Import pages as notes      |
| Trello         | Import cards as notes      |
| Miro           | Import boards              |
| Google Docs    | Import as note content     |
| Markdown Files | Import as structured notes |

### 9.2 Export Integrations

| Service      | Capability                  |
| ------------ | --------------------------- |
| Notion       | Export board as Notion page |
| Slack        | Share board preview         |
| Google Drive | Save exports directly       |
| Zapier       | Trigger automations         |

### 9.3 Embed Integrations

| Service       | Capability             |
| ------------- | ---------------------- |
| YouTube       | Embed videos in notes  |
| Figma         | Embed design frames    |
| Google Sheets | Embed spreadsheets     |
| Loom          | Embed video recordings |

---

## 10. Analytics & Insights (P2)

### 10.1 User Analytics

| Metric              | Description                         |
| ------------------- | ----------------------------------- |
| Board Statistics    | Notes count, connections count      |
| Usage Patterns      | Most active times, session duration |
| Collaboration Stats | Contributors, edit frequency        |

### 10.2 Admin Analytics (Team Plan)

| Metric            | Description              |
| ----------------- | ------------------------ |
| Team Activity     | Member engagement levels |
| Storage Usage     | Per-user and total       |
| Popular Templates | Most-used templates      |

---

## 11. Accessibility Requirements

| Requirement         | Description                     | Priority |
| ------------------- | ------------------------------- | -------- |
| Keyboard Navigation | Full app navigable via keyboard | P0       |
| Screen Reader       | ARIA labels and roles           | P1       |
| Color Contrast      | WCAG AA compliance              | P0       |
| Focus Indicators    | Visible focus states            | P0       |
| Reduced Motion      | Respect prefers-reduced-motion  | P1       |
| Text Scaling        | Support 200% zoom               | P1       |
| Alt Text            | For images and visual elements  | P1       |

---

## 12. Launch Plan

### 12.1 Development Phases

#### Phase 1: MVP (3 months)

- Infinite canvas with zoom/pan
- Basic text notes (create, edit, move, delete)
- Directional arrows between notes
- Single-user boards
- Web app (desktop browsers)
- Basic export (PNG)

#### Phase 2: Core Features (3 months)

- Note types (image, link, checklist)
- Note styling (colors, resize)
- Connection labels and styles
- Search functionality
- Templates (5 basic)
- User accounts and cloud sync

#### Phase 3: Collaboration (3 months)

- Sharing with permissions
- Real-time collaboration
- Comments
- Version history
- Team workspaces
- Premium plans launch

#### Phase 4: Polish & Scale (3 months)

- Desktop apps (Electron)
- Mobile apps (React Native)
- Advanced templates
- Integrations
- Performance optimization
- Enterprise features

### 12.2 Launch Milestones

| Milestone     | Date     | Description          |
| ------------- | -------- | -------------------- |
| Alpha         | Month 3  | Internal testing     |
| Private Beta  | Month 5  | 500 invited users    |
| Public Beta   | Month 7  | Open registration    |
| v1.0 Launch   | Month 9  | Full public launch   |
| Mobile Launch | Month 12 | iOS and Android apps |

---

## 13. Risks & Mitigations

| Risk                       | Probability | Impact | Mitigation                            |
| -------------------------- | ----------- | ------ | ------------------------------------- |
| Performance at scale       | Medium      | High   | Canvas virtualization, WebGL fallback |
| Real-time sync conflicts   | Medium      | Medium | CRDT implementation (Yjs)             |
| Low user adoption          | Medium      | High   | Free tier, viral sharing features     |
| Competition (Miro, FigJam) | High        | Medium | Focus on simplicity and speed         |
| Data loss concerns         | Low         | High   | Auto-save, version history, backups   |

---

## 14. Success Criteria for MVP

The MVP will be considered successful if:

1. **Functionality:** Users can create notes, move them, and connect them with arrows without bugs
2. **Performance:** Canvas remains smooth (60fps) with 100+ notes
3. **Usability:** New users complete first board in < 5 minutes without tutorial
4. **Stability:** < 0.1% crash rate
5. **Feedback:** NPS score > 30 from beta users

---

## 15. Open Questions

1. Should we support offline-first architecture from day 1?
2. What is the maximum board size we need to support?
3. Should connections be allowed between multiple notes (many-to-many)?
4. Do we need pen/drawing tools in v1?
5. Should we support custom shapes beyond rectangles?
6. What is the AI integration strategy (auto-organize, summarize, etc.)?

---

## 16. Appendix

### A. Competitive Analysis

| Feature              | IdeaBoard | Miro    | FigJam | Notion | Twine |
| -------------------- | --------- | ------- | ------ | ------ | ----- |
| Infinite Canvas      | ✅        | ✅      | ✅     | ❌     | ✅    |
| Movable Notes        | ✅        | ✅      | ✅     | ❌     | ✅    |
| Directional Arrows   | ✅        | ✅      | ✅     | ❌     | ✅    |
| Real-time Collab     | ✅        | ✅      | ✅     | ✅     | ❌    |
| Simplicity Focus     | ✅        | ❌      | ✅     | ✅     | ✅    |
| Free Tier            | ✅        | Limited | ✅     | ✅     | ✅    |
| Offline Mode         | ✅        | ❌      | ❌     | ✅     | ✅    |
| Variable/Components  | ✅        | ❌      | ❌     | ❌     | ✅    |
| Conditional Logic    | ✅        | ❌      | ❌     | ❌     | ✅    |
| IF Author Focus      | ✅        | ❌      | ❌     | ❌     | ✅    |
| Multi-Board Support  | ✅        | ✅      | ✅     | ✅     | ✅    |
| Cross-Board Linking  | ✅        | ❌      | ❌     | ✅     | ✅    |
| Named Containers     | ✅        | ❌      | ❌     | ❌     | ❌    |
| Container References | ✅        | ❌      | ❌     | ❌     | ❌    |

### B. Glossary

| Term             | Definition                                                                           |
| ---------------- | ------------------------------------------------------------------------------------ |
| User             | Registered account holder with email/password or OAuth login                         |
| Story            | Top-level project container owned by a user; contains boards, components, containers |
| Board            | A single canvas workspace within a story                                             |
| Note/Card        | An individual idea container on a board or mini-board                                |
| Normal Note      | Free-form note for any content                                                       |
| Conditional Note | Note with branching logic based on component conditions                              |
| Technical Note   | Note that modifies component values                                                  |
| Connection/Arrow | A visual link between two notes                                                      |
| Frame            | A grouping container for multiple notes (visual only)                                |
| Container        | Named, referenceable region with embedded mini-board                                 |
| Mini-Board       | Embedded canvas within a container; contains notes and component refs                |
| Container Panel  | Floating window for managing and viewing all containers                              |
| Canvas           | The infinite whiteboard area                                                         |
| Anchor Point     | Connection point on a note's edge                                                    |
| Component        | User-defined variable (number, string, boolean) tracked across the story             |
| Component Value  | Current or default value stored in a component                                       |
| Component Panel  | Floating window for managing and viewing all components                              |
| @ Reference      | Inline reference to a component or container using the @ symbol                      |
| # Reference      | Inline reference to another board using the # symbol                                 |
| Board Link       | A clickable reference that navigates to another board                                |
| Backlink         | Reference showing which boards/notes link to current location                        |
| Display Name     | User's public-facing name shown in profile and collaborations                        |
| Profile Picture  | User's avatar image (custom upload or DiceBear generated)                            |
| DiceBear         | Avatar generation service for default profile pictures                               |
| OAuth            | Authentication via third-party provider (Google)                                     |
| ChoiceScript     | A scripting language for creating interactive fiction games                          |

---

### Document Version History

| Version | Date       | Author       | Changes                                                   |
| ------- | ---------- | ------------ | --------------------------------------------------------- |
| 1.0     | 2025-12-28 | Product Team | Initial draft                                             |
| 1.1     | 2025-12-28 | Product Team | Added Components system, note types, ChoiceScript persona |
| 1.2     | 2025-12-28 | Product Team | Added Containers system, Multi-Board support              |
| 1.3     | 2025-12-28 | Product Team | Added User Auth, Profile system, Data Model structure     |

---

#### kmab
