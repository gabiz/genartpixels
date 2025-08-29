---
inclusion: always
---

# Gen Art Pixels Project Context

## Project Overview

Gen Art Pixels is a collaborative digital canvas platform where users create, share, and evolve pixel-based artworks called "frames." The platform emphasizes community collaboration, real-time interaction, and meaningful artistic expression.

## Core Concepts

### Frames
- **Definition**: Collaborative pixel art canvases that evolve over time
- **Purpose**: Express ideas, support causes, tell stories
- **Ownership**: Created by users but grown by community contributors
- **Access**: Public URLs in format `/userHandle/frameHandle` (GitHub-style)

### Users & Handles
- **Authentication**: SSO only (Google, GitHub, Facebook via Supabase Auth)
- **Handles**: Unique identifiers (5-20 characters, underscore/dash allowed)
- **Roles**: Viewers (no account), Registered Users, Frame Owners

### Collaboration Model
- **Quota System**: 100 pixels/hour to encourage steady participation
- **Permissions**: Open, approval-required, or owner-only frames
- **Real-time**: Live pixel updates across all viewers
- **Attribution**: Click any pixel to see contributor

## Technical Architecture

### Technology Stack
- **Frontend/Backend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend-as-a-service**: Supabase (Auth, Database, Realtime, Storage)
- **Database**: PostgreSQL with optimized schema and triggers
- **Deployment**: Vercel + Supabase Cloud

### Key Technical Decisions
- **Color Storage**: ARGB integers (not hex strings) for performance
- **Frame Loading**: Snapshot system + incremental updates (not individual pixel queries)
- **Real-time**: Frame-specific channels with comprehensive event types
- **Scalability**: Horizontal scaling with proper indexing and caching

### Performance Optimizations
- **Snapshots**: Compressed frame state (RLE + gzip) for efficient loading
- **Stats**: Incremental counters with triggers (not expensive COUNT queries)
- **Caching**: Multi-layer caching for metadata, pixels, and user quotas
- **Canvas**: Virtualization for large frames, smooth zoom/pan

## Development Guidelines

### Code Quality
- **Testing**: Test-driven development with unit, integration, and E2E tests
- **TypeScript**: Strict typing for all interfaces and data models
- **Validation**: Client and server-side validation for all inputs
- **Error Handling**: Comprehensive error boundaries and user feedback

### User Experience
- **Responsive**: Mobile-first design with touch-optimized controls
- **Accessibility**: Keyboard navigation, proper contrast, screen reader support
- **Performance**: Smooth interactions, minimal loading states
- **Feedback**: Clear visual feedback for all user actions

### Database Design
- **Migrations**: Use Supabase CLI for all schema changes
- **Indexing**: Proper indexes for performance at scale
- **Constraints**: Database-level validation and referential integrity
- **Triggers**: Automatic stats updates and data consistency

## Color Palette

32-color palette optimized for pixel art creativity:
- Transparent + 31 colors organized by families
- ARGB format for efficient storage and comparison
- UI layout: 4×8 or 8×4 grid for easy selection

## Frame Sizes

Predefined sizes for different use cases:
- **Quick Landscape**: 128×72 (16:9) - Banners, memes
- **Quick Portrait**: 72×128 (9:16) - Mobile stories, campaigns  
- **Core Frame**: 128×128 (1:1) - Default, profile images, badges
- **Epic Frame**: 512×288 (16:9) - Community showcases, viral content

## Security & Privacy

- **Authentication**: SSO-only, no password management
- **Permissions**: Frame-level access control with blocking capabilities
- **Validation**: All inputs validated on client and server
- **Rate Limiting**: Quota system prevents abuse
- **Moderation**: Reporting system for offensive content

## Deployment Strategy

- **Development**: Local Supabase with CLI for migrations
- **Testing**: Comprehensive test suite with CI/CD pipeline
- **Production**: Vercel deployment with Supabase Cloud
- **Monitoring**: Error tracking, performance monitoring, analytics

This context should guide all development decisions and ensure consistency with the project vision and technical architecture.