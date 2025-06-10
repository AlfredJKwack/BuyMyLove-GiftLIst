# Installation and User Guide

## 1. Installation

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Supabase project (with Edge Functions, Auth, Storage, and Postgres enabled)
- A configured email provider for Supabase Auth (for OTP login)

### Setup Steps

1. **Clone the repository:**
   ```sh
   git clone https://github.com/AlfredJKwack/BuyMyLove-GiftLIst.git
   cd BuyMyLove-GiftLIst
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`:
     ```sh
     cp .env.local.example .env.local
     ```
   - Edit `.env.local` and set:
     - `VITE_SUPABASE_URL` (your Supabase project URL)
     - `VITE_SUPABASE_ANON_KEY` (your Supabase anon key)
     - Any other required keys

4. **Set up Supabase:**
   - Create the required tables and storage buckets using the provided SQL and Supabase dashboard.
   - Deploy Edge Functions (`add-gift`, `update-gift`, `delete-gift`, `toggle-bought-status`) from `supabase/functions/`.
   - Ensure a `gift-images` storage bucket exists and is public.

5. **Run the development server:**
   ```sh
   npm run dev
   ```
   - The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 2. Usage Guide

### Anonymous Users

- **View Gifts:** Open the app in any browser to see the list of gifts.
- **Mark as Bought:** Click the "Mark as bought" button to toggle the bought status. Your choice is remembered on your device.
- **No Login Required:** You do not need to create an account or provide any personal information.

### Admin Users

- **Login:** Click the "Admin" button and enter your email. You will receive a login link via email (OTP).
- **Add Gift:** After logging in, use the "Add Gift" button to add a new gift. Fill in the title, note, hyperlink, and optionally upload an image.
- **Edit/Delete Gift:** Use the edit or delete buttons next to each gift to update or remove it.
- **Image Upload:** Images are automatically resized and cropped to 150x150px before upload.
- **Logout:** Use the "Logout" button in the admin panel to end your session.

---

## 3. Environment Configuration

- All secrets and environment variables must be set in `.env.local`.
- **Never commit `.env.local` to version control.**
- Example `.env.local`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## 4. Testing

- **Run all tests:**
  ```sh
  npm test
  ```
- **Test coverage includes:**
  - Gift CRUD operations
  - Image upload and deletion
  - Anonymous bought status toggling
  - Admin login/logout (OTP)
  - Cookie-based identity

---

## 5. Troubleshooting

- **Supabase Auth Issues:** Ensure your email provider is configured in Supabase and the redirect URL matches your app.
- **Edge Function Errors:** Check Supabase logs for function errors and ensure all environment variables are set.
- **Image Upload Fails:** Confirm the `gift-images` bucket exists and is public.
- **Environment Variables:** Double-check `.env.local` for typos or missing values.

---

## 6. Extending the Application

- The codebase is structured for easy addition of new features (e.g., wishlists, comments).
- Follow the existing patterns for new Edge Functions and UI components.
- Keep code simple and avoid unnecessary abstraction.
