# Warranty Tracker Frontend

A production-oriented React application built with Vite and Tailwind CSS for tracking product warranties.

## Features

- Dark glassmorphism UI with a centralized theme config in `src/config/theme.js`
- Login and signup flows with JWT session persistence
- Protected routes using React Router
- Dashboard with warranty cards, loading skeletons, and empty state handling
- Add warranty form with validation and optional file upload
- Axios service layer with API mode and local demo fallback when `VITE_API_URL` is not set
- Toast notifications and responsive reusable components

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set your backend API URL if available:

```bash
VITE_API_URL=http://localhost:5000/api
```

3. Run the development server:

```bash
npm run dev
```

4. Create a production build:

```bash
npm run build
```
