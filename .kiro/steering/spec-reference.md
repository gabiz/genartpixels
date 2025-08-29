---
inclusion: manual
---

# Gen Art Pixels Specification Reference

This steering file provides quick access to the complete specification documents for the Gen Art Pixels project. Use this when you need to reference the full requirements, design, or implementation plan.

## Specification Documents

### Requirements Document
#[[file:.kiro/specs/gen-art-pixels/requirements.md]]

### Design Document  
#[[file:.kiro/specs/gen-art-pixels/design.md]]

### Implementation Tasks
#[[file:.kiro/specs/gen-art-pixels/tasks.md]]

## Quick Reference

### Key Requirements Summary
- **Frame Viewing**: Public browsing, zoom/pan, real-time updates, contributor attribution
- **Authentication**: SSO-only (Google, GitHub, Facebook), unique handles (5-20 chars)
- **Frame Management**: Create with metadata, permissions (open/approval/owner-only), freeze/unfreeze
- **Pixel System**: 32-color palette, quota system (100/hour), real-time collaboration
- **Social Features**: Likes, reporting, statistics, search functionality
- **Scalability**: Horizontal scaling, performance optimization, responsive design

### Core Technical Decisions
- **Stack**: Next.js 15 + React 19 + Supabase + TypeScript + Tailwind
- **Database**: PostgreSQL with optimized schema, triggers, and indexing
- **Colors**: ARGB integers (not hex strings) for performance
- **Frame Loading**: Snapshot system with compression for efficiency
- **Real-time**: Frame-specific channels with comprehensive event types
- **Testing**: TDD approach with unit, integration, and E2E tests

### Frame Sizes
- **Quick Landscape**: 128×72 (16:9) - Banners, memes
- **Quick Portrait**: 72×128 (9:16) - Mobile stories, campaigns
- **Core Frame**: 128×128 (1:1) - Default, profile images, badges
- **Epic Frame**: 512×288 (16:9) - Community showcases, viral content

### Color Palette (32 colors)
ARGB format with transparent + 31 colors organized by families:
- Reds, oranges, yellows
- Greens, teals, blues
- Indigos, purples, pinks
- Browns, tans, grayscale

### URL Structure
- **Frame URLs**: `/userHandle/frameHandle` (GitHub-style)
- **API Routes**: `/api/frames`, `/api/pixels`, `/api/auth`
- **User Profiles**: `/users/[handle]`

### Database Schema Key Tables
- **users**: Handle, quota, auth info
- **frames**: Metadata, permissions, ownership
- **pixels**: Coordinates, color (ARGB), contributor
- **frame_permissions**: Access control
- **frame_stats**: Cached statistics with triggers
- **frame_snapshots**: Compressed frame state

### Performance Strategies
- **Snapshots**: RLE + gzip compression for frame state
- **Caching**: Multi-layer caching for metadata and pixels
- **Real-time**: Channel isolation per frame
- **Canvas**: Virtualization for large frames
- **Database**: Proper indexing and query optimization

This reference ensures all implementation work stays aligned with the approved specification and technical architecture.