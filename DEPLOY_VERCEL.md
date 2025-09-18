Deploying to Vercel

Prereqs (local):
- GitHub repo with your changes pushed to a branch (preferably `main` for production)
- A Vercel account connected to your GitHub account
- Node.js (LTS) and npm installed locally

Quick steps (Vercel web UI):
1. Push your branch to GitHub: `git add . && git commit -m "Deploy: UI polish" && git push origin feature/add-next-deploy`
2. Go to https://vercel.com/new and select your repository.
3. Accept defaults (Vercel auto-detects Next.js). Set Environment Variables if needed.
4. Click "Deploy" and wait for the build logs.
5. After deployment completes, open the generated URL and test.

CLI deployment (optional):
1. Install Vercel CLI: `npm i -g vercel`
2. From project root run: `vercel` and follow prompts to link the project to Vercel and deploy.

Troubleshooting:
- If build fails, open Vercel build logs; common issues include Node version mismatch or missing env vars.
- For asset prefixing, ensure `_next` and static assets are accessible.

Notes:
- This repo includes `next` in `package.json` and standard `dev`/`build` scripts. Vercel will run `next build` automatically.
- If you want, I can create a GitHub Action to auto-deploy on merge to `main`.

Run locally from VS Code

You can start the dev server from the VS Code UI using the included tasks and launch configs:

- Run the task: Command Palette -> `Tasks: Run Task` -> select `npm: dev` (this runs `npm run dev` in the integrated terminal).
- Once the server is running, open the Run panel and start `Launch Chrome against localhost` or `Launch Edge against localhost` to open the app.

If you prefer the terminal, `npm install` and `npm run dev` still work as usual.
