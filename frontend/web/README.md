# Pixl Web Application

This is the NUXT.js web application for Pixl - a modern social media platform.

## Features

- **Authentication**: User login/signup with JWT
- **Posts**: Create, view, like, and comment on posts
- **Stories**: Create and view stories with expiration
- **Live Streaming**: Start and join live streams with real-time chat
- **User Profiles**: View and manage user profiles
- **Messaging**: Direct messaging with real-time updates
- **Search & Explore**: Discover users and content

## Project Structure

```
app/
├── components/shared/      # Reusable UI components
├── composables/             # Composition API utilities
├── layouts/                 # NUXT layouts
├── middleware/              # Route middlewares
├── pages/                   # Application pages
├── plugins/                 # NUXT plugins
├── stores/                  # Pinia state management
├── types/                   # TypeScript definitions
└── utils/                   # Utility functions
```

## Installation

### Prerequisites
- Node.js 18+ 
- Backend REST API running on http://localhost:3000

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create .env.local:
```bash
cp .env.example .env.local
```

3. Configure environment variables

## Development

```bash
npm run dev
```

Visit http://localhost:3000

## Build

```bash
npm run build
npm run preview
```

## State Management

Pinia stores:
- **useAuthStore** - Authentication and user profile
- **usePostsStore** - Posts operations
- **useStoriesStore** - Stories management
- **useUsersStore** - User search and follow/unfollow
- **useLiveStore** - Live streaming
- **useNotificationStore** - Notifications

## Styling

- Tailwind CSS
- DaisyUI components
- Custom theme colors

## Components

Reusable components in `components/shared/`:
- **Modal.vue** - Dialog modals
- **LoadingSpinner.vue** - Loading indicator
- **Toast.vue** - Notifications
- **PostCard.vue** - Post display

## API Integration

All API calls go through the axios-based client in `utils/api.ts`

Backend endpoints:
- `/auth/*` - Authentication
- `/posts/*` - Post operations
- `/stories/*` - Story operations
- `/users/*` - User operations
- `/live/*` - Live streaming
- `/notifications/*` - Notifications
