# Gift List App Architecture Proposal

## 1. Overview

This architecture is designed for a lightweight, mobile-first gift list application with a single authenticated admin user and anonymous public visitors. The system must be extensible, secure, and low-maintenance.

---

## 2. High-Level Architecture

```
[ Public Web Clients (mobile + desktop) ]
                  |
          [ Cloudflare CDN (optional) ]
                  |
        [ Firebase Hosting or GCP Bucket ]
                  |
        [ Backend: Supabase Edge Functions ]
                  |
            [ Supabase Postgres DB ]
                  |
         [ Supabase Storage for Images ]
```

---

## 3. Technology Stack

### 3.1 Frontend Options

#### Option 1: React

* **Pros**:

  * Component-based: easy to manage UI state (e.g. toggle bought status)
  * Strong ecosystem for extensions, OAuth, form handling, animations
  * Future scalability
* **Cons**:

  * Requires bundling and more tooling
  * Slightly larger bundle size

#### Option 2: Vanilla + Vite (no React)

* **Pros**:

  * Super lightweight and fast
  * Minimal dependencies
  * Great for simple static apps
* **Cons**:

  * Harder to scale if the app grows
  * Manual DOM manipulation may get tedious

**Recommendation**: Start with Vite + Vanilla. Switch to React only if the UI needs grow complex.

### 3.2 CSS Framework Options

#### Option 1: Tailwind CSS

* **Pros**:

  * Utility-first = consistent and fast design
  * Responsive defaults (great for mobile-first)
  * Huge community and plugins
* **Cons**:

  * Learning curve for class-heavy HTML
  * Requires build step

#### Option 2: CSS Grid / Vanilla CSS

* **Pros**:

  * Full control over layout
  * No build tooling
* **Cons**:

  * More verbose
  * Harder to maintain as the app grows

**Recommendation**: Tailwind CSS — fits well with Vite and a component-based or even template-heavy UI.

---

## 4. Backend Stack (Preferred)

### Supabase

* **DB**: Postgres (strong relational model)
* **Storage**: Image uploads
* **Edge Functions**: Serverless logic for image resizing, bought status, cookie handling, abuse monitoring
* **Auth**: Starts with admin-only local secret; easily extendable to OAuth
* **Hosting**: Supabase Studio and Dashboard, deployable in minutes

**Rationale**: Supabase gives a full stack in one box: database, file storage, auth, and backend functions. It’s open-source, Postgres-based, and easy to work with.

---

## 5. Core Features

* Mobile-first responsive frontend
* Public access at fixed URL (e.g. `/index.html`)
* Admin-only controls inline
* Gift model includes:

  * Title (hyperlinked)
  * Image (optional, uploaded + resized)
  * Note (optional)
  * Date added
  * Bought flag
  * Cookie ID of buyer
* Anonymous users can toggle bought status via cookie logic
* Simple throttling and daily abuse detection with alert

---

## 6. Hosting & Deployment

* **Frontend Hosting**: Firebase Hosting, Netlify, or Supabase edge hosting
* **Backend Functions**: Supabase Edge Functions
* **Storage**: Supabase S3-compatible storage buckets
* **Secrets**: `.env.local`, excluded from git, loaded during build/deploy

---

## 7. Monitoring & Limits

* Record unique visitors (by IP + cookie) daily
* If >12 unique visitors:

  * Trigger alert to admin
  * Optionally disable bought toggling temporarily

---

## 8. Extensibility Notes

* Swap local login for OAuth (Google, GitHub)
* Add support for multiple lists
* Introduce notifications (email, webhook)
* Add rate limiting and analytics dashboards
* Progressive Web App (PWA) support possible with little overhead

---

## 9. Local Dev

* `npm run dev` — development server
* `npm run build` — minified bundle
* `supabase start` — local backend instance

---

## 10. Test Strategy

### 10.1 What Should Be Tested

#### Functional Testing

| Feature                        | Type                         | Who Tests It |
| ------------------------------ | ---------------------------- | ------------ |
| Add/edit/delete gift (admin)   | Unit + UI Test               | Dev + Admin  |
| Toggle bought/unbought (anon)  | Unit + Integration           | Dev          |
| Image upload and resizing      | Integration                  | Dev          |
| Cookie logic for ownership     | Unit + Integration           | Dev          |
| Throttling trigger (>12 users) | Integration + Log Inspection | Dev/Admin    |

#### Acceptance Testing

* Manual scenarios defined as Gherkin-style specs
* Done during UAT or post-deploy smoke testing

#### Visual Regression (Optional)

* Snapshot tests for UI after design enhancements
* Tools: Percy or Playwright screenshot diffs

### 10.2 Suggested Test Tools

| Layer           | Tool                    | Notes                          |
| --------------- | ----------------------- | ------------------------------ |
| Unit/Logic      | Vitest (if Vite)        | Fast, Jest-compatible          |
| UI Interaction  | Playwright              | Simulates admin/anon workflows |
| API Tests       | Supertest (Node API)    | If backend logic expands       |
| Storage mocking | Supabase JS SDK + stubs | For mocking uploads and auth   |

### 10.3 Minimal Viable Test Suite (MVT)

* [ ] Unit tests for cookie logic and gift state toggling
* [ ] Playwright scenario: user marks gift as bought, reloads, sees state preserved
* [ ] Admin can add/edit/delete
* [ ] Upload image, resize on backend, return image URL
* [ ] Throttling event triggered on fake 13th visitor

---

## Summary

This setup gives you a low-friction, modern stack that works well for solo or small-team development and is easily extended over time. We avoid overengineering and keep admin credentials and logic isolated while enabling seamless anonymous access with cookie-based user control.