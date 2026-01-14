# Tiers With Friends — Server

## Overview

Backend for **Tiers With Friends**, built with **Express** + **socket.io**. Hosts the WebSocket API used for lobbies, tier set selection, game start, item placement, and voting.

## Tech

- Node.js + TypeScript
- Express
- socket.io

## Prerequisites

- Node.js (LTS)
- npm

## Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm start
```

## Environment Variables

```sh
PORT (default: 3001) - port this API is served from
CLIENT_ORIGIN (default: http://localhost:5173) - allowed CORS origin for the client
ENABLE_DEBUG_CONTROLS (default: false) - boolean, determines if the client is allowed to access debug controls
```

## Health Check

GET /health → { ok: true }
