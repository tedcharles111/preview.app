# Preview Engine for Multiverse

## Deploy on Render
1. Push this repo to GitHub.
2. On Render, create a new **Web Service** and connect your repo.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables (from `.env.example`).
6. Deploy – your API will be live.

## Call from Multiverse
POST to `https://your-app.onrender.com/preview/create` with:
```json
{
  "files": { "index.html": "<h1>Hello</h1>" },
  "startCommand": "npx serve ."
}
