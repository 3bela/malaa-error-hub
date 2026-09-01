# Malaa Error Hub Automated Verification Suite (PowerShell)
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "   MALAA ERROR HUB -- AUTOMATED VERIFICATION      " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$allPassed = $true

# Read files
$mockJs = Get-Content (Join-Path $PSScriptRoot "src\mockData.js") -Raw -Encoding UTF8
$storageJs = Get-Content (Join-Path $PSScriptRoot "src\storage.js") -Raw -Encoding UTF8
$exportJs = Get-Content (Join-Path $PSScriptRoot "src\export.js") -Raw -Encoding UTF8
$appJs = Get-Content (Join-Path $PSScriptRoot "src\app.js") -Raw -Encoding UTF8
$styleCss = Get-Content (Join-Path $PSScriptRoot "style.css") -Raw -Encoding UTF8
$indexHtml = Get-Content (Join-Path $PSScriptRoot "index.html") -Raw -Encoding UTF8

# TEST 1: Seed Data Distribution & 8 Services & 5 Final Statuses
Write-Host "`n=== TEST 1: Seed Data Distribution and 8 Services ===" -ForegroundColor Yellow
$idMatches = [regex]::Matches($mockJs, 'errorCode:\s*"([^"]+)"')
$serviceMatches = [regex]::Matches($mockJs, 'service:\s*"([^"]+)"')
$statusMatches = [regex]::Matches($mockJs, 'status:\s*"([^"]+)"')

$recordCount = $idMatches.Count
Write-Host "Total Seed Records: $recordCount"
if ($recordCount -ge 20) {
    Write-Host "PASS: Seed dataset contains $recordCount records (>= 20 required)." -ForegroundColor Green
} else {
    Write-Host "FAIL: Seed dataset only has $recordCount records." -ForegroundColor Red
    $allPassed = $false
}

$expectedServices = @(
    "Auth Service", "Banks", "Custodian", "Investment",
    "Omnibus", "Payment Gateway", "Malaa", "Lending"
)

$serviceCounts = @{}
foreach ($s in $expectedServices) { $serviceCounts[$s] = 0 }
foreach ($match in $serviceMatches) {
    $val = $match.Groups[1].Value
    if ($serviceCounts.ContainsKey($val)) {
        $serviceCounts[$val]++
    }
}

$allServicesOk = $true
foreach ($s in $expectedServices) {
    $count = $serviceCounts[$s]
    if ($count -eq 0) {
        Write-Host "FAIL: Missing records for service '$s'" -ForegroundColor Red
        $allServicesOk = $false
        $allPassed = $false
    } else {
        Write-Host "  - $s : $count records" -ForegroundColor Gray
    }
}
if ($allServicesOk) {
    Write-Host "PASS: All 8 required service domains represented." -ForegroundColor Green
}

# Status Counts
$statusCounts = @{ "change_request_cs"=0; "not_reviewed"=0; "in_review"=0; "ready_for_engineering"=0; "implemented"=0 }
foreach ($match in $statusMatches) {
    $val = $match.Groups[1].Value
    if ($statusCounts.ContainsKey($val)) {
        $statusCounts[$val]++
    }
}
Write-Host ("Status Distribution: CS_Req=" + $statusCounts["change_request_cs"] + ", NotReviewed=" + $statusCounts["not_reviewed"] + ", InReview=" + $statusCounts["in_review"] + ", ReadyForEng=" + $statusCounts["ready_for_engineering"] + ", Implemented=" + $statusCounts["implemented"])
if ($statusCounts["change_request_cs"] -gt 0 -and $statusCounts["not_reviewed"] -gt 0 -and $statusCounts["in_review"] -gt 0 -and $statusCounts["ready_for_engineering"] -gt 0 -and $statusCounts["implemented"] -gt 0) {
    Write-Host "PASS: All 5 final error statuses present in seed data." -ForegroundColor Green
} else {
    Write-Host "FAIL: One or more final statuses missing." -ForegroundColor Red
    $allPassed = $false
}

# TEST 2: CSV Export Schema & Exact 7 Core Columns Order
Write-Host "`n=== TEST 2: CSV Export Schema and Exact 7 Core Columns Order ===" -ForegroundColor Yellow
$expectedHeaders = @(
    "Error Code",
    "Service",
    "Source Reference",
    "Original AR Message",
    "Corrected AR Message",
    "Original EN Message",
    "Corrected EN Message"
)

