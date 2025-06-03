# Gift List Application Requirements Specification

## 1. Overview

This is a single-user web application that allows the authenticated user ("Admin") to maintain a list of desired gifts. The list is publicly accessible at a predictable URL and allows anonymous users to mark gifts as "bought" or "unbought" under limited conditions.

## 2. User Roles

### 2.1 Admin (Authenticated User)

* Can add, edit, and delete gift items
* Can view all gifts with full editing controls
* Sees bought/unbought status

### 2.2 Anonymous User (Unauthenticated Visitor)

* Can view the gift list
* Can mark a gift as "bought" if it is currently unbought
* Can unmark a gift only if they were the user who marked it as bought (cookie-based tracking)
* Cannot add, edit, or delete any gifts

## 3. Gift Item Data Model

| Field          | Type     | Required | Notes                                                 |
| -------------- | -------- | -------- | ----------------------------------------------------- |
| title          | String   | Yes      | Displayed as clickable hyperlink                      |
| hyperlink      | URL      | Yes      | Opens in a new tab                                    |
| note           | String   | No       | Limited to a few sentences                            |
| image          | File     | No       | Uploaded and resized server-side                      |
| bought         | Boolean  | Yes      | Modifiable by anonymous users with restrictions       |
| dateAdded      | DateTime | Yes      | Set automatically at creation                         |
| boughtByCookie | String   | No       | Cookie ID of the anonymous user who set bought status |

## 4. Functional Requirements

### 4.1 Authentication

* Admin authentication is required to see edit/delete controls
* Secrets for authentication must be stored in a file excluded from version control

### 4.2 Gift Management (Admin Only)

* Add a new gift with required and optional fields
* Edit any field of an existing gift
* Delete a gift
* Inline editing in the primary UI is preferred

### 4.3 Image Upload and Resizing

* Images must be uploaded and resized server-side
* Multiple sizes should be generated (e.g., thumbnail, medium, full)
* Only one image per gift

### 4.4 Bought Status (Anonymous Interaction)

* Anonymous users can toggle "bought" on gifts that are not marked
* A cookie is stored on the client to track who set the bought flag
* Only the original user (via cookie) can unmark a gift
* All users can see which gifts are marked as bought

### 4.5 Sharing and Access

* The list is accessible at a non-obscured, fixed public URL (e.g., `/index.html`)
* URL may be deployed in a subdirectory
* No index protection or token-based access

### 4.6 Rate Limiting and Abuse Detection

* The system must detect if more than 12 unique visitors interact in a single day
* Admin should receive a warning (e.g., via email or log)
* Throttling logic should temporarily suspend toggling functionality if abuse is detected

## 5. Non-Functional Requirements

* Mobile-first responsive design
* All interactions should be fast and minimal
* Backend should be lightweight and optionally deployed on GCP/Firebase/Supabase
* Avoid storing personal data of anonymous users
* Admin credentials and tokens must never be exposed in frontend code

## 6. UI Expectations

* Admin and anonymous users use the same base UI
* Admin sees edit/delete/add options inline
* Bought status is shown as an icon or checkbox toggle
* Each gift item is shown as a card or list entry with: title (link), image (if available), note (if any), date added, and bought status

## 7. Future Extensibility

* Admin login can be upgraded to OAuth (Google, GitHub, etc.)
* Support for multiple lists and authenticated sharing can be added
* Webhooks or notifications for new gifts or purchases could be implemented


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

## Summary

This setup gives you a low-friction, modern stack that works well for solo or small-team development and is easily extended over time. We avoid overengineering and keep admin credentials and logic isolated while enabling seamless anonymous access with cookie-based user control.
