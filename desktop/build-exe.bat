@echo off
cd /d "c:\Users\kf\OneDrive\Documents\MyPorsnal-Projects\video-spliter\desktop"
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul
echo Building Video Splitter EXE...
npm run build-win
echo Build complete!
pause
