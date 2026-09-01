# Malaa Error Hub - Local Static Web Server (Pure ASCII PowerShell 5.1+ compatible)
$port = 8080
$url = "http://localhost:$port/"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Malaa Error Hub - Local Development Server    " -ForegroundColor Cyan
Write-Host "   URL: $url" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop the server               " -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Start-Process $url
} catch {
    Write-Host "Listener start failed on port $port. Opening index.html directly..." -ForegroundColor Yellow
    Start-Process (Join-Path $PSScriptRoot "index.html")
    exit
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath) -or $localPath -eq "/") {
            $localPath = "index.html"
        }

        $filePath = Join-Path $PSScriptRoot $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }

        $response.Close()
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
        $listener.Close()
    }
}
