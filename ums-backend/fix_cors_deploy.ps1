# fix_cors_deploy.ps1 - Fix CORS and deploy backend

Set-Location "C:\Users\thair\Documents\FullStack\university\ums-backend"

# Step 1: Check server.js has OPTIONS handler
$content = Get-Content "src\server.js" -Raw
if ($content -notmatch "app\.options") {
    Write-Host "Adding OPTIONS handler..."
    $content = $content -replace "(app\.use\(express\.json)", "app.options('*', cors());`r`n`r`n`$1"
    Set-Content "src\server.js" $content -Encoding UTF8
    Write-Host "Done."
} else {
    Write-Host "OPTIONS handler already exists."
}

# Step 2: Unlink from GitHub to force local deploy
if (Test-Path ".vercel") {
    Write-Host "Removing .vercel link..."
    Remove-Item -Recurse -Force ".vercel"
}

# Step 3: Deploy from local files
Write-Host "Deploying..."
vercel --prod
