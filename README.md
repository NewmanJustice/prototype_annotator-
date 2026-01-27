# Prototype Annotator

An Express middleware that enables in-browser annotation capabilities for collecting feedback on prototypes and designs. Features SQLite persistence, a Preact-based overlay UI, a management dashboard, and template-based prompt generation.

## Features

- **In-Browser Annotations**: Add annotations directly on any page with element or rectangle selection
- **Shadow DOM Isolation**: Overlay UI is completely isolated from your app's styles
- **Persistent Storage**: All annotations stored in SQLite with full event history
- **Management Dashboard**: Browse, filter, and manage annotations across all pages
- **Prompt Generation**: Generate structured prompts from annotations using templates
- **Audit Trail**: Complete event history for all annotation changes

## Installation

```bash
npm install prototype-annotator
```

### Requirements

- Node.js >= 18.0.0
- Express >= 4.18.0

## Quick Start

```javascript
import express from 'express';
import { createPrototypeAnnotator } from 'prototype-annotator';

const app = express();

async function main() {
  // Initialize the annotator (async)
  const annotator = await createPrototypeAnnotator({
    basePath: '/__prototype-annotator',
    dbPath: './data/annotations.sqlite',
    exportDir: './exports',
  });

  // Add the middleware
  app.use(annotator.middleware());

  // Your routes...
  app.get('/', (req, res) => {
    res.send('<html><body><h1>Hello World</h1></body></html>');
  });

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

main();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `basePath` | string | `'/__prototype-annotator'` | Base path for API and dashboard routes |
| `dbPath` | string | `'./prototype-annotator/annotator.sqlite'` | Path to SQLite database file |
| `exportDir` | string | `'./prototype_annotator_exports'` | Directory for exported prompts |
| `urlMode` | `'full'` \| `'canonical'` | `'full'` | How URLs are stored (full URL or canonical without query/hash) |
| `actorMode` | `'prompt'` \| `'fixed'` | `'prompt'` | Actor identification mode |
| `defaultActor` | string | `'anonymous'` | Default actor name |
| `enableOverlay` | boolean | `true` | Enable the annotation overlay on pages |
| `enableDashboard` | boolean | `true` | Enable the management dashboard |

## Using the Overlay

When `enableOverlay` is true, an annotation toolbar appears on all HTML pages served by your Express app.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Toggle element selection mode |
| `R` | Toggle rectangle selection mode |
| `S` | Toggle sidebar |
| `Escape` | Cancel current selection |

### Selection Modes

- **Element Selection**: Click on any DOM element to annotate it. The CSS selector is automatically captured.
- **Rectangle Selection**: Click and drag to draw a rectangle anywhere on the page.

## Dashboard

Access the dashboard at `{basePath}/dashboard` (e.g., `http://localhost:3000/__prototype-annotator/dashboard`).

The dashboard provides:

- **Pages**: View all pages with annotations
- **Annotations**: Browse, filter, and manage all annotations
- **Events**: Audit log of all annotation changes
- **Prompts**: Generate and export prompts from annotations

## API Endpoints

All endpoints are prefixed with `{basePath}/api`.

### Annotations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/annotations` | List annotations (supports `?url=` filter) |
| GET | `/annotations/:id` | Get single annotation |
| POST | `/annotations` | Create annotation |
| PUT | `/annotations/:id` | Update annotation |
| DELETE | `/annotations/:id` | Soft-delete annotation |
| POST | `/annotations/:id/restore` | Restore deleted annotation |

### Pages & Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pages` | List all annotated pages |
| GET | `/events` | List all events (supports filters) |

### Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prompts/exports` | List exported prompts |
| POST | `/prompts/generate` | Generate prompt preview |
| POST | `/prompts/confirm` | Export prompt to files |

## Example

Run the included example:

```bash
git clone <repo>
cd prototype-annotator
npm install
npm run build
npm run example
```

Then visit:
- http://localhost:3000 - Example app with overlay
- http://localhost:3000/__prototype-annotator/dashboard - Management dashboard

## License

MIT
