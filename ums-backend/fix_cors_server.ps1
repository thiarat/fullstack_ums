# รันใน C:\Users\thair\Documents\FullStack\university\ums-backend

$file = "src\server.js"
$content = Get-Content $file -Raw

# ตรวจว่า app.options มีแล้วหรือยัง
if ($content -match "app\.options") {
    Write-Host "app.options already exists" -ForegroundColor Yellow
} else {
    # เพิ่ม app.options('*', cors()) ก่อน app.use(express.json
    $content = $content -replace "(app\.use\(express\.json)", "app.options('*', cors());`n`n`$1"
    Set-Content $file $content
    Write-Host "Added app.options('*', cors())" -ForegroundColor Green
}

# แสดงบรรทัดที่เกี่ยวข้อง
Write-Host "`nCORS section:" -ForegroundColor Cyan
Select-String "cors|options|CORS" $file | Select-Object -First 10
