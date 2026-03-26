## CoIntern

Local-first internship application tracker with a retro / PS1-inspired UI. Your data is stored in your browser via IndexedDB (no backend).

## Getting Started

### Prerequisites

- Node.js (recommended: Node 18+)
- npm

### Install

```bash
npm install
```

### Run (cross-platform)

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3001/` (dashboard at `http://localhost:3001/dashboard`).

Or use the convenience launcher (opens the dashboard automatically):

```bash
npm run app
```

### Production build (local)

```bash
npm run build
npm run start
```

Or:

```bash
npm run app:start
```

## Data + privacy

- Data is stored in **IndexedDB** in your browser for this origin.
- Cloning the repo on a new machine will **not** bring your data along automatically.
- Use the **Export / Import** buttons in the dashboard to move data between machines.
- `recovery.html` is a standalone recovery tool that can download your IndexedDB data as JSON.

## Windows-only launcher (optional)

If you want a Chrome “app window” launcher on Windows, see:

- `scripts/windows/cointern-launch.bat`
- `scripts/windows/run_silent.vbs`

## Tech

- Next.js App Router
- Zustand
- IndexedDB (`idb`)
- PWA service worker (`public/sw.js`)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
