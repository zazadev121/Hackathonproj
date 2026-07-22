# TeachBack

TeachBack is an AI-powered study tool with a teach-back twist: instead of the AI explaining topics to you, **you explain topics to the AI**, and it grades your understanding, surfaces gaps, and asks a targeted follow-up. When you score 80+ on a topic, you can mint a **Proof of Mastery** on Solana devnet — a permanent, portable, tamper-proof credential anchored on-chain and tied to your wallet, not stored in our database.

## Quick start

### Clone the repo

```bash
git clone https://github.com/zazadev121/Hackathonproj.git
cd Hackathonproj
npm install
```

### Set up your Groq API key (required)

`src/environments/environment.ts` is **gitignored** and is not included in the repo — you must create it locally:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

On Windows (PowerShell):

```powershell
Copy-Item src/environments/environment.example.ts src/environments/environment.ts
```

Open `src/environments/environment.ts` and replace `YOUR_GROQ_API_KEY` with your key from [console.groq.com](https://console.groq.com/).

Alternatively, set `GROQ_API_KEY` in your shell — `npm run build` auto-generates `environment.ts` via `scripts/generate-env.mjs`.

### Run the app

```bash
npm start
```

Open `http://localhost:4200/`. You need the [Phantom](https://phantom.app/) browser extension on **Devnet** with free SOL from [faucet.solana.com](https://faucet.solana.com/) to mint credentials.

## Features

- **TeachBack** — explain a topic, get graded, answer a follow-up, mint on-chain at 80+
- **Now Learning** — topics and scores saved in `localStorage`; continue where you left off
- **Long Test** — 10–15 AI-generated multiple-choice questions, graded F through A+

## Routes

| Path | Page |
|------|------|
| `/` | TeachBack flow |
| `/learning` | Now Learning (local storage) |
| `/test` | Long Test |

## Demo flow

1. Pick a topic (or click an example chip)
2. Explain it like you're teaching a beginner
3. Review AI grading: what you got right, wrong, and missed
4. Answer the follow-up question
5. See your final score and complete explanation
6. Score 80+ → connect Phantom → mint Proof of Mastery on Solana devnet

## Tech stack

- Angular 20 (standalone components, signals)
- Groq API (`openai/gpt-oss-120b`)
- Solana devnet (SPL Memo transactions via Phantom)

## Deploy on Vercel

1. Import [github.com/zazadev121/Hackathonproj](https://github.com/zazadev121/Hackathonproj) on [vercel.com](https://vercel.com)
2. Framework preset: **Angular** (or Other — `vercel.json` handles output)
3. Root directory: `./` (repo root)
4. Add environment variable:
   - **Name:** `GROQ_API_KEY`
   - **Value:** your Groq API key
5. Deploy

The build runs `prebuild` → generates `environment.ts` from `GROQ_API_KEY`, then `ng build`. Output is served from `dist/hackathon/browser` with SPA routing.

## Note on API keys

The Groq API key is loaded client-side for this hackathon demo. It is visible in the browser bundle — use a dedicated key and rotate after the event. **Never commit `environment.ts`**; only `environment.example.ts` belongs in git.

## Phantom wallet note

If you see `[PHANTOM] error getting provider injection options` in the browser console, that comes from the Phantom extension itself — it is harmless and does not block Connect Wallet or minting.
