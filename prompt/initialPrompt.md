# Agentic Developer Prompt: Prototype Annotator (v1)

You are building a **TypeScript, Node-embedded prototype annotation system** intended for use in real prototype codebases and deployable to **Azure App Service**.

Your task is to implement the package described below as a production-quality v1.

---

## Product Goal

Create an npm package called **`prototype-annotator`** that can be installed into an existing Node application and embedded via middleware.

The package enables:
- In-browser annotations on any screen (element or rectangle based)
- A hideable overlay and hideable sidebar UI
- Shared CRUD access to annotations (no auth)
- An immutable audit log of all changes
- A dashboard for browsing annotations by URL (including query + hash)
- Prompt generation from annotations for agentic code generation
- Saving generated prompts into the host repo

---

## Core Requirements

### Runtime & Deployment
- Primary runtime: **Node.js**
- Must be embeddable into an existing Node server (Express/Fastify)
- Must be deployable to **Azure App Service**
- No standalone server required in production mode
- SQLite persistence on disk (path configurable)

---

## Installation & Embedding

### Install
```bash
npm install prototype-annotator
```
```typescript
import { createPrototypeAnnotator } from "prototype-annotator";

const annotator = createPrototypeAnnotator({
  basePath: "/__prototype-annotator",
  dbPath: "./prototype-annotator/annotator.sqlite",
  exportDir: "./prototype_annotator_exports",
  urlMode: "full",
  actorMode: "prompt"
});

app.use(annotator.middleware());
```
## Files Written per Export

- `YYYY-MM-DD__HHmm__<slug>.md`
- `YYYY-MM-DD__HHmm__<slug>.json`

---

## Prompt Template (`agentic-dev`)

The generated **Markdown prompt** must include the following sections:

1. **Context**
2. **Screens in Scope**
   - URLs including query string and hash
3. **Observations**
   - Grouped by screen
4. **Required Changes**
   - Actionable
   - Code-oriented
5. **Acceptance Criteria**
6. **Suggested Tests / Checks**
7. **Assumptions & Out of Scope**

### Prompt Artifacts
- Markdown is the **primary artifact** for agentic code generation
- JSON is a **structured companion** containing:
  - metadata
  - identifiers
  - full prompt text

---

## Persistence (SQLite)

### Tables

#### `annotations`
- `id` (uuid, primary key)
- `url_full` (text)
- `url_canonical` (text, indexed)
- `title` (text)
- `body` (text)
- `anchor_type` (`element` | `rect`)
- `anchor_payload` (json)
- `created_at`
- `updated_at`
- `deleted_at` (nullable)
- `created_by`
- `updated_by`

#### `annotation_events` (append-only)
- `id` (uuid, primary key)
- `annotation_id` (uuid, nullable)
- `event_type` (`CREATE | UPDATE | DELETE | RESTORE | EXPORT_PROMPT`)
- `actor`
- `timestamp`
- `diff` (json)
- `meta` (json)

#### `prompt_exports`
- `id` (uuid, primary key)
- `created_at`
- `actor`
- `url_scope` (json)
- `annotation_ids` (json)
- `template_id`
- `prompt_markdown`
- `saved_path_md`
- `saved_path_json`

---

## API (mounted under `${basePath}/api`)

### Annotations
- `GET /pages`
- `GET /annotations?url_canonical=...`
- `POST /annotations`
- `PATCH /annotations/:id`
- `DELETE /annotations/:id` (soft delete)
- `POST /annotations/:id/restore`

### Events
- `GET /events?annotationId=...`
- `GET /events?url_canonical=...`

### Prompts
- `POST /prompts/generate`
- `POST /prompts/confirm`

---

## Non-Goals (v1)

- No authentication or authorization
- No real-time collaboration
- No cloud persistence
- No screenshots (optional future enhancement)

---

## Quality Bar

- TypeScript throughout
- Framework-agnostic client overlay
- Azure-safe filesystem usage
- All mutations must produce audit events
- Deterministic, testable behaviour

---

## Deliverables

- npm package
- Embedded middleware
- Client overlay
- Dashboard UI
- SQLite schema and migrations
- Prompt export functionality

---

## Local Prompt Model Requirement

- Embed a **small, lightweight local model** into the package for prompt generation
- Use a model sourced from:  
  https://ollama.com/search
- Before proceeding with implementation:
  - Confirm model suitability **directly in the terminal**
  - Validate:
    - prompt-following quality
    - instruction adherence
    - performance on small context windows
