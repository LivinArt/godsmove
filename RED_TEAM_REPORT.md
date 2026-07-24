# GODSMOVE: Red Team & Destructive QA Testing Report

This report documents the security vulnerabilities, architectural flaws, functional gaps, and code quality weaknesses identified during a simulated "destructive testing" sweep of the GODSMOVE streetwear eCommerce platform.

---

## 1. Executive Risk Summary

| Vulnerability / Flaw | Risk Level | Impact | Status |
| :--- | :--- | :--- | :--- |
| **Missing Supabase Auth Trigger (`auth.users` -> `profiles`)** | **CRITICAL** | Wipes signup capability; new registrations crash database relations. | **FAIL** |
| **Broken Middleware Route Protection for User Profile** | **HIGH** | Bypasses auth checks on `/profile` due to checking legacy `/account` prefix. | **FAIL** |
| **Mocked / Non-Functional Checkout & Order Actions** | **HIGH** | Users cannot actually purchase items; checkout form ends in a browser alert. | **FAIL** |
| **Zustand Cart Serialization Performance Bottleneck** | **MEDIUM** | Persisting deep nested product object trees to `localStorage` risks storage overflow. | **FAIL** |
| **Hardcoded/Static Admin Bypass Secret** | **MEDIUM** | Leaked/guessed parameter allows complete bypass of operations dashboards. | **FAIL** |
| **Missing Database-Level Row Level Security (RLS)** | **MEDIUM** | Raw SQL database RLS policies from migrations are missing in the new database. | **FAIL** |

---

## 2. Detailed Vulnerabilities & Flaws

### 2.1 Missing Supabase Auth Profile Sync Trigger
- **Risk Level**: **CRITICAL**
- **Vulnerability Category**: Database Logic / Broken Sync
- **Description**: 
  - The application relies on a PostgreSQL trigger (`on_auth_user_created` executing `public.handle_new_user()`) to automatically copy new users created in Supabase Auth (`auth.users` table) into the application's public profiles table (`public.profiles`).
  - Because the database was synchronized using `prisma db push` on the new Supabase database, **custom triggers, functions, and DB triggers were NOT created**.
  - As a result, new user signups do not create a `public.profiles` row, crashing all downstream features (wallets, orders, and dashboard profiles) for new users.
- **Reproduction Steps**:
  1. Register a new user account through `/login` (Supabase Auth).
  2. Attempt to view the `/profile` page or create an order.
  3. The system will throw an error or crash due to foreign key violations or `null` profile references.
- **Suggested Fix**:
  Execute the trigger creation SQL from the init migration file directly in the Supabase SQL editor:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, "createdAt", "updatedAt")
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  ```

---

### 2.2 Broken Middleware Route Protection for User Profile
- **Risk Level**: **HIGH**
- **Vulnerability Category**: Broken Authentication / Path Traversal
- **Description**: 
  - The Next.js middleware (`src/proxy.ts`) protects the customer profile page using:
    ```typescript
    if (!user && pathname.startsWith('/account')) { ... redirect to /login }
    ```
  - However, there is no `/account` route in the application. The customer account route is actually named `/profile`.
  - Because of this path mismatch, any unauthenticated user can directly bypass the middleware and access the `/profile` route without redirect locks.
- **Reproduction Steps**:
  1. Open a clean browser session (clear cookies, cache, and storage).
  2. Navigate directly to `http://localhost:3000/profile`.
  3. The page shell loads without locking or redirecting you to `/login`.
