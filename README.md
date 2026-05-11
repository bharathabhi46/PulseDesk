# PulseDesk

PulseDesk is a full-stack AI Customer Support Automation platform built with the MERN stack. It includes JWT authentication, role-based workspaces, support tickets, AI triage, live chat, notifications, file uploads, email hooks, and deployment-ready structure for Vercel, Render, and MongoDB Atlas.

## Tech Stack

- MongoDB and Mongoose
- Express.js and Node.js
- React with Vite
- Tailwind CSS
- JWT authentication
- Socket.IO
- OpenAI API-ready AI service with local fallbacks
- Cloudinary uploads with local placeholders when credentials are absent
- Nodemailer email notifications

## Project Structure

```text
PulseDesk/
  client/              React, Vite, Tailwind frontend
  server/              Express, MongoDB, Socket.IO backend
  README.md
  package.json         npm workspace scripts
```

## Features

- Authentication: signup, login, JWT sessions, protected routes, admin/agent/customer roles
- Tickets: create, upload attachments, track status, priority, category, assignment, tags
- AI: generated summary, suggested reply, sentiment scoring, automatic priority detection
- Real-time: Socket.IO live chat, ticket update broadcasts, typing indicators
- Dashboard: ticket totals, status/priority/sentiment breakdowns, response time metric
- Notifications: persistent notifications for ticket activity and assignments
- Deployment: Vercel config for frontend, Render blueprint for backend, Atlas-ready env config

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB local instance or MongoDB Atlas cluster
- Cloudinary account for production uploads
- OpenAI API key for AI responses
- SMTP credentials for production email

### Install

```bash
npm install
```

### Environment

Create server and client env files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Minimum backend values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/pulsedesk
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Optional production integrations:

```env
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Seed Demo Users

```bash
npm run seed --workspace server
```

Demo credentials:

```text
admin@pulsedesk.dev / Password123
agent@pulsedesk.dev / Password123
customer@pulsedesk.dev / Password123
```

### Run Locally

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Health check: `http://localhost:5000/health`

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users` staff only

### Tickets

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id` staff only
- `PATCH /api/tickets/:id/assign` staff only
- `POST /api/tickets/:ticketId/messages`
- `GET /api/tickets/analytics` staff only

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## Real-Time Events

Client emits:

- `ticket:join`
- `typing`
- `message:send`

Server emits:

- `ticket:created`
- `ticket:updated`
- `message:created`
- `typing`

## Deployment

### Frontend on Vercel

1. Set project root to `client`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Add `VITE_API_URL=https://your-render-api.onrender.com/api`.
5. Add `VITE_SOCKET_URL=https://your-render-api.onrender.com`.

### Backend on Render

1. Use `server/render.yaml` or create a Web Service.
2. Root directory: `server`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add MongoDB Atlas, JWT, Cloudinary, SMTP, OpenAI, and `CLIENT_URL` env values.

### MongoDB Atlas

1. Create an Atlas cluster.
2. Add your Render outbound IP or allow access as appropriate for your environment.
3. Create a database user.
4. Set `MONGO_URI` in Render.

## Git Workflow

Suggested incremental history:

```bash
git init
git add package.json .gitignore README.md
git commit -m "chore: initialize PulseDesk monorepo"
git add server
git commit -m "feat: add Express API with tickets auth AI and sockets"
git add client
git commit -m "feat: add React support dashboard and chat UI"
git remote add origin https://github.com/<user>/pulsedesk.git
git push -u origin main
```

## Notes

- The AI service uses OpenAI when `OPENAI_API_KEY` is present and deterministic local rules otherwise.
- The upload service uses Cloudinary when credentials are present and local placeholder URLs otherwise.
- Email notifications log in development when SMTP credentials are missing.
