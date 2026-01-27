#!/bin/bash

# Install Claude Code skills for TypeScript, React, and Frontend Design
# Skills included:
#   - typescript-advanced-types (advanced TypeScript patterns)
#   - vercel-react-best-practices (React best practices from Vercel)
#   - web-design-guidelines (web design principles)
#   - frontend-design (frontend design patterns from Anthropic)

set -e

echo "Installing Claude Code skills..."

echo "[1/4] Installing typescript-advanced-types..."
npx skills add https://github.com/wshobson/agents --skill typescript-advanced-types

echo "[2/4] Installing vercel-react-best-practices..."
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices

echo "[3/4] Installing web-design-guidelines..."
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

echo "[4/4] Installing frontend-design..."
npx skills add https://github.com/anthropics/skills --skill frontend-design

echo "All skills installed successfully!"