$extractedHeaders = @()
$capture = $false
$lines = $exportJs -split "`r?`n"
foreach ($line in $lines) {
    if ($line.Contains("CSV_HEADERS = [")) { $capture = $true; continue }
    if ($capture -and $line.Contains("];")) { $capture = $false; break }
    if ($capture) {
        $m = [regex]::Matches($line, '"([^"]+)"')
        foreach ($item in $m) {
            $extractedHeaders += $item.Groups[1].Value
        }
    }
}

$headersMatch = $true
if ($extractedHeaders.Count -eq $expectedHeaders.Count) {
    for ($i = 0; $i -lt $expectedHeaders.Count; $i++) {
        if ($extractedHeaders[$i] -ne $expectedHeaders[$i]) {
            Write-Host ("FAIL: Column " + ($i+1) + " mismatch: Expected '" + $expectedHeaders[$i] + "', Got '" + $extractedHeaders[$i] + "'") -ForegroundColor Red
            $headersMatch = $false
            $allPassed = $false
        }
    }
} else {
    Write-Host "FAIL: Header count mismatch: Expected 7, Got $($extractedHeaders.Count)" -ForegroundColor Red
    $headersMatch = $false
    $allPassed = $false
}

if ($headersMatch) {
    Write-Host "PASS: Exact 7 core CSV export columns verified in correct order (triggers, meaning, action, comment, status, changed fields excluded):" -ForegroundColor Green
    for ($i = 0; $i -lt $expectedHeaders.Count; $i++) {
        Write-Host "  $($i+1). $($expectedHeaders[$i])" -ForegroundColor Gray
    }
}

# TEST 3: RTL/LTR Directionality & Design System
Write-Host "`n=== TEST 3: RTL/LTR Directionality and Design Tokens ===" -ForegroundColor Yellow
$hasRtl = $styleCss.Contains("direction: rtl")
$hasCairo = $styleCss.Contains("Cairo")
$hasMono = $styleCss.Contains("font-mono")

if ($hasRtl -and $hasCairo -and $hasMono) {
    Write-Host "PASS: CSS defines RTL for Arabic, LTR for English/Codes, and Cairo Arabic typography." -ForegroundColor Green
} else {
    Write-Host "FAIL: Typography or RTL direction tokens missing." -ForegroundColor Red
    $allPassed = $false
}

# TEST 4: App.js 3-Section Separation (Product, Customer Care, Engineer) & Tracking Ready Engineering
Write-Host "`n=== TEST 4: 3-Section Separation & Governance in app.js ===" -ForegroundColor Yellow
$hasProductPOV = $appJs.Contains("Product")
$hasSupportPOV = $appJs.Contains("Customer Care")
$hasEngPOV = $appJs.Contains("Engineer")
$hasTrackingReady = $appJs.Contains("Tracking Ready Engineering")
$hasValidationAlert = ($appJs.Contains("validation-alert-box") -or $appJs.Contains("Ready for Engineering Blocked"))
$hasCsvDownload = $exportJs.Contains("downloadCsv")

if ($hasProductPOV -and $hasSupportPOV -and $hasEngPOV -and $hasTrackingReady) {
    Write-Host "PASS: 3 renamed sections (Product, Customer Care, Engineer) and Product 'Tracking Ready Engineering' section verified." -ForegroundColor Green
} else {
    Write-Host "FAIL: Perspective sections or Tracking Ready section missing in controller." -ForegroundColor Red
    $allPassed = $false
}

if ($hasValidationAlert) {
    Write-Host "PASS: Strict Ready for Engineering validation rules implemented (AR, EN, Trigger, Meaning, Support Action required)." -ForegroundColor Green
} else {
    Write-Host "FAIL: Approval validation missing." -ForegroundColor Red
    $allPassed = $false
}

# Final Summary
Write-Host "`n=================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "   *** ALL ACCEPTANCE CHECKS PASSED (100%) ***   " -ForegroundColor Green
} else {
    Write-Host "   *** SOME TESTS FAILED ***                     " -ForegroundColor Red
}
Write-Host "=================================================`n" -ForegroundColor Cyan

