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
