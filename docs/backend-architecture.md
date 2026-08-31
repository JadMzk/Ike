# Ike — Backend Architecture

FastAPI service backed by Supabase Postgres. Auth is delegated to **Supabase Google OAuth**; the API verifies JWTs and owns all task logic.

---

## Layer overview

```mermaid
flowchart TB
    subgraph clients [Clients]
        APP[Expo mobile app]
    end

    subgraph supabase [Supabase]
        AUTH[Auth / Google OAuth]
        PG[(Postgres)]
    end

    subgraph api [FastAPI · app/]
        R[routers/]
        S[services/]
        D[dao/]
        M[models/]
        JWT[auth/jwt.py]
    end

    APP -->|Google sign-in| AUTH
    APP -->|Bearer JWT| R
    AUTH -->|JWT| APP
    R --> JWT
    R --> S
    S --> D
    D --> M
    M --> PG
    JWT -->|JWKS / HS256| AUTH
```

---

## Request flow (authenticated)

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Router
    participant JWT as jwt.py
    participant S as Service
    participant DAO as DAO
    participant DB as Postgres

    C->>R: HTTP + Authorization Bearer
    R->>JWT: decode_supabase_access_token
    JWT-->>R: AuthUser (id, email)
    R->>S: business logic
    S->>DAO: query / mutate
    DAO->>DB: SQLAlchemy
    DB-->>DAO: rows
    DAO-->>S: ORM models
    S-->>R: computed DTOs
    R-->>C: JSON response
```

---

## Class diagram (domain model)

```mermaid
classDiagram
    direction TB

    class Profile {
        +UUID id
        +datetime created_at
        +bool onboarding_completed
        +str plan_type
    }

    class Task {
        +int id
        +UUID profile_id
        +str name
        +str category
        +float importance_score
        +float initial_urgency_score
        +float urgency_growth_rate
        +float initial_effort
        +datetime created_at
        +bool completed
    }

    class UserCategoryResistance {
        +int id
        +UUID profile_id
        +str category
        +float resistance_factor
        +datetime last_activity_at
    }

    class AllowedEmail {
        +str email
        +datetime created_at
    }

    class User {
        +int id
        +str username
        <<legacy MVP>>
    }

    Profile "1" --> "*" Task : owns
    Profile "1" --> "*" UserCategoryResistance : learns
```

---

## Class diagram (application layers)

```mermaid
classDiagram
    direction TB

    namespace routers {
        class auth_router {
            +POST /auth/sync
            +GET /auth/me
        }
        class me_router {
            +GET /me/tasks
            +POST /me/tasks
            +GET /me/priority-landscape
        }
        class task_router {
            +GET/PATCH/DELETE /tasks/:id
            +PATCH /tasks/:id/complete
        }
        class user_router {
            <<deprecated>>
        }
    }

    namespace services {
        class TaskService {
            +create_task_for_profile()
            +compute_current_urgency()
            +compute_current_effort()
            +compute_priority_score()
            +get_priority_level()
            +get_dynamic_coordinates()
        }
        class PriorityLandscapeService {
            +get_task_coordinates()
            +classify_quadrant()
            +get_profile_plan()
            +adapt_recommendations_to_motivation()
        }
        class CategoryResistanceService {
            +compute_for_task()
            +record_completion()
        }
        class ProfileService {
            +sync_profile()
        }
        class AccessService {
            +is_email_allowed()
        }
    }

    namespace dao {
        class TaskDAO
        class ProfileDAO
        class CategoryResistanceDAO
        class AllowedEmailDAO
    }

    namespace auth {
        class decode_supabase_access_token
        class get_current_profile
    }

    auth_router --> ProfileService
    auth_router --> AccessService
    me_router --> TaskService
    me_router --> PriorityLandscapeService
    task_router --> TaskService
    ProfileService --> ProfileDAO
    ProfileService --> AccessService
    AccessService --> AllowedEmailDAO
    TaskService --> TaskDAO
    TaskService --> CategoryResistanceService
    CategoryResistanceService --> CategoryResistanceDAO
    PriorityLandscapeService --> TaskService
    me_router --> get_current_profile
    task_router --> get_current_profile
    get_current_profile --> decode_supabase_access_token
```

---

## API surface (current)

| Router | Prefix | Auth | Purpose |
|--------|--------|------|---------|
| `auth_router` | `/auth` | Bearer (sync) | Profile sync after login, optional allowlist |
| `me_router` | `/me` | Profile | CRUD-ish task list, create, landscape plan |
| `task_router` | `/tasks` | Profile | Single-task get/update/complete/delete |
| `user_router` | `/users` | Mixed | Legacy integer-user routes (deprecated) |

---

## Dynamic scoring ownership

```mermaid
flowchart LR
    subgraph stored [Persisted in DB]
        T[Task fields]
        CR[UserCategoryResistance]
    end

    subgraph runtime [Computed in TaskService]
        U[current_urgency]
        E[current_effort]
        P[priority_score]
        L[priority_level]
    end

    subgraph landscape [PriorityLandscapeService]
        C[TaskCoordinates]
        Q[quadrant]
        REC[recommendations]
    end

    T --> U
    T --> E
    CR --> E
    U --> P
    T --> P
    P --> L
    P --> C
    E --> C
    C --> Q
    C --> REC
```

Nothing in the **runtime** or **landscape** groups is written back to Postgres during normal reads — only task CRUD and completion update stored state.

---

## External dependencies

| Component | Role |
|-----------|------|
| **Supabase Auth** | Google OAuth, session JWTs |
| **Supabase Postgres** | `profiles`, `tasks`, `allowed_emails`, `user_category_resistance` |
| **SQLAlchemy** | ORM + connection pool (`DATABASE_URL`) |
| **PyJWT + JWKS** | Verify ES256 / HS256 Supabase tokens |
