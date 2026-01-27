/**
 * Example Express server demonstrating prototype-annotator
 *
 * Run with: npx tsx example/server.ts
 * Or after building: node example/server.js
 */

import express from 'express';
import { createPrototypeAnnotator } from '../src/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

async function main() {
  // Initialize prototype-annotator middleware (async for sql.js)
  const annotator = await createPrototypeAnnotator({
    basePath: '/__prototype-annotator',
    dbPath: './prototype-annotator/annotator.sqlite',
    exportDir: './prototype_annotator_exports',
    urlMode: 'full',
    actorMode: 'prompt',
    defaultActor: 'example-user',
    enableOverlay: true,
    enableDashboard: true,
  });

  // Use the annotator middleware (spec-compliant API)
  app.use(annotator.middleware());

  // Example home page
  app.get('/', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Example App - Prototype Annotator Demo</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
          }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          header {
            background: #2563eb;
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          header h1 { font-size: 2.5rem; margin-bottom: 10px; }
          header p { opacity: 0.9; font-size: 1.1rem; }
          main { padding: 40px 20px; }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin: 40px 0;
          }
          .feature {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .feature h3 {
            color: #2563eb;
            margin-bottom: 12px;
            font-size: 1.25rem;
          }
          .feature p { color: #666; }
          .cta {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            margin-top: 40px;
          }
          .cta h2 { margin-bottom: 16px; }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            margin: 8px;
          }
          .btn:hover { background: #1d4ed8; }
          .btn-secondary {
            background: white;
            color: #2563eb;
            border: 2px solid #2563eb;
          }
          .instructions {
            background: #1a1a1a;
            color: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
          }
          .instructions code {
            color: #10b981;
          }
          footer {
            text-align: center;
            padding: 40px 20px;
            color: #666;
          }
          .sample-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
          }
          .sample-section h2 {
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          .sample-button {
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 8px;
          }
          .sample-input {
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            width: 300px;
            margin: 8px;
          }
          .sample-card {
            display: inline-block;
            padding: 20px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            margin: 8px;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Example App</h1>
          <p>Prototype Annotator Demo - Try adding annotations!</p>
        </header>

        <main class="container">
          <div class="instructions">
            <strong>How to use:</strong><br>
            1. Press <code>E</code> to select an element, or <code>R</code> to draw a rectangle<br>
            2. Press <code>S</code> to toggle the sidebar<br>
            3. Click the toolbar buttons in the bottom-right corner<br>
            4. Visit <code><a href="${annotator.config.basePath}/dashboard" style="color: #10b981;">${annotator.config.basePath}/dashboard</a></code> for the full dashboard
          </div>

          <section class="features">
            <div class="feature">
              <h3>Element Selection</h3>
              <p>Click on any element to annotate it. The selector is automatically captured for future reference.</p>
            </div>
            <div class="feature">
              <h3>Rectangle Selection</h3>
              <p>Draw a rectangle anywhere on the page to annotate a specific area that doesn't correspond to an element.</p>
            </div>
            <div class="feature">
              <h3>Persistent Storage</h3>
              <p>All annotations are stored in SQLite with full event history for audit trails.</p>
            </div>
            <div class="feature">
              <h3>Prompt Generation</h3>
              <p>Generate structured prompts from your annotations using templates for implementation guidance.</p>
            </div>
          </section>

          <section class="sample-section">
            <h2>Sample UI Elements to Annotate</h2>
            <p style="margin-bottom: 20px;">Try annotating these different UI elements:</p>

            <button class="sample-button">Danger Button</button>
            <button class="sample-button" style="background: #16a34a;">Success Button</button>

            <br><br>

            <input type="text" class="sample-input" placeholder="Sample input field">
            <input type="email" class="sample-input" placeholder="Email field">

            <br><br>

            <div class="sample-card">
              <strong>Sample Card</strong><br>
              A gradient card component
            </div>
            <div class="sample-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <strong>Another Card</strong><br>
              Different gradient style
            </div>
          </section>

          <div class="cta">
            <h2>Ready to explore more?</h2>
            <p style="color: #666; margin-bottom: 20px;">Check out the dashboard to manage all annotations</p>
            <a href="${annotator.config.basePath}/dashboard" class="btn">Open Dashboard</a>
            <a href="/about" class="btn btn-secondary">Another Page</a>
          </div>
        </main>

        <footer>
          <p>Prototype Annotator - Making feedback collection easier</p>
        </footer>
      </body>
      </html>
    `);
  });

  // Another example page
  app.get('/about', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About - Example App</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
          }
          .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          nav {
            background: white;
            padding: 16px 20px;
            margin-bottom: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          nav a { color: #2563eb; text-decoration: none; margin-right: 20px; }
          nav a:hover { text-decoration: underline; }
          h1 { font-size: 2rem; margin-bottom: 20px; }
          p { margin-bottom: 16px; color: #666; }
          .card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .card h2 { margin-bottom: 12px; font-size: 1.25rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="${annotator.config.basePath}/dashboard">Dashboard</a>
          </nav>

          <h1>About This Example</h1>
          <p>This is a simple example application demonstrating the prototype-annotator package.</p>

          <div class="card">
            <h2>What is Prototype Annotator?</h2>
            <p>Prototype Annotator is a middleware for Express applications that enables in-browser annotation capabilities. It's perfect for collecting feedback on prototypes and designs.</p>
          </div>

          <div class="card">
            <h2>Key Features</h2>
            <ul style="padding-left: 20px; color: #666;">
              <li>Element and rectangle selection modes</li>
              <li>Persistent SQLite storage</li>
              <li>Full event history and audit trail</li>
              <li>Dashboard for managing annotations</li>
              <li>Template-based prompt generation</li>
            </ul>
          </div>

          <div class="card">
            <h2>Technical Details</h2>
            <p>The overlay uses Shadow DOM for style isolation, ensuring it doesn't interfere with your application's styles. All annotations are stored locally in an SQLite database.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  app.listen(PORT, () => {
    console.log(`Example server running at http://localhost:${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}${annotator.config.basePath}/dashboard`);
    console.log(`API available at http://localhost:${PORT}${annotator.config.basePath}/api`);
  });
}

main().catch(console.error);
