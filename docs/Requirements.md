# Requirements

## Functional Requirements

- **Gift List Viewing**
  - Any user can view the list of gifts.
  - Each gift displays title, note, hyperlink, and image (if present).
  - Gifts are ordered by date added (newest first).

- **Anonymous User Actions**
  - Any user (no login required) can mark a gift as "bought" or "unbought".
  - The user who marked an item as "bought" is the only one who can unset its state.
  - All users see when an item is "bought".
  - Anonymous users are tracked via a cookie-based ID (no personal data stored).
  - Each user can only toggle the bought status for each gift once per device/browser.

- **Admin Actions**
  - Admins can log in via email OTP (one-time password) link.
  - Only authenticated admins can add, update, or delete gifts.
  - Admins can upload an image for each gift (processed as a 150x150 thumbnail).
  - Admins can delete images from storage.
  - Admins can log out at any time.

- **Image Handling**
  - Images are resized and center-cropped to 150x150px client-side before upload.
  - Images are stored in the backend local storage and served via public URLs.
  - Only JPEG images are stored (all uploads are converted to JPEG).

- **Security**
  - All admin actions require a valid backend session (JWT).
  - Anonymous actions use a cookie-based ID and an anon key maintained in local environment files.
  - No personal data is stored for anonymous users.
  - No sensitive data is stored in the browser.

- **Feedback & UX**
  - All actions provide fast, visible feedback (success/error messages).
  - Mobile-first, responsive design.
  - Modals are used for admin login and gift form.

---

## User Stories

- **As a visitor**, I can view the list of gifts without logging in.
- **As a visitor**, I can see certain items are bought and others are not.
- **As a visitor**, I can mark a gift as bought or unbought, and my choice is remembered on my device.
- **As a visitor**, I can only mark a gift as unbought if I previously marked it as bought.
- **As a visitor**, I can tell whether I personally marked a gift as bought or whether another user has vouched to buy it, so I know if a claim is mine or someone else's.
- **As a visitor**, when I mark a gift as bought I receive celebratory feedback (confetti) so I get positive reinforcement for my action.
- **As a visitor**, when I mark/unmark a gift the UI updates optimistically without flashing or showing transient loading indicators, so my action feels immediate.
- **As a visitor**, I can see an accessible tooltip for the "Mark as Bought" toggle that appears on hover or focus, is dismissable and persistent for my device, and explains the toggle's behavior.
- **As a visitor**, bought items are visually emphasized (for example bolded) so they are easy to spot.
- **As an admin**, I can log in securely using an email OTP link.
- **As an admin**, I can add new gifts with a title, note, hyperlink, and image.
- **As an admin**, I can update or delete any gift.
- **As an admin**, I can upload and remove images for gifts.
- **As an admin**, when I delete or update a gift, its associated image is removed from server storage so no orphan images remain.
- **As an admin**, image uploads are handled correctly (no double-cropping) and stored at expected quality after server processing.
- **As an admin**, authentication uses email OTP only (no password login), and the UI does not expose the admin email while logged in.
- **As an admin**, I can log out at any time.

---

## Technical Requirements

Technical specifications are detailed in the [Technical Specifications](Technical_Spec.md) document.

- **Development Environment**
  - Database migrations and development tasks support `.env.local` files for local environment configuration.

---

## Non-Functional Requirements

- **Performance**
  - All user actions should complete within 1 second under normal conditions.
  - Image uploads and processing should be optimized for speed and quality.

- **Accessibility**
  - All interactive elements are accessible via keyboard.
  - Modals and forms are screen-reader friendly.

- **Privacy**
  - No personal data is stored for anonymous users.
  - Admin emails are only used for authentication.

- **Security**
  - All API calls are authenticated and validated server-side.
  - No sensitive data is exposed to the client.
  - Cookies in production are set with the `Secure` flag and use the `__Host-` prefix where applicable (ensures cookies are only sent over HTTPS and use the strongest cookie scope).
  - Admin-level actions require a valid signed JWT token verified on the backend (prevents privilege escalation by forging cookie values).
  - File uploads are hardened: only one file allowed per upload, size limits enforced, magic-byte (content) validation performed, and server-side streaming/processing limits in place to mitigate zip bombs and memory exhaustion.
