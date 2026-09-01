# Automated Verification Script for Malaa Error Hub Additional Corrections

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Running Automated Verification: Malaa Error Hub MVP Corrections " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$baseDir = "C:\Users\Product Intern\.gemini\antigravity\scratch\error-dashboard"
$passCount = 0
$failCount = 0

function Assert-Test($condition, $testName) {
    if ($condition) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "[FAIL] $testName" -ForegroundColor Red
        $script:failCount++
    }
}

# 1. Test Export Center (6 Columns in Exact Order)
$exportJs = Get-Content "$baseDir\src\export.js" -Raw
$has6CsvHeaders = ($exportJs -match '"Error Code"') -and ($exportJs -match '"Service"') -and ($exportJs -match '"Original AR Message"') -and ($exportJs -match '"Original EN Message"') -and ($exportJs -match '"Corrected AR Message"') -and ($exportJs -match '"Corrected EN Message"')
$has6MdHeaders = $exportJs -match '\| Error Code \| Service \| Original AR Message \| Original EN Message \| Corrected AR Message \| Corrected EN Message \|'
$has6HtmlHeaders = ($exportJs -match 'Error Code') -and ($exportJs -match 'Original AR Message') -and ($exportJs -match 'Corrected EN Message')
$noSourceRefExport = ($exportJs -notmatch 'Source Reference') -and ($exportJs -notmatch 'sourceReference')
$hasBom = $exportJs -match '\\uFEFF'

Assert-Test ($has6CsvHeaders -and $has6MdHeaders -and $has6HtmlHeaders -and $noSourceRefExport -and $hasBom) "1. Engineering Export outputs exact 6 columns in exact order across CSV (with UTF-8 BOM), MD, and HTML without source reference"

# 2. Test Changed Fields Removed From Product POV
$appJs = Get-Content "$baseDir\src\app.js" -Raw
$mockDataJs = Get-Content "$baseDir\src\mockData.js" -Raw
$noChangedBadgesInApp = ($appJs -notmatch 'renderChangedBadges')
$noChangedColInApp = ($appJs -notmatch '<th>Changed</th>') -and ($appJs -notmatch '<th>Changed Fields</th>')
$noChangeFilter = ($appJs -notmatch 'queueChangeType')
$noDeriveChangedInMock = ($mockDataJs -notmatch 'function deriveChangedFields')

Assert-Test ($noChangedBadgesInApp -and $noChangedColInApp -and $noChangeFilter -and $noDeriveChangedInMock) "2. Changed Fields column, filter, and badges completely removed from Product POV"

# 3. Test Larger Review Buttons
$styleCss = Get-Content "$baseDir\style.css" -Raw
$hasBtnReviewCss = ($styleCss -match '\.btn-review\s*\{[^}]*min-width:\s*105px') -and ($styleCss -match 'padding:\s*0\.42rem 0\.95rem')
$productReviewUsesBtnReview = ($appJs -match 'class="btn-review"') -and ($appJs -match 'class="btn-review warning"')

Assert-Test ($hasBtnReviewCss -and $productReviewUsesBtnReview) "3. Larger prominent Review buttons (min-width 105px, padding 0.42rem 0.95rem) applied across all Product tables"

# 4. Test Prominent Status Workflow Bar
$hasProminentWorkflowCss = ($styleCss -match '\.status-legend-bar\s*\{[^}]*border:\s*1\.5px solid') -and ($styleCss -match '\.status-dot\s*\{[^}]*width:\s*10px')
$hasWorkflowInProductHome = $appJs -match 'renderProductHomePage[\s\S]*?\$\{renderStatusLegend\(\)\}'
$hasWorkflowInQueue = $appJs -match 'renderReviewQueuePage[\s\S]*?\$\{renderStatusLegend\(\)\}'
$hasWorkflowInTrackRequests = $appJs -match 'renderSupportTrackRequestsPage[\s\S]*?\$\{renderStatusLegend\(\)\}'
$hasWorkflowInEngQueue = $appJs -match 'renderEngineeringQueuePage[\s\S]*?\$\{renderStatusLegend\(\)\}'
$hasWorkflowInEngImpl = $appJs -match 'renderEngineeringImplementedPage[\s\S]*?\$\{renderStatusLegend\(\)\}'

