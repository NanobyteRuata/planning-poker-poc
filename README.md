# Planning Poker

A collaborative planning poker application for agile teams with **Jira integration**. Estimate story points together in real-time and automatically sync results to Jira.

## Features

- **Real-time Collaboration** - Multiple participants can vote simultaneously
- **Atlassian OAuth** - Sign in with your Atlassian account
- **Jira Integration** - Link Jira tickets and auto-sync story points
- **Story Workflow** - Overview → Voting → Reveal → Complete
- **Firebase Backend** - Real-time updates with Firestore
- **Modern UI** - Built with Next.js 16, React 19, and TailwindCSS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your credentials (see [Jira Setup Guide](./JIRA_SETUP.md) for detailed instructions):

- Firebase configuration
- Firebase Admin credentials
- NextAuth secret
- Atlassian OAuth credentials

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using the app.

## Jira Integration Setup

For detailed instructions on setting up Atlassian OAuth and Jira integration, see [JIRA_SETUP.md](./JIRA_SETUP.md).

**Quick overview:**
1. Create an OAuth app in [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Configure required scopes: `read:jira-work`, `write:jira-work`, `read:jira-user`, `offline_access`
3. Add callback URL: `http://localhost:3000/api/auth/callback/atlassian`
4. Copy Client ID and Secret to `.env.local`

## How to Use

### Creating a Room

1. Sign in with your Atlassian account
2. Click "Create Room" on the homepage
3. Share the room link with your team

### Adding Stories

1. In a room, click "Add Story"
2. Click "Link Jira Ticket" to search and link a Jira issue
3. Fill in story details
4. Add the story to the session

### Running a Session

1. Click "Start Session" to begin voting
2. Participants select their story point estimates
3. Host clicks "Reveal Cards" to show all votes
4. Enter final story points and complete
5. Story points automatically sync to Jira (if linked)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS, shadcn/ui
- **Authentication**: NextAuth.js with Atlassian OAuth
- **Database**: Firebase Firestore
- **API Integration**: Jira Cloud REST API v3

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth routes
│   │   └── jira/          # Jira API routes
│   ├── auth/              # Authentication pages
│   └── room/              # Room pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── JiraTicketSelector.tsx
│   ├── StoryWorkflowControl.tsx
│   └── UserMenu.tsx
├── lib/
│   ├── jiraClient.ts     # Jira API client
│   └── userUtils.ts      # User utilities
├── types/                # TypeScript types
└── auth.ts               # NextAuth configuration
```

## API Routes

- `GET /api/jira/resources` - Get accessible Jira sites
- `GET /api/jira/search` - Search Jira issues
- `GET /api/jira/issue/[issueKey]` - Get issue details
- `POST /api/jira/update-story-points` - Update story points

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

See [JIRA_SETUP.md](./JIRA_SETUP.md) for production deployment instructions.

**Important**: Update the Atlassian OAuth callback URL to your production domain before deploying.

## License

MIT
