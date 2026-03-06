# รันใน ums-backend folder
# แก้ server.js - เพิ่ม explicit OPTIONS handler

$serverFile = "src/server.js"
$content = Get-Content $serverFile -Raw

# เพิ่ม OPTIONS preflight handler หลัง cors middleware
$corsBlock = "app.use(express.json({ limit: '10mb' }));"
$optionsHandler = @"
// ─── Explicit OPTIONS preflight ─────────────────────────────
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
"@

$content = $content -replace [regex]::Escape($corsBlock), $optionsHandler
Set-Content $serverFile $content

Write-Host "server.js updated with OPTIONS handler" -ForegroundColor Green
Write-Host "Now run: vercel --prod" -ForegroundColor Yellow