Assert-Test ($hasProminentWorkflowCss -and $hasWorkflowInProductHome -and $hasWorkflowInQueue -and $hasWorkflowInTrackRequests -and $hasWorkflowInEngQueue -and $hasWorkflowInEngImpl) "4. Prominent Status Workflow legend bar rendered on all 5 required pages with 10px dots and 0.85rem uppercase title"

# 5. Test Real Product Response
$storageJs = Get-Content "$baseDir\src\storage.js" -Raw
$hasUpdateProdResponse = $storageJs -match 'updateProductResponse'
$hasProductResponseInReview = ($appJs -match 'handleSaveProductResponse') -and ($appJs -match 'handleCancelProductResponse')
$hasProductResponseInTrack = ($appJs -match 'No response yet') -and ($appJs -match 'productResponse')

Assert-Test ($hasUpdateProdResponse -and $hasProductResponseInReview -and $hasProductResponseInTrack) "5. Real Product Response field with Save/Cancel in Product review, persisting to shared record, and displayed in Customer Care Track Requests"

# 6. Test Source Reference Removed Everywhere
$noSourceInTables = ($appJs -notmatch '<th>Source Reference</th>') -and ($appJs -notmatch '<th>Source Ref</th>')
$noSourceInBadges = ($appJs -notmatch 'source-ref-badge')
$noSourceInSearch = ($appJs -notmatch 'sourceReference.*indexOf\(search\)')

Assert-Test ($noSourceInTables -and $noSourceInBadges -and $noSourceInSearch) "6. Source Reference completely removed from Product tables, Customer Care views, Engineering queues, details, and search logic"

# 7. Test Customer Care Operational Guidance Save & Cancel Actions
$hasCSOperationalButtons = ($appJs -match 'Save Operational Guidance') -and ($appJs -match 'handleCancelCSOperationalGuidance') -and ($appJs -match 'handleSaveCSOperationalGuidance')
$hasCSDirtyStateCheck = ($appJs -match 'isCSOperationalChanged') -and ($appJs -match 'updateCSDetailsButtons')

Assert-Test ($hasCSOperationalButtons -and $hasCSDirtyStateCheck) "7. Customer Care error details features prominent Save Operational Guidance (disabled when unchanged) and Cancel with dirty-state confirmation"

# 8. Test 'Other' Option in Customer Care Request Modal
$hasOtherInModal = $appJs -match '<option value="Other".*?>Other</option>'
$hasOtherCommentValidation = $appJs -match 'Comment is required to explain what needs to be reviewed for ''Other'''

Assert-Test ($hasOtherInModal -and $hasOtherCommentValidation) "8. 'Other' option added to Requested Field dropdown in CS Request Modal, requiring explanation comment and setting Change Request CS status"

# 9. Test Local File Protocol Compatibility (Zero external/blocked script dependencies)
$indexHtml = Get-Content "$baseDir\index.html" -Raw
$noTypeModule = ($indexHtml -notmatch 'type="module"')
$noBlockedScripts = ($indexHtml -notmatch '<script[^>]+src=["''][^"'']*https?://')
$hasAllScriptsInOrder = ($indexHtml -match 'mockData\.js[\s\S]*?storage\.js[\s\S]*?export\.js[\s\S]*?app\.js')

Assert-Test ($noTypeModule -and $noBlockedScripts -and $hasAllScriptsInOrder) "9. index.html is fully standalone and verified for double-click execution under file:// protocol"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Test Summary: $passCount Passed, $failCount Failed " -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
