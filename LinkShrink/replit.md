# LinkSnip - URL Shortening Service

## Overview

LinkSnip is a fast and simple URL shortening service built with a modern tech stack. The application allows users to shorten long URLs, track click statistics, and manage their shortened links through a clean, productivity-focused interface. The service is designed with efficiency and clarity in mind, following design principles inspired by modern productivity tools like Linear and Notion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

**UI Component System**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Theme System**: Light/dark mode support with a custom theme provider
- **Design Philosophy**: Clean, function-first interface prioritizing minimal friction and instant feedback
- **Typography**: System font stack (Inter) with monospace fonts for URLs and code

**Key Design Decisions**:
- Component-based architecture using Radix UI primitives for accessibility
- Utility-first CSS with Tailwind for rapid development and consistency
- Custom color system using HSL values with CSS variables for theme flexibility
- No background images or excessive visual flair - focus on clarity and efficiency

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Server**: HTTP server with Express middleware
- **Build Process**: esbuild for fast server bundling with selective dependency bundling

**API Design**:
- RESTful API endpoints following standard HTTP conventions
- JSON request/response format
- Centralized error handling
- Request logging with timestamp and duration tracking

**Key Routes**:
- `POST /api/urls` - Create shortened URL
- `GET /api/urls` - List all URLs
- `GET /api/urls/:id` - Get specific URL details
- `DELETE /api/urls/:id` - Delete URL by ID
- `GET /api/stats` - Get statistics (total URLs, total clicks, top performer)
- `GET /:shortCode` - Redirect to original URL (uses regex pattern `[A-Za-z0-9]{6}` for exact 6-character alphanumeric codes)

**Architecture Decisions**:
- Stateless API design for scalability
- Input validation using Zod schemas shared between frontend and backend
- Separation of concerns: routes, storage layer, and database access
- Error responses return structured JSON with appropriate HTTP status codes

### Data Storage

**Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM for type-safe database queries
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon serverless with WebSocket support for edge deployment

**Database Schema**:

1. **urls table**:
   - `id` (UUID primary key)
   - `shortCode` (unique varchar, 10 chars max)
   - `originalUrl` (text)
   - `clicks` (integer, default 0)
   - `createdAt` (timestamp)

2. **users table** (authentication ready):
   - `id` (UUID primary key)
   - `username` (unique text)
   - `password` (text)

**Short Code Generation**:
- Cryptographically random 6-character codes using Node.js crypto module
- Character set: alphanumeric (A-Z, a-z, 0-9) for URL-safe codes
- Collision handling through database unique constraints

**Storage Layer Pattern**:
- Interface-based storage abstraction (`IStorage`) for testability
- `DatabaseStorage` implementation with Drizzle ORM
- Separation of business logic from data access

### External Dependencies

**Database Service**:
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Via `@neondatabase/serverless` package with WebSocket support
- **Configuration**: Connection string via `DATABASE_URL` environment variable

**UI Component Libraries**:
- **Radix UI**: Accessible, unstyled component primitives for dialogs, dropdowns, tooltips, etc.
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date formatting and manipulation

**Development Tools**:
- **TypeScript**: Type safety across entire stack
- **Shadcn/ui**: Component library built on Radix UI with Tailwind styling
- **Google Fonts**: Inter font family for typography

**Build and Development**:
- **Vite**: Frontend build tool with HMR and optimized production builds
- **esbuild**: Backend bundling for reduced cold start times
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing

**Validation and Schema**:
- **Zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation
- Shared validation schemas between client and server for consistency

**Deployment Considerations**:
- Environment variable configuration for database URL
- Static file serving for production builds
- Client-side routing fallback to index.html for SPA behavior
- Selective server dependency bundling to optimize cold start performance