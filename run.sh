#!/bin/bash
echo "🚀 Starting Anti-Copilot..."

# Cleanup previous instances
pkill -f "uvicorn main:app"
pkill -f "vite"

# Start Backend
echo "🐍 Starting Backend on port 8000..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Creating venv..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

uvicorn main:app --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "⚛️  Starting Frontend on port 5173..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "✅ Anti-Copilot is running!"
echo "👉 Frontend: http://localhost:5173"
echo "👉 Backend: http://localhost:8000/docs"
echo "📝 Logs are in backend.log and frontend.log"
echo "🛑 Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
