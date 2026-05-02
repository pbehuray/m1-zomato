# Next.js Frontend for Restaurant Recommendations

Phase 7 implementation using Next.js 14 with TypeScript and Tailwind CSS.

## Features

- **Modern React 18** with Next.js 14 App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **API Integration** with FastAPI backend
- **Responsive Design** for all screen sizes
- **Loading States** and error handling
- **Real-time Recommendations** with AI explanations

## Prerequisites

- Node.js 18+ 
- npm or yarn
- FastAPI backend running on port 8000

## Installation

```bash
cd frontend-nextjs
npm install
```

## Configuration

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend-nextjs/
├── app/
│   ├── components/
│   │   ├── RecommendationForm.tsx    # Preference input form
│   │   └── RecommendationResults.tsx  # Results display
│   ├── globals.css                    # Global styles
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Main page
├── lib/
│   └── api.ts                         # API service
├── public/                           # Static assets
└── package.json                      # Dependencies
```

## API Integration

The frontend communicates with the FastAPI backend:

- `GET /health` - Check API status
- `GET /api/v1/meta` - Get form metadata
- `POST /api/v1/recommendations` - Generate recommendations

## Components

### RecommendationForm
- Location selection
- Budget range selection
- Cuisine multi-select with autocomplete
- Rating slider
- Additional preferences textarea
- Form validation

### RecommendationResults
- Loading state with spinner
- Error state with helpful messages
- Empty state guidance
- Success state with restaurant cards
- Technical details display

## Styling

Uses Tailwind CSS with custom orange color scheme for the restaurant theme.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) with ES6+ support.
