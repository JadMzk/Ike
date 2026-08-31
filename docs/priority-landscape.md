# Ike — Dynamic Priority Landscape

Ike uses **two related 2D views** of the same tasks. As time passes, urgency grows and dots **move** on refresh or when projecting ahead.

---

## 1. Conceptual plane — Importance x Urgency

Each task is a point on a 0–10 grid:

- **X-axis** = current urgency (grows over time, capped at 10)
- **Y-axis** = importance (fixed unless the user edits the task)

```mermaid
flowchart TB
    subgraph high [High importance]
        direction LR
        A[Low urgency] --- B[High urgency]
    end
    subgraph low [Low importance]
        direction LR
        C[Low urgency] --- D[High urgency]
    end
    high --> low
    B -.- Z[Critical zone: top-right]
```

**Over time:** dots slide **right** along their row (urgency increases).

**Score:** `priority_score = importance * current_urgency` (range 0–100)

| Score | Level | Color |
|-------|-------|-------|
| under 25 | Low | Green |
| 25 to 49 | Medium | Yellow |
| 50 to 74 | High | Orange |
| 75 and above | Critical | Red |

---

## 2. App landscape — Effort x Priority

The **Priority Landscape** screen maps each task using computed values:

- **X-axis** = `current_effort` (0–10)
- **Y-axis** = normalized priority `min(10, priority_score / 10)`

![Conceptual quadrant map](./task-landscape-quadrants.png)

![Task landscape screen in the app](./screenshot-task-landscape.png)

Split at **5.0** on both axes:

```mermaid
flowchart TB
    subgraph y_high [Priority y >= 5]
        direction LR
        QW[Quick Wins<br/>effort under 5]
        BR[Big Rocks<br/>effort 5 and above]
    end
    subgraph y_low [Priority y under 5]
        direction LR
        NT[Nice to Do<br/>effort under 5]
        PD[Postpone or Delegate<br/>effort 5 and above]
    end
    y_high --> y_low
```

| Quadrant | Effort | Priority | When to use |
|----------|--------|----------|-------------|
| Quick Wins | under 5 | 5 and above | High impact, low friction |
| Big Rocks | 5 and above | 5 and above | Important but heavy |
| Nice to Do | under 5 | under 5 | Backlog |
| Postpone / Delegate | 5 and above | under 5 | Defer or hand off |

---

## 3. How axes are computed

```mermaid
flowchart LR
    I[importance] --> PS[priority_score]
    U[current_urgency] --> PS
    PS --> PY[y-axis priority]
    E[initial_effort] --> CE[current_effort]
    R[category resistance] --> CE
    CE --> X[x-axis effort]
    PY --> Q[quadrant]
    X --> Q
    Q --> REC[recommendations]
```

Formulas:

- `current_urgency = min(10, initial + growth_rate * days)`
- `priority_score = importance * current_urgency`
- `y = min(10, priority_score / 10)`
- `current_effort = min(10, initial_effort + resistance * sqrt(days))`

---

## 4. Motivation filter

| Motivation (1–10) | Emphasized quadrant |
|-------------------|---------------------|
| 1 to 4 | Quick Wins |
| 5 to 7 | Top tasks by score |
| 8 to 10 | Big Rocks |

---

## 5. Time projection

```mermaid
sequenceDiagram
    participant UI as Landscape UI
    participant API as API
    participant TS as TaskService

    UI->>API: GET landscape with projection days
    API->>TS: compute at now plus N days
    TS-->>API: coordinates per task
    API-->>UI: dots and recommendations
    UI->>UI: animate dot positions
```

Projection recomputes urgency, effort, and score using a **future timestamp** — nothing is saved to the database.
