AHM Medicare Training — Local type-check helper

Quick steps to run TypeScript checks locally:

1. Install Node.js (if not already installed): https://nodejs.org/
2. From project root run:

```powershell
npm install
npm run typecheck
```

To run tests and linters locally after installing dependencies:

```powershell
npm run test
npm run lint
npm run format
```

Note for Windows/PowerShell: ESLint patterns are passed through npm and should work, but if you see pattern matching issues use:

```powershell
npx eslint src --ext .ts,.tsx,.js,.jsx --no-error-on-unmatched-pattern
```

Deploy to Vercel (public URL)
1. Push this repository to GitHub.
2. Sign in to https://vercel.com and create a new project from your GitHub repo.
3. Vercel will detect Next.js — click deploy. After deploy completes you get a public URL where agents can test the app.


This will install dependencies and run `tsc --noEmit` to surface any type errors.

If you want me to attempt fixes, run the typecheck and paste the error output here.
