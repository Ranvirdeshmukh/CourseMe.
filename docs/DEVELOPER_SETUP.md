# CourseMe Developer Setup

## Quick Start for New Developers

1. Clone the repo
2. Get `env.test.template` from the `/docs` folder
3. Save it as `.env.local` in the project root
4. Run:
   ```bash
   npm install
   npm start
   ```

You'll see `🧪 TEST` in the browser console - confirming you're on the test environment.

---

## Environment Switching (Admin Only)

**Switch to PRODUCTION:**
```bash
cp .env.production.backup .env
```

**Switch to TEST:**
```bash
cp docs/env.test.template .env
```

---

## What NOT to Commit

- `.env` files
- `backend/*.json` (service account keys)
- `data/sample_data.json`

---

## Test Firebase Project

- Project ID: `courseme-test`
- Console: https://console.firebase.google.com/project/courseme-test

## Production Firebase Project (Admin Only)

- Project ID: `coursereview-98a89`
- Console: https://console.firebase.google.com/project/coursereview-98a89

