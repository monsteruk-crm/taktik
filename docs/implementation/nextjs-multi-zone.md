# Complete Next.js Multi-Zones Setup Guide

## Overview

Multi-Zones lets you split an application into multiple Next.js projects that serve different URL paths under the same domain. It is ideal for a wrapper app handling multiplayer/matches/leaderboards alongside a dedicated game app.

## Architecture for Your Project

- **Wrapper App (Main Zone)** handles `/`, `/matches`, `/leaderboard`, etc.
- **Game App (Secondary Zone)** serves `/game` and every sub-route under that path.

Both apps deploy independently to Vercel, but users experience them as a seamless, single application.

---

## Step 1: Configure the Game App (Secondary Zone)

In your game project, configure `next.config.js` so assets have their own prefix and the app runs under `/game`.

```js
// game-project/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: '/game-static',
  basePath: '/game', // All game routes live beneath /game
};

module.exports = nextConfig;
```

Key points:

- `assetPrefix: '/game-static'` → all JS/CSS assets are served from `/game-static/_next/...`.
- `basePath: '/game'` → every page automatically inherits the `/game` prefix.

If you are running Next.js 14 or older, add a rewrite so `/game-static/_next` assets resolve correctly:

```js
// game-project/next.config.js (Next.js 14 and older)
const nextConfig = {
  assetPrefix: '/game-static',
  basePath: '/game',
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/game-static/_next/:path+',
          destination: '/_next/:path+',
        },
      ],
    };
  },
};

module.exports = nextConfig;
```

---

## Step 2: Configure the Wrapper App (Main Zone)

In `next.config.js` for the wrapper, forward `/game` routes to the game app by using rewrites that point to the production domain stored in an environment variable.

```js
// wrapper-project/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/game',
        destination: `${process.env.GAME_DOMAIN}/game`,
      },
      {
        source: '/game/:path+',
        destination: `${process.env.GAME_DOMAIN}/game/:path+`,
      },
      {
        source: '/game-static/:path+',
        destination: `${process.env.GAME_DOMAIN}/game-static/:path+`,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Step 3: Environment Variables Setup

### Local Development

Create `.env.local` inside the wrapper app and point `GAME_DOMAIN` at the local port used by the game project.

```env
# wrapper-project/.env.local
GAME_DOMAIN=http://localhost:3001
```

### Vercel Production

In the wrapper app's Vercel project settings, add an environment variable:

- Key: `GAME_DOMAIN`
- Value: `https://your-game-app.vercel.app` (the production URL returned after deploying the game app)
- Apply it to Production, Preview, and Development environments.

---

## Step 4: Local Development Testing

Run both projects on different ports.

1. **Terminal 1 – Game App**
   ```bash
   cd game-project
   npm run dev -- -p 3001
   ```
2. **Terminal 2 – Wrapper App**
   ```bash
   cd wrapper-project
   npm run dev
   ```

Now visit `http://localhost:3000`. The wrapper routes behave normally, while `http://localhost:3000/game` is served by the game app.

---

## Step 5: Deploy to Vercel

Deploy each app independently.

1. Deploy the game app
   ```bash
   cd game-project
   vercel --prod
   ```
   Note the production URL (e.g., `your-game-app.vercel.app`).
2. Update `GAME_DOMAIN` in the wrapper app's Vercel settings to that URL.
3. Deploy the wrapper app
   ```bash
   cd wrapper-project
   vercel --prod
   ```

---

## Important Implementation Notes

### Linking Between Zones

Use plain `<a>` tags when navigating across zones so the browser performs a full page load. Next.js `<Link>` triggers client-side navigation and breaks across the zone boundary.

```jsx
// In wrapper app
<a href="/game">Play Game</a>

// In game app
<a href="/leaderboard">View Leaderboard</a>
```

### Route Ownership

Each path must belong to exactly one zone. Avoid having both apps serve the same route (for example, `/about`).

### Sharing Code Between Apps

**Option 1 – Monorepo (recommended):**

```
my-project/
├── apps/
│   ├── wrapper/
│   └── game/
└── packages/
    └── shared/  # utilities, types, components
```

**Option 2 – Private npm packages:** publish shared logic and import it from both apps.

### Using Prisma with Both Apps

Create a shared package that exports the Prisma client and schema:

```
packages/
└── database/
    ├── prisma/
    │   └── schema.prisma
    ├── client.ts
    └── package.json
```

Both apps import from this package so they share the same database layer.

### Server Actions

If you rely on Server Actions, add the same `experimental.serverActions.allowedOrigins` block to both apps so they accept requests from each other's domains.

```js
// next.config.js in both projects
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['your-production-domain.com'],
    },
  },
};
```

---

## Complete Example Configuration

### Game App (`game-project/next.config.js`)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: '/game-static',
  basePath: '/game',
  experimental: {
    serverActions: {
      allowedOrigins: ['your-wrapper-domain.vercel.app'],
    },
  },
};

module.exports = nextConfig;
```

### Wrapper App (`wrapper-project/next.config.js`)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/game',
        destination: `${process.env.GAME_DOMAIN}/game`,
      },
      {
        source: '/game/:path+',
        destination: `${process.env.GAME_DOMAIN}/game/:path+`,
      },
      {
        source: '/game-static/:path+',
        destination: `${process.env.GAME_DOMAIN}/game-static/:path+`,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Testing Checklist

- Game app runs on `http://localhost:3001/game`
- Wrapper app runs on `http://localhost:3000`
- Visiting `http://localhost:3000/game` renders the game project
- All game assets load correctly from `/game-static`
- Navigation between `/game` and wrapper routes uses `<a>` tags
- Prisma (or any shared database layer) connects from both apps
- Both apps are deployed independently to Vercel
- The production wrapper routes to the production game app via `GAME_DOMAIN`

---

## Additional Resources

- [Next.js Multi-Zones Documentation](https://nextjs.org/docs/app/guides/multi-zones?utm_source=support-chat)
- [Vercel Multi-Zones Example](https://github.com/vercel/next.js/tree/canary/examples/with-zones)

This setup is simpler than Docker and works identically locally and on Vercel. Your game stays autonomous, and the wrapper elegantly orchestrates everything.
