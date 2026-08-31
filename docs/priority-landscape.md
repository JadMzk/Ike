# Ike — Dynamic Priority Landscape

Ike uses **two related 2D views** of the same underlying tasks. Both are dynamic: as time passes, urgency (and therefore priority) increases, so dots **move** on refresh or projection.

---

## 1. Conceptual plane — Importance × Urgency

This is the core mental model: each task is a point whose **horizontal position is urgency** and **vertical position is importance**.  
Urgency is the only axis that **drifts over time** (to the right). Importance stays fixed unless the user edits the task.

```mermaid
flowchart TB
    subgraph plane ["Importance × Urgency plane (0–10 each axis)"]
        direction TB

        subgraph top [" "]
            direction LR
            NW[" "] --- NE["🔴 Critical zone<br/>(high importance<br/>+ high urgency)"]
        end

        subgraph mid [" "]
            direction LR
            SW[" "] --- SE[" "]
        end

        YHIGH["Importance ↑"] --- plane
        X["Urgency →"] --- SE

        NOTE["Over time: dots slide right →<br/>priority_score = importance × urgency"]
    end

    subgraph motion [Temporal drift]
        T0["Day 0 · dot at (urgency₀, importance)"]
        T1["Day N · dot at (urgency₀ + rate×N, importance)<br/>capped at urgency = 10"]
        T0 --> T1
    end

    plane --> motion
```

### Priority score on this plane

| Score | Level | Color |
|-------|-------|-------|
| &lt; 25 | Low | Green |
| 25 – 49 | Medium | Yellow |
| 50 – 74 | High | Orange |
| ≥ 75 | Critical | Red |

Dot color in the app follows `priority_score = importance × current_urgency`, not raw axis position alone.

---

## 2. App landscape — Effort × Normalized Priority

The **Priority Landscape** screen plots tasks on a different but complementary grid used for daily decisions and motivation-aware recommendations.

```mermaid
quadrantChart
    title Task Landscape (Effort × Normalized Priority)
    x-axis Low effort --> High effort
    y-axis Low priority --> High priority
    quadrant-1 Postpone / Delegate
    quadrant-2 Quick Wins
    quadrant-3 Nice to Do
    quadrant-4 Big Rocks
```

| Quadrant | Effort | Priority (y) | Meaning |
|----------|--------|--------------|---------|
| **Quick Wins** | &lt; 5 | ≥ 5 | High impact, low friction — do first when tired |
| **Big Rocks** | ≥ 5 | ≥ 5 | Important and heavy — schedule when motivated |
| **Nice to Do** | &lt; 5 | &lt; 5 | Low urgency/importance combo — backlog |
| **Postpone / Delegate** | ≥ 5 | &lt; 5 | Costly but not worth it now — defer or hand off |

Threshold for both axes: **5.0** (see `PriorityLandscapeService.classify_quadrant`).

### Axis mapping (code)

```mermaid
flowchart LR
    subgraph inputs [Stored + computed]
        I[importance]
        U[current_urgency]
        E0[initial_effort]
        R[category resistance]
    end

    I --> PS["priority_score = I × U"]
    U --> PS
    PS --> PY["y = min(10, score / 10)"]
    E0 --> CE["current_effort"]
    R --> CE

    CE --> X["Landscape x-axis"]
    PY --> Y["Landscape y-axis"]

    X --> Q[classify quadrant]
    Y --> Q
    Q --> REC[motivation-aware recommendations]
```

### Motivation filter (frontend + API)

| Motivation (1–10) | Emphasized quadrant |
|-------------------|---------------------|
| 1 – 4 | Quick Wins |
| 5 – 7 | Top tasks by score (balanced) |
| 8 – 10 | Big Rocks |

---

## 3. Animated projection (time preview)

The landscape supports projecting tasks **N days ahead** without persisting future state:

```mermaid
sequenceDiagram
    participant UI as Priority Landscape UI
    participant API as GET /me/priority-landscape
    participant TS as TaskService

    UI->>API: request with projection_days = 0, 7, or 30
    API->>TS: compute coordinates at now + projection
    TS-->>API: effort, priority_y, urgency, score per task
    API-->>UI: TaskCoordinates + quadrants + recommendations
    UI->>UI: animate dots to new positions
```

Projection recomputes `current_urgency`, `current_effort`, and `priority_score` using a **virtual “now”** in the future, so users can see which tasks will drift toward the critical zone.
