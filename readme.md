# FinFlow Login Portal

Unified authentication portal for FinFlow Individual and FinFlow SME.

## Project structure

```
finflow-login/
├── index.html              ← Frontend (single HTML file, no build step needed)
├── api/
│   └── auth/
│       ├── login.js        ← POST /api/auth/login
│       └── register.js     ← POST /api/auth/register
├── package.json
├── vercel.json
└── README.md
```

## Deploy to Vercel

### 1. Push to GitHub
Create a new GitHub repo and push all these files.

### 2. Import into Vercel
- Go to https://vercel.com/new
- Import your GitHub repo
- Framework preset: **Other**

### 3. Set environment variables
In the Vercel project settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/finflow` |
| `MONGODB_DB` (optional) | `finflow` (defaults to `finflow` if omitted) |

### 4. MongoDB collections
The API expects these collections inside the `finflow` database:
- `individual_users` — for Individual accounts
- `sme_users` — for SME accounts

Each document should have:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+91 XXXXX XXXXX",
  "email": "jane@example.com",
  "passwordHash": "<bcrypt hash>",
  "userType": "individual",
  "createdAt": "...",
  "updatedAt": "..."
}
```

If you have **existing users** whose passwords are stored as plain text or with a different hashing scheme, you'll need a one-time migration script to rehash them with bcrypt before deploying this login portal.

### 5. CORS
If your FinFlow apps (finflowsme.vercel.app / finflow-individual.vercel.app) call this login API directly, update the `Access-Control-Allow-Origin` headers in login.js and register.js from `'*'` to the specific origins, e.g.:
```js
res.setHeader('Access-Control-Allow-Origin', 'https://finflowsme.vercel.app');
```

### 6. App redirects after login
After successful login the portal redirects to:
- **Individual** → https://finflow-individual.vercel.app/dashboard
- **SME** → https://finflowsme.vercel.app/

To pass user session info into those apps, consider issuing a JWT on login and appending it as a URL param or storing it in localStorage before redirecting.

## Password requirements
- Minimum 8 characters
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one digit (0–9)
- At least one special character (!@#$%^&* etc.)
