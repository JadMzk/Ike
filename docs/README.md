# Ike — Documentation

Guides and diagrams for understanding how Ike works — from setup to scoring logic.

## Setup

| Document | Description |
|----------|-------------|
| [AUTH_SETUP.md](./AUTH_SETUP.md) | Supabase Google OAuth, env vars, database migrations |

## How Ike works

| Document | Description |
|----------|-------------|
| [main-process.md](./main-process.md) | Main process flowchart — create task, dynamic scoring, display |
| [priority-landscape.md](./priority-landscape.md) | 2D prioritization planes, quadrants, formulas (Mermaid) |
| [backend-architecture.md](./backend-architecture.md) | Backend UML — layers, classes, API surface |

## Visual reference

| Asset | Description |
|-------|-------------|
| [task-landscape-quadrants.png](./task-landscape-quadrants.png) | Conceptual map — effort x priority quadrants with example tasks |
| [screenshot-task-landscape.png](./screenshot-task-landscape.png) | Mobile app screenshot — Task landscape screen with preview and recommendations |

Mermaid diagrams in the markdown files render on GitHub, in VS Code/Cursor, and in most modern Markdown viewers.

## Reading order

1. **New to Ike?** Start with [task-landscape-quadrants.png](./task-landscape-quadrants.png) for the big picture, then [main-process.md](./main-process.md).
2. **Implementing or contributing?** Read [backend-architecture.md](./backend-architecture.md) and [priority-landscape.md](./priority-landscape.md).
3. **Running locally?** Follow [AUTH_SETUP.md](./AUTH_SETUP.md).
