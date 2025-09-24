# GenArtPixels

GenArtPixels is a collaborative digital canvas where users create, share, and evolve pixel-based artworks called *frames*. Think GitHub for Pixel Art. Each frame serves a purpose — to express ideas, support causes, or tell stories — while growing as multiple contributors add pixels over time. Users can explore frames in real time, zoom in to see individual contributions, and interact through likes and contributor stats. Frames are easily shareable via unique URLs, and a simple pixel quota system encourages steady participation while highlighting creativity, community, and meaningful expression. All frames are publicly viewable, but collaboration can be moderated by requiring approval for editing. Once a frame is complete, it can be frozen to prevent further changes.

---

## Demo

https://genartpixels.vercel.app/

## Features

- **Collaborative Pixel Art:** Multiple users can contribute to a single frame in real time.
- **Real-Time Updates:** See contributions as they happen.
- **Zoom & Explore:** Zoom into frames to see individual contributions.
- **Social Interaction:** Like frames, view contributor stats, and share frames via unique URLs.
- **Quota System:** Encourages steady, meaningful participation.
- **Moderation Options:** Public viewing is open to all, but editing can require approval. Frames can be frozen once complete.
- **Future-Ready:** Plans to integrate generative AI for remixing frames and gamified community features.

---

## Tech Stack

- **Frontend:** Next.js
- **Backend & Realtime:** Supabase (database, authentication, real-time updates)
- **Task Management & Automation:** Kiro (Specs & Vibe credits)
- **Caching (planned):** Redis

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Supabase account

### Installation

```bash
git clone https://github.com/yourusername/GenArtPixels.git
cd GenArtPixels
npm install
```

### Environment Variables

Create a .env.local file with the following:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
### Running Locally

```bash
npm run dev
```

The app will be available at http://localhost:3000.

### License

This project is licensed under the MIT License. See the LICENSE.md file for details.

### Attributions

<a href="https://www.flaticon.com/free-icons/artwork" title="artwork icons">Artwork icons created by Freepik - Flaticon</a>