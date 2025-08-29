$sourcePath = "c:\Users\kf\OneDrive\Documents\MyPorsnal-Projects\video-spliter\desktop\main.js"
$destPath = "c:\Users\kf\OneDrive\Documents\MyPorsnal-Projects\video-spliter\desktop\dist\Video Splitter-win32-x64\resources\app\main.js"

Write-Host "Updating main.js in the built EXE..."
Copy-Item $sourcePath $destPath -Force
Write-Host "main.js updated successfully!"

# Also update the win-unpacked version
$destPath2 = "c:\Users\kf\OneDrive\Documents\MyPorsnal-Projects\video-spliter\desktop\dist\win-unpacked\resources\app\main.js"
if (Test-Path $destPath2) {
    Copy-Item $sourcePath $destPath2 -Force
    Write-Host "win-unpacked version also updated!"
}

# Update the Desktop copy too
$desktopPath = "C:\Users\kf\Desktop\Video Splitter App\resources\app\main.js"
if (Test-Path $desktopPath) {
    Copy-Item $sourcePath $desktopPath -Force
    Write-Host "Desktop version also updated!"
}

Write-Host "All versions updated with download fix!"
