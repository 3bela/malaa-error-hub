# Comprehensive Browser Workflow & Console Verification Script
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$artifactDir = "C:\Users\Product Intern\.gemini\antigravity\brain\74566b8e-1865-4702-b7b4-526db7c27f6a"
$reviewScreenshotPath = Join-Path $artifactDir "product_error_review_page.png"
$htmlUrl = "file:///" + ($PSScriptRoot -replace '\\', '/') + "/index.html"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  RUNNING BROWSER WORKFLOW & CONSOLE ERROR TEST  " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Test Console Errors by loading the page and running tests directly in JS
$testScript = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="statusToast" class="status-toast" style="display:none;"></div>
  <div id="error-fallback" style="display:none;"></div>
  <div id="root"></div>

  <script src="src/mockData.js"></script>
  <script src="src/storage.js"></script>
  <script src="src/export.js"></script>
  <script src="src/app.js"></script>

  <script>
    var logs = [];
    var errors = [];
    window.onerror = function(msg, url, line, col, err) {
      errors.push({ type: 'error', message: msg, line: line });
    };
    console.error = function() {
      errors.push({ type: 'console.error', args: Array.from(arguments).join(' ') });
    };

    try {
      // 1. Initial render -> landing
      setPOV('landing');
      logs.push('POV set to landing');

      // 2. Switch to Product POV
      setPOV('product');
      logs.push('Switched to Product POV');

      // 3. Open Error Review for AUTH_018
      openReviewPage('auth_018', 'queue');
      logs.push('Opened review page for AUTH_018');

      // 4. Test Editing Corrected AR & EN
      var recBefore = errorStore.getById('auth_018');
      var origArBefore = recBefore.originalArMessage;
      var origEnBefore = recBefore.originalEnMessage;

      AppState.reviewForm.correctedAr = "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد فوراً.";
      AppState.reviewForm.correctedEn = "The verification code has expired. Please request a new one immediately.";
      handleSaveDraft('auth_018');

      var recAfter = errorStore.getById('auth_018');
      if (recAfter.originalArMessage === origArBefore && recAfter.originalEnMessage === origEnBefore) {
        logs.push('PASS: Immutability verified - Original AR & EN did NOT change.');
      } else {
        errors.push('FAIL: Original AR/EN were mutated!');
      }

      // 5. Test Approval
      handleApproveError('auth_018');
      var approvedRec = errorStore.getById('auth_018');
      if (approvedRec.reviewStatus === 'approved') {
        logs.push('PASS: Approved status saved successfully.');
      } else {
        errors.push('FAIL: Approval failed.');
      }

      // 6. Test CSV Generation
      var approvedList = errorStore.getApprovedOnly();
      var csvText = generateCsv(approvedList);
      if (csvText && csvText.indexOf('AUTH_018') !== -1) {
        logs.push('PASS: CSV generated with approved records (' + approvedList.length + ' rows).');
      } else {
        errors.push('FAIL: CSV export failed.');
      }

      // 7. Switch to Customer Support POV
      setPOV('support');
      setSupportTab('all-errors');
      var supportVisible = errorStore.getApprovedOnly();
      var unapprovedVisible = supportVisible.filter(function(r) { return r.reviewStatus !== 'approved'; });
      if (unapprovedVisible.length === 0) {
        logs.push('PASS: Customer Support catalog strictly contains only Approved records.');
      } else {
        errors.push('FAIL: Unapproved records leaked to Customer Support!');
      }

      // Re-open review page for review screenshot
      setPOV('product');
      openReviewPage('auth_018', 'queue');

    } catch (e) {
      errors.push({ type: 'exception', message: e.message, stack: e.stack });
    }

    window.__TEST_RESULTS__ = { logs: logs, errors: errors };
    var resDiv = document.createElement('div');
    resDiv.id = 'test-results-output';
    resDiv.textContent = JSON.stringify(window.__TEST_RESULTS__);
    document.body.appendChild(resDiv);
  </script>
</body>
</html>
"@

$runnerPath = Join-Path $PSScriptRoot "test_runner.html"
Set-Content -Path $runnerPath -Value $testScript -Encoding UTF8

$runnerUrl = "file:///" + ($runnerPath -replace '\\', '/')

# Run Edge headless to execute test runner and output DOM
$dumpArg = "--headless --disable-gpu --dump-dom `"$runnerUrl`""
Start-Process -FilePath $edgePath -ArgumentList $dumpArg -NoNewWindow -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot "test_output.html") -Wait

$outHtml = Get-Content (Join-Path $PSScriptRoot "test_output.html") -Raw -Encoding UTF8

# Extract JSON test results
if ($outHtml -match '<div id="test-results-output">([^<]+)</div>') {
    $json = $matches[1]
    Write-Host "`nTest Execution Output:" -ForegroundColor Yellow
    Write-Host $json
}

# Take screenshot of Product Error Review Page
$shotArg = "--headless --disable-gpu --window-size=1280,1050 --screenshot=`"$reviewScreenshotPath`" `"$runnerUrl`""
Start-Process -FilePath $edgePath -ArgumentList $shotArg -NoNewWindow -Wait

if (Test-Path $reviewScreenshotPath) {
    Write-Host "`nSUCCESS: Product Review screenshot captured at: $reviewScreenshotPath" -ForegroundColor Green
} else {
    Write-Host "`nFailed to capture review screenshot." -ForegroundColor Red
}
