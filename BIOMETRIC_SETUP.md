# Biometric (Fingerprint / Face ID) Login Setup

## 1. Install packages

```bash
npm install @simplewebauthn/server @simplewebauthn/browser
# or
pnpm add @simplewebauthn/server @simplewebauthn/browser
```

## 2. Run the SQL

Open Supabase → SQL Editor and run the file:

`app/admin/WEBAUTHN_SETUP.sql`

This creates:
- `webauthn_credentials` – stores public keys
- `webauthn_challenges` – temporary challenges

## 3. Environment variables (Vercel + local)

Add these (important for production):

```env
NEXT_PUBLIC_WEBAUTHN_RP_ID=yourdomain.com
NEXT_PUBLIC_WEBAUTHN_ORIGIN=https://yourdomain.com
```

For local development the defaults (`localhost` / `http://localhost:3000`) are used automatically.

## 4. How it works

### When adding a new user
After the user is created successfully, a “Register Fingerprint” panel appears.
The admin (or the user) can register a biometric on the current device.

### On login pages
Both Sales Login and Admin Login now show a **“Login with Fingerprint / Biometrics”** button.

## 5. Important notes

- Biometrics are **device-bound**. A user must register on each device they want to use.
- Works best on phones and modern laptops (Chrome, Edge, Safari, Firefox).
- Requires HTTPS in production (Vercel already provides this).

## 6. Files added / changed

**New files**
- `app/actions/webauthn.ts`
- `app/components/BiometricLoginButton.tsx`
- `app/components/RegisterBiometric.tsx`
- `app/admin/WEBAUTHN_SETUP.sql`
- `BIOMETRIC_SETUP.md`

**Updated files**
- `app/login/page.tsx` (Sales login)
- `app/admin/login/page.tsx` + `app/admin-login/page.tsx`
- `app/admin/add-users/page.tsx`
- `app/actions/users.ts` (returns `userId` on success)
