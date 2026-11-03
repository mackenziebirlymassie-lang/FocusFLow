# FocusFlow — Timeline Productivity Workbench

> **Category:** Everyday Personal Tools & Developer Productivity  
> **Architecture:** Zero-Overhead, Offline-First, Timeline-Centered Workbench

---

## Overview
**FocusFlow** is an offline-first personal productivity workbench where structured schedule blocks drive what you work on. It unites an interactive time-blocking canvas, an unscheduled task backlog, and a context-aware markdown scratchpad into a unified, high-performance interface.

### Architectural Highlights
- **Zero Background CPU Overhead:** Idle CPU sits at 0.0%. Aligned minute clock updates without continuous polling and suspends completely when the tab is hidden (`document.hidden`).
- **Deterministic Pointer Engine:** 100% native Pointer Events (`setPointerCapture`) with zero HTML5 Drag-and-Drop overhead for block creation, resizing, moving, and task inbox projection.
- **Strict Bundle Budget:** Production bundle is **~89KB gzip** (strictly under the 120KB budget) with zero heavy external libraries.
- **Storage Stratification:** Relational domain data (`tasks`, `timeBlocks`, `dailyNotes`) is persisted via a dependency-free typed native IndexedDB wrapper; transient layout preferences live in `localStorage`.
- **Fast Single-Pass Markdown:** Native regex parser supporting headers, bold/italic, code blocks, and interactive `- [ ]` checkboxes that toggle state directly from preview.

---

## Getting Started

```bash
# Navigate to the project directory
cd "C:\Users\USER\Documents\Projects\FocusFlow"

# Start the local development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deploying to GitHub Pages

FocusFlow includes an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml`.

1. Go to your GitHub repository (**Settings** → **Pages**).
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
3. Commit and push:
   ```bash
   git add .
   git commit -m "fix: resolve github pages blank screen and add deploy workflow"
   git push origin main
   ```
4. GitHub Actions will automatically build and deploy FocusFlow to `https://<username>.github.io/<repo-name>/`.

---

## Keyboard Shortcuts
- `Ctrl + K`: Open Command Palette (search backlog tasks, quick jump to today, export backup, settings)
- `Esc`: Close open modal or deselect active time block
- `Enter` (in task input): Rapid-add task with default 30m estimate