- **Suggested Fix**:
  Update [src/proxy.ts](file:///e:/GODSMOVE%20WEBSITE/ECOM-20260712T173753Z-2-001/ECOM/GODSMOVE/src/proxy.ts) line 91 to check `/profile` instead of `/account`:
  ```typescript
  if (!user && pathname.startsWith('/profile')) {
  ```

---

### 2.3 Mocked / Non-Functional Checkout Form
- **Risk Level**: **HIGH**
- **Vulnerability Category**: Functional Gap / Mocked Code
- **Description**: 
  - The front-end checkout page form submission (`handleSubmit` in `src/app/checkout/page.tsx`) does not make any backend calls to submit orders or execute credit transactions. It ends in a static browser alert:
    ```typescript
    alert('Checkout flow would initiate Razorpay here. This is a frontend demo.');
    ```
  - The API checkout endpoints (`/api/create-order` and `/api/verify-payment`) are also mocked, returning static objects instead of communicating with Razorpay or updating database payment statuses.
- **Reproduction Steps**:
  1. Add items to the cart and navigate to `/checkout`.
  2. Fill out name, shipping details, and select a payment method.
  3. Click "Place Order". A standard alert popup blocks execution, and no data is created in the PostgreSQL database.
- **Suggested Fix**:
  Refactor the checkout page form to call `createOrder()` server actions and link the Razorpay client library triggers to complete actual payments on the backend.

---

### 2.4 Zustand Cart Serialization Performance Bottleneck
- **Risk Level**: **MEDIUM**
- **Vulnerability Category**: Performance Bottleneck / Denial of Service
- **Description**: 
  - The Zustand state store (`src/store/useStore.ts`) uses the `persist` middleware to serialize cart items to `localStorage`.
  - It saves the entire nested `product` object graph (including all variants, tags, images, and category objects) inside the cart array.
  - If a user adds multiple products to the cart, the browser executes massive stringify operations, slowing down main thread responsiveness and risking `QuotaExceededError` storage limits.
- **Reproduction Steps**:
  1. Add multiple items to the cart.
  2. Inspect the local storage key `godsmove-store`.
  3. Observe massive nested object data dumps.
- **Suggested Fix**:
  Partialize the state to save only the lightweight IDs (`productId`, `variantId`, `quantity`, `size`) in `localStorage`, and fetch details dynamically on load.

---

### 2.5 Hardcoded/Static Admin Bypass Secret
- **Risk Level**: **MEDIUM**
- **Vulnerability Category**: Privilege Escalation / Hardcoded Credentials
- **Description**: 
  - The middleware allows anyone to bypass administrative auth rules and gain full admin operations read/write rights if a URL parameter `?secret=zaids_godsmove` is provided.
  - This hardcoded secret exposes the entire operations console if leaked, guessed, or retrieved from the client source control assets.
- **Reproduction Steps**:
  1. Navigate to `http://localhost:3000/admin?secret=zaids_godsmove`.
  2. Observe that you are automatically granted a cookie bypass session and gain full administrative privileges.
- **Suggested Fix**:
  Remove static secret bypass tokens from middleware in production environments. Enforce Supabase role checks exclusively.

---

### 2.6 Missing Database Row Level Security (RLS)
- **Risk Level**: **MEDIUM**
- **Vulnerability Category**: Security Configuration Drift
- **Description**:
  - The initial database design script defines specific RLS commands (e.g., `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`).
  - Because `prisma db push` was used for restoration, RLS is currently disabled in the new database.
  - This leaves the database tables exposed to read/write leakage if client-side connections bypass Next.js API routes and hit PostgreSQL directly.
- **Suggested Fix**:
  Run the SQL policies script directly in the Supabase console to re-enable row level security and enforce appropriate read/write limits.

---

## 3. UI/UX Problems & Spacing Flaws

- **Mocked Profile Inputs**: The customer profile contact cards use hardcoded input fields (`defaultValue="Guest"`, `guest@godsmove.in`, `₹0.00`). They are not synced to database profiles or wallets.
- **Admin Image Uploads**: Product creation forms inside `/admin/products/new` assume a static media repository, showing broken image placeholders if uploads are invalid or fail.
- **Missing Loading skeletons**: Navigating between product list drops displays empty pages briefly instead of smooth loading loaders or placeholders.
