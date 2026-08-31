# Ike — Main Process

End-to-end flow from task creation to the dynamic priority landscape.  
All dynamic scores are **computed at read time** — nothing is stored except the task’s initial fields and timestamps.

```mermaid
flowchart TD
    A([Create task]) --> B[Input name, category,<br/>importance, urgency, effort]
    B --> C[Set urgency growth rate<br/>default 0.1/day in app · 0.5/day in API model]
    C --> D[(Store task in Postgres)]
    D --> E{Task read or<br/>landscape request?}
    E -->|Yes| F[Compute days elapsed<br/>since created_at]
    F --> G["current_urgency = min(10,<br/>initial_urgency + growth_rate × days)"]
    G --> H["priority_score = importance × current_urgency<br/>(range 0–100)"]
    H --> I[Load category resistance<br/>adaptive, hidden from UI]
    I --> J["current_effort = min(10,<br/>initial_effort + resistance × √days)"]
    J --> K[Normalize priority for landscape<br/>priority_y = min(10, score / 10)]
    K --> L[Place dot on 2D landscape<br/>x = effort · y = priority_y]
    K --> M[Assign priority level badge]
    L --> N([Display dynamic plan<br/>+ recommendations])
    M --> N

    D --> O{User marks done?}
    O -->|Yes| P[Set completed = true<br/>record category activity]
    P --> Q[Decrease resistance<br/>for that category]
    Q --> E
    O -->|No| E

    subgraph levels [Priority level thresholds]
        direction TB
        L1["Low · green · score &lt; 25"]
        L2["Medium · yellow · score &lt; 50"]
        L3["High · orange · score &lt; 75"]
        L4["Critical · red · score ≥ 75"]
    end

    M -.-> levels
```

## Formulas (backend)

| Field | Formula |
|-------|---------|
| `current_urgency` | `min(10, initial_urgency + urgency_growth_rate × days_elapsed)` |
| `priority_score` | `importance × current_urgency` |
| `priority_y` (landscape) | `min(10, priority_score / 10)` |
| `current_effort` | `min(10, initial_effort + resistance × √days_elapsed)` |

## Key behaviours

- **Urgency grows linearly** over calendar time until it caps at 10.
- **Effort grows sub-linearly** (√days) and is modulated by per-category resistance learned from completions and inactivity.
- **Priority level** is derived only from `priority_score`, not from quadrant placement.
- Completing a task in a category **lowers resistance**; long inactivity in a category **raises** it (every 2 full days without a completion in that category).
