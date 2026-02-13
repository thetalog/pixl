# Quick Reference - Pixl Web App

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and Firebase config

# Run development server
npm run dev

# Visit http://localhost:3000
```

## 📁 Project Layout

```
app/
├── components/shared/        # UI Components (Modal, Toast, etc)
├── layouts/AppLayout.vue     # Main app layout with navbar
├── pages/                    # Auto-routed pages
│   ├── index.vue            # Home redirect
│   ├── home.vue             # Feed page
│   ├── explore.vue          # Search & discover
│   ├── profile.vue          # Current user
│   ├── live.vue             # Live streams
│   ├── messages.vue         # Messaging
│   ├── create-post.vue      # Post creation
│   ├── auth/               # Auth pages
│   ├── posts/[id].vue      # Post detail
│   ├── live/[id].vue       # Stream detail
│   └── profile/[id].vue    # User profile
├── stores/                  # Pinia state management
├── middleware/auth.ts       # Route protection
└── utils/api.ts            # API client
```

## 🔐 Authentication

```typescript
// Login
const authStore = useAuthStore()
await authStore.login({ 
  email: 'user@example.com', 
  password: 'password' 
})

// Check if authenticated
if (authStore.isAuthenticated) {
  // User is logged in
}

// Logout
authStore.logout()
```

## 📦 State Management (Pinia)

```typescript
// Posts
const postsStore = usePostsStore()
await postsStore.getPosts()
await postsStore.likePost(postId)

// Users
const usersStore = useUsersStore()
await usersStore.searchUsers(query)
await usersStore.followUser(userId)

// Stories
const storiesStore = useStoriesStore()
await storiesStore.getStories()

// Live
const liveStore = useLiveStore()
await liveStore.getLiveStreams()

// Notifications
const notificationStore = useNotificationStore()
await notificationStore.getNotifications()

// Auth
const authStore = useAuthStore()
authStore.isAuthenticated
authStore.user
```

## 🎨 UI Components

```vue
<!-- Modal -->
<Modal
  title="Title"
  confirm-text="OK"
  @confirm="handleConfirm"
  @cancel="handleCancel"
>
  Content here
</Modal>

<!-- Loading -->
<LoadingSpinner visible message="Loading..." />

<!-- Toast -->
<Toast
  title="Success"
  message="Done!"
  type="success"
/>

<!-- Post Card -->
<PostCard
  :post="post"
  :user="user"
  @like="handleLike"
  @comment="handleComment"
/>
```

## 🎯 Pages Overview

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/auth/login` | User authentication |
| Signup | `/auth/signup` | Register new account |
| Home | `/home` | Feed with followed posts |
| Explore | `/explore` | Search users & posts |
| Profile | `/profile` | Current user profile |
| Other Profile | `/profile/[id]` | View other users |
| Post Detail | `/posts/[id]` | View & comment on post |
| Live | `/live` | List live streams |
| Stream | `/live/[id]` | Watch stream & chat |
| Messages | `/messages` | Direct messaging |
| Create Post | `/create-post` | New post with media |

## 🔌 API Integration

```typescript
// Using the API client
const api = useApi()

// GET
const response = await api.get('/posts')

// POST
await api.post('/posts', { content: '...' })

// PUT
await api.put(`/posts/${id}`, data)

// PATCH
await api.patch(`/posts/${id}`, data)

// DELETE
await api.delete(`/posts/${id}`)
```

## 🎨 Styling

```vue
<!-- Tailwind classes -->
<div class="bg-primary text-white rounded-lg p-4">
  <button class="btn-primary">Click me</button>
  <input class="input-base" />
</div>
```

Colors:
- `primary: #0D1B2A` (dark blue)
- `secondary: #1B3A52` (medium blue)
- `accent: #FF6B6B` (red)

## 📝 TypeScript Types

```typescript
import { User, Post, Story, LiveStream, Comment } from '~/types'

// All types available in app/types/index.ts
```

## 🔄 Protected Routes

Authentication is handled automatically via middleware:
- Unauthenticated users are redirected to `/auth/login`
- Public pages: `/auth/login`, `/auth/signup`
- All other pages require authentication

## 📊 Real-time Features

WebSocket integration ready for:
- Live comments
- Direct messages
- Live stream chat
- Notifications

## 🔧 Environment Variables

```
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
NUXT_PUBLIC_WS_BASE=ws://localhost:3000
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
```

## 🚨 Error Handling

```typescript
// API errors automatically caught
const result = await postsStore.createPost(data)
if (!result.success) {
  console.error(result.error)
}

// Toast notifications
const { showToast } = useToast()
showToast('Error', 'Something went wrong', 'error')
```

## 📱 Responsive Design

Uses Tailwind CSS responsive prefixes:
- `md:` - Medium screens and up (768px+)
- `lg:` - Large screens and up (1024px+)

## 🎬 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview

# Generate static
npm run generate
```

## 📚 Useful Links

- [NUXT Docs](https://nuxt.com)
- [Vue 3 Docs](https://vuejs.org)
- [Tailwind Docs](https://tailwindcss.com)
- [Pinia Docs](https://pinia.vuejs.org)
- [TypeScript Docs](https://www.typescriptlang.org)

## 🆘 Common Issues

### API Connection Failed
- Check backend is running at `http://localhost:3000`
- Verify `NUXT_PUBLIC_API_BASE` env variable
- Check CORS configuration

### Auth Token Expired
- Clear localStorage
- Login again
- Check token in browser DevTools

### Build Errors
```bash
# Clean install
rm -rf .nuxt node_modules
npm install
npm run dev
```

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify backend is running
3. Review environment configuration
4. Check network requests in DevTools

---

**Last Updated:** February 13, 2025  
**Status:** ✅ Complete NUXT.js Web App Created
