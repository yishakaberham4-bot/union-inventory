# Union Inventory – Shop Management System

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. The `.env.local` file is already included with your Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- **Home** – Choose Sales Terminal or Admin Dashboard
- **Sales Login** (`/login`) – Staff ID + PIN login
- **Admin Dashboard** (`/admin`)
- **Manage Users** (`/admin/users`)
  - List users
  - Add new user (Admin / Sales Person)
  - Edit user
  - Delete user

## Database (profiles table)

Your `profiles` table should have at least these columns:

| Column     | Type                     |
|------------|--------------------------|
| id         | uuid (PK, references auth.users) |
| staff_id   | text                     |
| full_name  | text                     |
| role       | text (`admin` or `sales`) |
| email      | text (optional)          |
| is_active  | boolean (optional)       |
| created_at | timestamptz              |

## Optional: Service Role Key

To fully create / delete Auth users from the admin panel, add this to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find it in Supabase Dashboard → Project Settings → API → `service_role` (secret).

## Notes

- Sales users log in with Staff ID (e.g. `EMP-1001`) which is converted to `emp-1001@unioninventory.local`
- Make sure you create users with matching emails in Supabase Auth if you create them manually.
"# union-inventory" 
