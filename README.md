# Pixl - Social Media Platform Backend

A production-ready Instagram-like social media platform backend built with Node.js, Express.js, and Prisma ORM. This comprehensive backend provides all core social media functionality with a clean, scalable architecture.

## 📋 Project Overview

Pixl is a full-featured social media platform backend designed with modern development practices. The system provides robust functionality for user interactions, content sharing, messaging, and real-time features with a focus on scalability and maintainability.

### Core Features
- User authentication and authorization (JWT)
- Post and reel creation with rich media support
- Direct and group messaging systems
- Follow/unfollow functionality with privacy controls
- Stories with reactions and views
- Real-time live streaming capabilities
- Advanced content discovery and categorization
- Push notifications via Firebase Cloud Messaging

## 🏗️ Architecture Overview

The backend follows a clean, modular architecture with clear separation of concerns:

```
backend/
├── rest_server/
│   ├── controller/     # Business logic layer
│   ├── database/       # Data access layer
│   ├── routes/         # API routing definitions
│   ├── middlewares/    # Authentication and validation
│   ├── storage/        # File upload and storage
│   └── utils/          # Helper functions
```

### Tech Stack
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **ORM**: Prisma with MongoDB
- **Authentication**: JWT with email verification
- **File Storage**: AWS S3 for object storage
- **Real-time**: Socket.IO for live features
- **Notifications**: Firebase Cloud Messaging
- **Validation**: JOI for request validation

## 📁 Folder Structure Example

```
backend/rest_server/
├── controller/
│   ├── auth/           # Authentication controllers
│   ├── post/           # Post management
│   ├── message/        # Direct and group messaging
│   ├── follow/         # Follow/unfollow logic
│   └── live/           # Live streaming features
├── database/
│   ├── auth/           # User authentication queries
│   ├── post/           # Post-related database operations
│   ├── message/        # Messaging database logic
│   └── follow/         # Follow system queries
├── routes/             # API route definitions
├── middlewares/        # Authentication and validation
├── storage/            # File upload handlers
└── prisma/             # Database schema
```

## 🌐 API Feature Summary

### Authentication Routes
- `/api/auth/signup` - User registration with email verification
- `/api/auth/login` - Secure login with JWT token generation
- `/api/auth/otp` - OTP-based email verification
- `/api/auth/profile` - Profile management

### Content Management
- `/api/posts/` - Create, update, delete posts with media
- `/api/reels/` - Reel creation and management
- `/api/stories/` - Stories with 24-hour expiration
- `/api/media/upload` - Multi-file media upload with AWS S3

### Social Features
- `/api/follow/` - Follow/unfollow with privacy controls
- `/api/feed/` - Personalized feed of followed content
- `/api/comments/` - Post and reel commenting system
- `/api/likes/` - Like/unlike functionality

### Messaging System
- `/api/messages/direct/` - One-on-one messaging
- `/api/messages/group/` - Group chat functionality
- `/api/messages/reactions/` - Message reactions and reactions
- `/api/messages/seen/` - Message read receipts

### Live Features
- `/api/live/streams/` - Live video streaming
- `/api/live/comments/` - Real-time stream comments

## 🔐 Authentication Flow

The authentication system provides secure user verification:

1. **Registration**: User registers with email, username, and password
2. **Email Verification**: OTP sent via email for verification
3. **Login**: Verified users authenticate with credentials
4. **JWT Token**: Access tokens generated with configurable expiration
5. **Session Management**: Refresh token handling for persistent sessions
6. **Security**: Password hashing with bcrypt, rate limiting, and IP tracking

## 📺 Live Streaming Flow

Real-time streaming functionality with WebSocket integration:

1. **Stream Creation**: User creates live stream with title
2. **RTMP Connection**: Stream pushed to Kurento media server
3. **Viewer Joining**: Real-time viewer count updates
4. **Live Comments**: WebSocket-powered comment system
5. **Stream Termination**: Automatic cleanup on stream end

## 💬 Messaging System Overview

