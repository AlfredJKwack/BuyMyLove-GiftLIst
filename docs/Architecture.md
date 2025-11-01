# Architecture

## Overview

BuyMyLove GiftList is a single-page web application for managing and sharing gift ideas. It supports anonymous users (for marking gifts as bought) and admin users (for managing the gift list) via OTP email login. The backend is powered by node.js and a PostgreSQL database and local storage (S3 compatible).

---

## System Diagram

```mermaid
flowchart TD
    subgraph Client_Browser
        A[GiftList UI]
        B[GiftForm_Admin]
        C[AuthForm_Admin]
        D[Anonymous User]
    end

    subgraph Supabase
        E[Edge Functions]
        F[Postgres DB]
        G[Storage_gift-images]
        H[Auth_OTP]
    end

    A -- fetchGifts --> E
    B -- add/update/delete gift --> E
    D -- toggle bought status --> E
    B -- upload/delete image --> G
    E -- read/write --> F
    C -- login/logout --> H
    E -- validate auth --> H
    B -- fetch image URLs --> G
```

---

## Primary Flows

### 1. Add/Update/Delete Gift (Admin)

```mermaid
sequenceDiagram
    participant Admin as Admin User (Browser)
    participant UI as GiftForm
    participant Edge as Supabase Edge Function
    participant DB as Supabase DB
    participant Storage as Supabase Storage

    Admin->>UI: Fill form (add/update/delete)
    UI->>Edge: Call add-gift/update-gift/delete-gift (with JWT)
    Edge->>DB: Insert/Update/Delete gift row
    Edge-->>UI: Success/Error
    UI->>Storage: (optional) Upload/Delete image
    Storage-->>UI: Image URL/Success
    UI-->>Admin: Show feedback
```

---

### 2. Image Handling

```mermaid
sequenceDiagram
    participant Admin as Admin User (Browser)
    participant UI as GiftForm
    participant Pica as Pica (Thumbnail)
    participant Storage as Supabase Storage

    Admin->>UI: Select image
    UI->>Pica: Resize & crop to 150x150
    Pica-->>UI: Thumbnail blob
    UI->>Storage: Upload thumbnail
    Storage-->>UI: Public image URL
    UI-->>Admin: Show image preview
    Admin->>UI: (optional) Delete image
    UI->>Storage: Delete image file
    Storage-->>UI: Success/Error
```

---

### 3. Anonymous User: Toggle Bought Status

```mermaid
sequenceDiagram
    participant User as Anonymous User (Browser)
    participant UI as GiftList
    participant Edge as Supabase Edge Function
    participant DB as Supabase DB

    User->>UI: Click "Mark as bought"
    UI->>Edge: Call toggle-bought-status (with cookie ID)
    Edge->>DB: Update bought status for gift
    Edge-->>UI: Success/Error
    UI-->>User: Update UI
```

---

### 4. Admin Login Flow (OTP)

```mermaid
sequenceDiagram
    participant Admin as Admin User (Browser)
    participant UI as AuthForm
    participant Supabase as Supabase Auth

    Admin->>UI: Enter email, submit login
    UI->>Supabase: signInWithOTP(email)
    Supabase-->>Admin: Email with login link
    Admin->>Supabase: Click link, authenticate
    Supabase-->>UI: Session established
    UI-->>Admin: Show admin panel
```

---

## Key Components

- **GiftList**: Displays all gifts, allows anonymous users to mark as bought.
- **GiftForm**: Admin-only, for adding/updating/deleting gifts and images.
- **AuthForm**: Handles admin OTP login/logout.
- **Backend Edge Functions**: Secure backend logic for all gift actions.
- **Backend Storage**: Stores and serves gift images.
- **Backend Auth**: Handles admin authentication via OTP.

---

## Data Flow

- All data operations (add/update/delete/toggle) are routed through backend functions for security.
- Images are processed client-side (cropped/resized) before upload.
- Anonymous users are tracked via a cookie-based ID, sent as a header for bought status toggling.
- Admin status is determined by a valid JWT session.

---

## Security

- Only authenticated admins can add/update/delete gifts.
- Anonymous users can only toggle bought status (no personal data stored).
- All API calls are authenticated via JWT or anonymous key as appropriate.
- No sensitive data is stored in the browser or transmitted unnecessarily.
