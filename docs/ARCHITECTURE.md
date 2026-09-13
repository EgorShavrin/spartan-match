# Architecture notes

Written for explaining the project out loud. The README covers setup and the
formula; this file covers what happens at runtime.

## The request path

```text
User
  |
  v
Next.js               a page component in frontend/app/
  |
  v
lib/api.ts            the only file that calls fetch()
  |
  |  HTTP GET / POST, JSON body, JSON response
  v
FastAPI               main.py routes the URL to a router function
  |
  v
routers/              load rows, convert them, return them
  |
  +---> SQLite via SQLModel        (models.py)
  |
  +---> services/matcher.py        (pure Python scoring)
  |
  v
JSON response, validated against schemas.py
  |
  v
Next.js stores it in React state and renders it
```

## What happens when a project's matches are requested

Opening `/projects/1` in the browser:

1. Next.js renders `app/projects/[id]/page.tsx` and reads `1` from the URL.
2. The page calls `getProject(1)` and `getProjectMatches(1)` from `lib/api.ts`,
   both at once with `Promise.all`.
3. `lib/api.ts` issues `GET http://localhost:8000/projects/1/matches`.
4. FastAPI matches that URL to `get_project_matches` in `routers/matches.py`.
   The `Depends(get_session)` parameter opens a database session first.
5. The router loads the project with `session.get(Project, 1)`. If there is no
   such row it raises a 404 and stops here.
6. The router loads every member with `select(Member)`.
7. `to_member_profile` and `to_project_profile` convert the SQLModel rows into
   `MemberProfile` and `ProjectProfile` dataclasses. This is the only place the
   database and the matcher meet.
8. `rank_members_for_project` calls `calculate_match` once per member. Each call
   computes four component scores and builds the reason strings.
9. The list is sorted by total score descending, ties broken by name so the
   order is stable between requests.
10. The router attaches a 1-based rank and returns the list. FastAPI validates
    it against `List[MemberMatch]` and serializes it to JSON.
11. The browser receives the JSON. `useApiData` moves it from "loading" to
    "loaded" and stores it in React state.
12. The page maps over the array and renders one `MatchCard` per member.
    `MatchBreakdown` draws the four bars from the numbers already in the
    response.

The frontend computes no part of any score. It rounds the total for display and
converts each component into a bar width. Everything else was decided by
`matcher.py`.

## Why the matcher is isolated

`services/matcher.py` imports only `dataclasses` and `typing`. It never sees a
request, a session, or a row. Three things follow:

- `tests/test_matcher.py` runs in milliseconds with no fixtures and no database.
- The scoring rules exist in exactly one place, so the UI and the tests can
  never disagree about them.
- Swapping SQLite for PostgreSQL, or FastAPI for anything else, would not
  require touching the scoring logic at all.

## Why collections are stored as JSON columns

`skills`, `interests`, `preferred_roles`, `learning_goals`, `topics`, `roles`,
and `technologies` are JSON columns rather than separate tables.

Normalising them would mean roughly five join tables plus the association rows,
and would buy the ability to query *inside* those collections in SQL. Nothing in
this application does that. Every read loads a complete member or project,
because the matcher needs the whole profile to score anything. The trade-off is
deliberate and would be worth revisiting only if a feature needed something like
"all members who know Python at level 4 or above" as a database query.

## Where each layer's responsibility ends

| File | Owns | Must never contain |
| --- | --- | --- |
| `main.py` | app setup, CORS, startup, router registration | business logic, SQL |
| `routers/*.py` | HTTP concerns, loading and saving rows | scoring rules |
| `models.py` | table definitions | validation of request bodies |
| `schemas.py` | request and response shapes | database access |
| `services/matcher.py` | every scoring rule and explanation | framework or database imports |
| `lib/api.ts` | URLs, headers, error translation | rendering |
| `app/**/page.tsx` | layout and state for one route | fetch calls, score arithmetic |

## Known limits

- Matching is string based. "React" and "ReactJS" are unrelated skills, which is
  why both forms use fixed option lists rather than free text.
- Every request re-scores every member. At ten members and five projects that is
  fifty comparisons of a few dozen operations each, which is nothing. At ten
  thousand members it would need caching.
- There is no authentication, so anyone who can reach the API can add members.
  Acceptable for a tool running on a laptop; not acceptable if deployed publicly
  with real data.
