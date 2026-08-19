# Traffic Forecasting React Frontend

This is a React application for traffic forecasting in Indore, converted from the original HTML/JavaScript implementation.

## Features

- **Login System**: Email/password authentication with Google sign-in option
- **Location Selection**: Dropdown with all major Indore locations
- **Transport Modes**: Bike, Car, and Walk options
- **Interactive Map**: Leaflet map with route visualization
- **Traffic Prediction**: Color-coded routes (Red/Yellow/Green) based on congestion levels
- **Location Markers**: Red location emoji markers for source and destination
- **Responsive Design**: Works on both desktop and mobile devices

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Backend server running on port 8000

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open in your browser at `http://localhost:3000`.

## Backend Integration

The React app is configured to proxy API requests to `http://localhost:8000` (your Django backend). Make sure your backend server is running before testing the route prediction functionality.

## Login Credentials

- **Email**: Any valid email format
- **Password**: `khushi`

## API Endpoints

The app makes POST requests to `/api/routes/` with the following payload:
```json
{
  "source": "latitude,longitude",
  "destination": "latitude,longitude", 
  "date_time": "2025-06-30T17:00:00",
  "travel_mode": "bike|car|walk"
}
```

## Map Features

- **Route Visualization**: Color-coded polylines showing traffic conditions
- **Source/Destination Markers**: Red location emoji markers
- **User Location**: Blue marker showing current location (if permission granted)
- **Interactive Zoom**: Map automatically fits to show the entire route

## File Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── google.jpg
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── LoginScreen.js
│   │   ├── MainContent.js
│   │   ├── TrafficMap.js
│   │   └── PermissionDialog.js
│   ├── utils/
│   │   └── locations.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Troubleshooting

1. **Map not loading**: Ensure you have an internet connection for OpenStreetMap tiles
2. **API errors**: Check that your backend server is running on port 8000
3. **Location permission**: Allow location access in your browser for full functionality
4. **CORS issues**: The proxy configuration should handle this automatically

## Build for Production

To create a production build:

```bash
npm run build
```

This will create an optimized build in the `build` folder that you can deploy to any static hosting service. 