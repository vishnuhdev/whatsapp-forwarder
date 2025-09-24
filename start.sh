#!/bin/bash

# Start virtual display
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# Wait a moment for X server to start
sleep 2

# Start the application
exec npm start