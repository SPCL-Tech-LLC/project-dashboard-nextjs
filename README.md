# SPCL Project Dashboard

**Live URL:** https://project-dashboard-nextjs.vercel.app

A Next.js dashboard for tracking active work sessions, managing projects, and monitoring team activity across the SPCL Tech organization.

## Features

- 🎯 **Active Work Tracking** - Start/stop work sessions, track time spent on projects
- 📊 **Projects View** - Browse all projects with GitHub, Supabase, and Vercel links
- 🔄 **GitHub Integration** - View all SPCL-Tech-LLC organization repositories
- 📈 **Activity Feed** - Monitor team activity and work history
- 🎨 **SPCL Branding** - Custom fonts (Plus Jakarta Sans, Fraunces), Material icons, cyan color scheme

## For AI Agents

### Starting a Work Session

When an agent begins work on a project, it should call:

```bash
curl -X POST https://project-dashboard-nextjs.vercel.app/api/active-work/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "agent-user-id",
    "user_name": "Agent Name",
    "user_type": "agent",
    "project_name": "project-name"
  }'
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 123,
    "project_name": "project-name",
    "started_at": "2026-03-12T15:30:00Z"
  }
}
```

### Stopping a Work Session

When work is complete:

```bash
curl -X POST https://project-dashboard-nextjs.vercel.app/api/active-work/stop/123 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 123,
    "ended_at": "2026-03-12T16:45:00Z",
    "duration_minutes": 75
  }
}
```

### Pinging Active Session

Keep session alive with periodic pings:

```bash
curl -X POST https://project-dashboard-nextjs.vercel.app/api/active-work/ping/123
```

### Viewing Work History

Check recent work across the team:

```bash
curl https://project-dashboard-nextjs.vercel.app/api/active-work/history?days=7
```

### Example: Agent Workflow

```bash
#!/bin/bash
# Agent work session wrapper

PROJECT_NAME="my-project"
AGENT_NAME="codex"
AGENT_ID="agent-001"

# Start work session
SESSION=$(curl -s -X POST https://project-dashboard-nextjs.vercel.app/api/active-work/start \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$AGENT_ID\",
    \"user_name\": \"$AGENT_NAME\",
    \"user_type\": \"agent\",
    \"project_name\": \"$PROJECT_NAME\"
  }")

SESSION_ID=$(echo $SESSION | jq -r '.session.id')
echo "Started work session: $SESSION_ID"

# Do actual work
codex exec "Your task here"

# End work session
curl -s -X POST https://project-dashboard-nextjs.vercel.app/api/active-work/stop/$SESSION_ID
echo "Work session completed"
```

## API Reference

### Work Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/active-work/start` | POST | Start new work session |
| `/api/active-work/stop/[id]` | POST | End work session |
| `/api/active-work/ping/[id]` | POST | Keep session alive |
| `/api/active-work/active` | GET | List active sessions |
| `/api/active-work/history` | GET | Work history (query: `days`, `user_id`, `project`) |
| `/api/active-work/user-summary` | GET | Team activity grouped by user |
| `/api/active-work/project-summary` | GET | Activity grouped by project |

### Projects & Repos

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects with metadata |
| `/api/repos` | GET | GitHub repos from SPCL-Tech-LLC org |
| `/api/work` | GET/POST/PATCH | Legacy work tracking endpoint |

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health status |

## Authentication

### For Web Users

1. Navigate to https://project-dashboard-nextjs.vercel.app/login
2. Sign in with Supabase credentials:
   - `colton@spcl.tech`
   - `tom@spcl.tech`

### For Agents (API Access)

Currently, API endpoints are **unauthenticated** for agent access. For production, you may want to:

1. Add API key authentication
2. Use Supabase service role for backend operations
3. Implement rate limiting

**Example with authentication (future):**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://project-dashboard-nextjs.vercel.app/api/active-work/start
```

## Database Schema

### `dashboard_active_work`

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `user_id` | text | User/agent identifier |
| `user_name` | text | Display name |
| `user_type` | text | "human" or "agent" |
| `project_name` | text | Project being worked on |
| `task_description` | text | Optional task details |
| `started_at` | timestamp | Session start time |
| `last_ping_at` | timestamp | Last activity ping |
| `ended_at` | timestamp | Session end time (null if active) |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Last update time |

### `dashboard_project_metadata`

| Column | Type | Description |
|--------|------|-------------|
| `project_name` | text | Primary key, project identifier |
| `github_url` | text | GitHub repository URL |
| `supabase_project_url` | text | Supabase project dashboard |
| `supabase_project_id` | text | Supabase project ID |
| `vercel_project_url` | text | Vercel project dashboard |
| `vercel_deployment_url` | text | Live deployment URL |
| `custom_metadata` | jsonb | Additional project data |
| `created_at` | timestamp | Record creation time |
| `updated_at` | timestamp | Last update time |

## Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/SPCL-Tech-LLC/project-dashboard-nextjs.git
cd project-dashboard-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=your-github-token
```

### Building for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
# Link to Vercel project (first time only)
vercel link

# Deploy to production
vercel --prod
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel
- **Icons:** Material Symbols
- **Fonts:** Plus Jakarta Sans, Fraunces

## Contributing

This dashboard is part of the SPCL Tech internal tooling. For changes:

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Build with `npm run build`
5. Push and create PR
6. Vercel will auto-deploy preview

## License

Internal SPCL Tech project - not for public distribution.

## Support

For issues or questions:
- GitHub Issues: https://github.com/SPCL-Tech-LLC/project-dashboard-nextjs/issues
- Internal: Contact Colton or team leads