Comprehensive messaging infrastructure supporting both direct and group communications:

### Direct Messaging
- Real-time message delivery
- Media attachment support
- Message reactions and retraction
- Read receipts and typing indicators
- Conversation history management

### Group Messaging
- Group creation with custom avatars
- Member management and roles
- Group-specific features and permissions
- Bulk message operations

### Message Features
- Rich media support (images, videos, documents)
- Message reactions with custom emojis
- Message search and filtering
- Message archiving and deletion

## 🗄️ Database Design Philosophy

The database schema is designed for optimal performance and data integrity:

### Key Design Principles
- **Normalized Structure**: Efficient data relationships with proper indexing
- **Scalability**: Designed to handle millions of users and interactions
- **Flexibility**: Support for evolving feature requirements
- **Performance**: Optimized queries with proper indexing strategies

### Core Models
- **User**: Central user entity with privacy controls
- **Post/Reel**: Content entities with rich metadata
- **Media**: Media assets with metadata and thumbnails
- **Message**: Direct and group messaging infrastructure
- **Follow**: Relationship management with status tracking
- **Reaction**: Like and reaction system for content
- **Comment**: Hierarchical comment system with sub-comments

### Indexing Strategy
- Composite indexes for common query patterns
- Text indexes for search functionality
- Geospatial indexes for location-based features
- Time-based indexes for temporal queries

## 🚀 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- AWS S3 (for file storage)
- Firebase project for push notifications

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd pixl/backend/rest_server
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

4. **Configure Prisma**
```bash
npx prisma generate
npx prisma db push
```

5. **Start the server**
```bash
node index.js
```

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="mongodb+srv://..."

# JWT Configuration
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-south-1"
S3_BUCKET_POSTS="pixl-posts"
S3_BUCKET_DM="pixl-dm"
S3_BUCKET_GROUP_MSG="pixl-group-msg"
S3_BUCKET_GROUP_DP="pixl-group-dp"
S3_BUCKET_PROFILE="pixl-profile"

# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Live Streaming
KURENTO_WS_URI="ws://localhost:8888/kurento"

# Application
PORT=3001
NODE_ENV=production
```

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless authentication with JWT tokens
- Database sharding ready schema
- CDN integration for static assets
- Load balancer compatibility

### Performance Optimization
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data
- Asynchronous processing for heavy operations
- Connection pooling for database operations

### Monitoring & Observability
- Structured logging for debugging
- Performance metrics collection
- Error tracking and alerting
- Health check endpoints

## 🔄 Future Improvements

### Planned Enhancements
- **Advanced Analytics**: User engagement and content performance metrics
- **Content Moderation**: AI-powered content filtering and moderation
- **Search Enhancement**: Advanced search with filters and recommendations
- **Push Notification Customization**: User-configurable notification settings

### Long-term Roadmap
- **Microservices Architecture**: Service decomposition for better scalability
- **GraphQL API**: Alternative GraphQL endpoint for flexible queries
- **Real-time Analytics**: Live dashboard for platform metrics
- **AI Integration**: Content recommendation and personalization engine

## 🏛️ Architecture Decisions

### Why This Architecture Was Chosen
- **Modularity**: Clear separation between business logic and data access layers
- **Maintainability**: Organized code structure enabling easy feature additions
- **Testability**: Isolated components facilitate unit and integration testing
- **Performance**: Optimized for common social media usage patterns

### Separation of Concerns
- **Controllers**: Handle HTTP requests and responses
- **Database Layer**: Pure data access functions without business logic
- **Middlewares**: Cross-cutting concerns like authentication and validation
- **Routes**: API definition and middleware composition
- **Utils**: Shared helper functions and constants

### Controller/Database Layer Structure
- **Controllers** contain request validation, response formatting, and error handling
- **Database functions** are pure data operations with no HTTP concerns
- **Consistent naming** ensures predictability and maintainability
- **Error handling** is standardized across all layers

---

**Pixl Backend** - A production-ready foundation for modern social media platforms.