# Restaurant Management Backend

Express + TypeScript + MongoDB (Mongoose) REST API.

## Setup
```bash
npm install
cp .env.example .env      # JWT_SECRET kam az kam 32 characters ka rakhein
npm run migrate           # indexes + roles migration
npm run seed:admin        # PEHLA admin (SEED_ADMIN_* values .env se)
npm run dev               # http://127.0.0.1:5000
```

## Roles
- `client`: register karte hi active.
- `admin`: register par `pending`. Koi **approved admin** usay approve (valid) ya reject (invalid) karta hai.
  Pending/rejected admin login nahi kar sakta. Reject hote hi uske purane tokens band ho jate hain.
- Pehla admin `npm run seed:admin` se banta hai (kyunke usay approve karne wala koi nahi hota).

## Endpoints
| Method | Path | Access |
|---|---|---|
| GET | /health/live, /health/ready | public |
| POST | /api/auth/register  (`role`: "client" ya "admin") | public |
| POST | /api/auth/login | public |
| POST | /api/auth/logout | login |
| GET / PATCH | /api/users/me | login |
| PATCH | /api/users/change-password | login |
| GET | /api/admin/admins?approvalStatus=pending&page=1&limit=20 | approved admin |
| PATCH | /api/admin/admins/:id/approve | approved admin |
| PATCH | /api/admin/admins/:id/reject  body: `{ "reason": "..." }` | approved admin |
