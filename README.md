# The Git Roast Show

A complete roasting application with frontend and backend integrated for GitHub profile roasting.

## Project Structure

```
thegitroastshow/
├── frontend-vite/          # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── hooks/          # Custom React hooks
│   │   └── ...
│   ├── public/             # Static assets
│   └── package.json
├── backend/                # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static files
│   └── package.json
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your configuration:

   ```bash
   cp .env.example .env
   ```

4. Start the backend server:

   ```bash
   npm start
   ```

   The backend will run on `http://localhost:3001` (or the port specified in your `.env` file).

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend-vite
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the frontend development server:

   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173` (or another available port).

## Features

- 🎭 **GitHub Profile Roasting**: Enter a GitHub username to get a personalized roast
- 🔊 **Sound Effects**: Integrated sound effects for enhanced comedy experience
- 🎨 **Smooth Animations**: Typewriter text effects and smooth transitions
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **Real-time API**: Fetches actual GitHub data for personalized roasts

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/roast/:username` - Generate roast for a GitHub user
- `GET /api/roast/:username/quick` - Quick roast generation
- `GET /api/roast/demo/sample` - Sample roast for demo

## Development

### Running Both Services

To run both backend and frontend simultaneously, you'll need two terminal windows:

**Terminal 1 (Backend):**

```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**

```bash
cd frontend-vite
npm run dev
```

### Project Configuration

- Backend runs on port 3001 by default
- Frontend runs on port 5173 by default
- CORS is configured to allow frontend-backend communication
- API base URL can be configured via environment variables

## Contributing

1. Make sure both backend and frontend are running
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

**Backend Issues:**

- Check if `.env` file is properly configured
- Ensure all dependencies are installed with `npm install`
- Check console for error messages

**Frontend Issues:**

- Verify backend is running and accessible
- Check browser console for errors
- Ensure API endpoints are responding correctly

**Sound Issues:**

- Check if sound files are present in `public/media/sounds/`
- Verify browser allows autoplay (may require user interaction first)
- Check browser console for audio-related errors
