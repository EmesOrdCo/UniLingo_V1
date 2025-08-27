@echo off
echo Setting up UniLingo Backend...
echo.

echo Installing dependencies...
npm install

echo.
echo Creating uploads directory...
if not exist "uploads" mkdir uploads

echo.
echo Backend setup complete!
echo.
echo To start the server:
echo   npm start
echo.
echo To start in development mode:
echo   npm run dev
echo.
pause
