# Shift Scheduler

A modern web application for managing and scheduling shifts. Built with React, TypeScript, and Material-UI.

## Features

- Create, edit, and delete shifts
- Drag and drop interface for easy rescheduling
- Real-time shift status updates
- Persistent storage using IndexedDB
- Beautiful Material-UI interface
- Responsive design

## Technologies Used

- React
- TypeScript
- Material-UI
- Vite
- IndexedDB (via idb)
- date-fns
- @dnd-kit (for drag and drop)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shift-scheduler.git
cd shift-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

- Click "Add Shift" to create a new shift
- Drag and drop shifts to reschedule them
- Use the menu on each shift to:
  - Edit shift details
  - Activate/Deactivate shifts
  - Put shifts on hold
  - Terminate shifts
  - Delete shifts

## License

This project is licensed under the MIT License - see the LICENSE file for details. 