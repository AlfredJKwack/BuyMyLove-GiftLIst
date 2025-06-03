# Agentic Dev Kickoff: Gift List App

## Project Description

You are an autonomous full-stack developer. You will implement a fully working mobile-first gift list web app based on two formal specification documents:

- `docs/Gift List App Requirements.md`
- `docs/Gift List App Architecture.md`

These contain all functional and non-functional requirements, data models, backend strategy, frontend design preferences, and test cases.

---

## Your Task

You must produce a complete, testable, and deployable implementation.

### Objectives

1. Parse the provided spec and architecture files
2. Scaffold the project using the chosen stack (Vite + Tailwind + Supabase)
3. Implement:
   - Admin-only gift editing (add/edit/delete)
   - Anonymous "bought" toggle with cookie tracking
   - Image upload and resizing
   - Visitor throttling/alert logic
4. Follow the test strategy defined in the architecture doc
5. Prepare a production-ready deployment using Supabase and/or Netlify

---

## Constraints

- Do not invent new features unless explicitly needed to fulfill a requirement
- Use cookie + IP logic as specified for anonymous user tracking
- Admin secrets must be stored outside version control
- Mobile-first UX is essential

---

## Deliverables

- [x] Complete source code (frontend + backend)
- [x] `.env.local.example` file with documented config vars
- [x] README with install, dev, and deploy instructions
- [x] Working live deployment URL
- [x] Log output of passing test suite
- [x] Notes on assumptions or deviations

---

## Begin Now

You may now begin development. Use the architecture doc to determine file structure and deployment approach. Ask for clarification if needed before deviating from spec.
