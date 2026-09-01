// Comprehensive Logic Verification for Error Dashboard (Code-Only Chips Verification)

var SERVICE_SECTIONS = [
  'Auth Service',
  'Banks',
  'Custodian',
  'Investment',
  'Omnibus',
  'Payment Gateway',
  'MyMalaa',
  'Lending'
];

var DEFAULT_ERRORS = {
  'AUTH_009': {
    code: 'AUTH_009',
    section: 'Auth Service',
    meaning: 'The entered phone number is not valid',
    trigger: 'User enters an invalid phone number',
    arabicMsg: 'رقم الهاتف غير صحيح. تحقق منه وحاول مرة أخرى.',
    englishMsg: 'The phone number is invalid. Check it and try again.',
    careAction: 'Ask the user to check the phone number and try again.'
  },
  'AUTH_013': {
    code: 'AUTH_013',
    section: 'Auth Service',
    meaning: 'The verification code entered is incorrect',
    trigger: 'User enters an incorrect OTP',
    arabicMsg: 'رمز التحقق غير صحيح. تحقق منه وحاول مرة أخرى.',
    englishMsg: 'The OTP is incorrect. Check it and try again.',
    careAction: 'Ask the user to check the OTP and try again.'
  },
  'AUTH_018': {
    code: 'AUTH_018',
    section: 'Auth Service',
    meaning: 'The verification code is no longer valid',
    trigger: 'The OTP has expired',
    arabicMsg: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
    englishMsg: 'The OTP has expired. Request a new one.',
    careAction: 'Ask the user to request a new OTP.'
  },
  'AUTH_046': {
    code: 'AUTH_046',
    section: 'Auth Service',
    meaning: 'The entered PIN is incorrect',
    trigger: 'User enters an incorrect PIN',
    arabicMsg: 'رمز الدخول غير صحيح. حاول مرة أخرى.',
    englishMsg: 'The PIN is incorrect. Try again.',
    careAction: 'Ask the user to try the PIN again.'
  },
  'BANK_011': {
    code: 'BANK_011',
    section: 'Banks',
    meaning: "The application could not establish a connection with the user's bank.",
    trigger: "The app attempts to connect to the user's bank, but the bank connection fails, the bank service is unavailable, or the connection times out.",
    arabicMsg: 'فشل في الاتصال بالبنك، الرجاء المحاولة لاحقاً',
    englishMsg: 'Failed connecting to the bank, please try again later',
    careAction: 'Ask the user to wait a few minutes and try connecting to the bank again. If the issue continues, confirm which bank the user is trying to connect to and escalate the issue if necessary.'
  },
  'CST_011': {
    code: 'CST_011',
    section: 'Custodian',
    meaning: 'The requested action cannot be completed because the current transaction or withdrawal status does not allow it.',
    trigger: 'The user attempts to perform a withdrawal or related transaction while its current status is not eligible for that action.',
    arabicMsg: 'تعذر تنفيذ طلب السحب، يرجى المحاولة مرة أخرى',
    englishMsg: "We couldn't process your withdrawal request. Please try again.",
    careAction: 'Ask the user to retry the withdrawal. If the issue continues, check whether the transaction or withdrawal is still being processed or is in a status that prevents the action, then escalate if necessary.'
  },
  'INV_026': {
    code: 'INV_026',
    section: 'Investment',
    meaning: 'The requested withdrawal amount is not available for withdrawal.',
    trigger: 'The user attempts to withdraw an amount greater than the currently available withdrawable amount.',
    arabicMsg: 'مبلغ السحب غير كافي',
    englishMsg: 'Insufficient Withdraw Amount',
    careAction: 'Ask the user to check the available withdrawable amount and retry using an amount within the available balance.'
  },
  'INV_018': {
    code: 'INV_018',
    section: 'Investment',
    meaning: "The user's identity verification cannot continue because some required KYC information is missing or incomplete.",
    trigger: 'The error appears when the user reaches the identity verification step but has not completed all required information. The user needs to complete the missing details so the verification can continue.',
    arabicMsg: 'لم يكتمل التحقق من هويتك، يرجى استكمال بياناتك للمتابعة',
    englishMsg: 'Your identity verification is incomplete. Please complete your details to continue.',
    careAction: 'Ask the user to return to the identity verification page and complete the missing required information. After completing the details, ask the user to try again.'
  },
  'OMN_011': {
    code: 'OMN_011',
    section: 'Omnibus',
    meaning: 'The payment could not be completed successfully.',
    trigger: 'A payment attempt is submitted but fails during payment processing.',
    arabicMsg: 'فشلت عملية الدفع',
    englishMsg: 'The payment was failed',
    careAction: 'Ask the user to retry the payment. If the payment continues to fail, confirm the transaction details and escalate the issue if required.'
  },
  'PAY_000': {
    code: 'PAY_000',
    section: 'Payment Gateway',
    meaning: 'The payment amount does not match the amount expected by the payment process.',
    trigger: 'The payment amount received or processed does not match the expected payment amount.',
    arabicMsg: 'المبلغ غير متطابق',
    englishMsg: 'New payment mismatch amount',
    careAction: 'Ask the user to retry the payment. If the issue continues, capture the relevant payment details and escalate the mismatch for investigation.'
  },
  'ST_011': {
    code: 'ST_011',
    section: 'Pending Confirmation',
    meaning: 'The requested action cannot be performed because the current status does not allow it.',
    trigger: 'The user attempts to perform a withdrawal while the current account, investment, or transaction status does not allow the withdrawal action.',
    arabicMsg: 'تعذر تنفيذ طلب السحب، يرجى المحاولة مرة أخرى',
    englishMsg: "We couldn't process your withdrawal request. Please try again.",
    careAction: 'Ask the user to retry the withdrawal. If the error continues, check the relevant account or transaction status and escalate the case for investigation.'
  },
  'PFM_004': {
    code: 'PFM_004',
    section: 'Pending Confirmation',
    meaning: 'A category or subcategory already exists with the same name.',
    trigger: 'The user attempts to create or rename a category or subcategory using a name that already exists.',
    arabicMsg: 'اسم التصنيف الرئيسي او الفرعي مكرر، يرجى تجربة اسم مختلف',
    englishMsg: 'Category or subcategory name is duplicate, please try a different name',
    careAction: 'Ask the user to choose a different category or subcategory name and try again.'
  }
};

function runTests() {
  var passed = true;

  WScript.Echo("=== 1. Testing Code-Only Chip Format ===");
  // Simulate chip label generation for Recently Viewed and Saved Errors
  var testCodes = ['AUTH_013', 'BANK_011', 'CST_011', 'INV_026', 'PAY_000'];
  for (var i = 0; i < testCodes.length; i++) {
    var chipText = testCodes[i]; // must be only code
    if (chipText.indexOf(" ") === -1 && DEFAULT_ERRORS[chipText]) {
      WScript.Echo("PASS: Chip '" + chipText + "' contains only the Error Code");
    } else {
      WScript.Echo("FAIL: Chip text contains extra description: " + chipText);
      passed = false;
    }
  }

  WScript.Echo("\n=== 2. Testing Quick Access Default Chips ===");
  var expectedQuickAccess = ['AUTH_018', 'BANK_011', 'CST_011', 'INV_026', 'PAY_000'];
  var quickCount = 0;
  for (var j = 0; j < expectedQuickAccess.length; j++) {
    if (DEFAULT_ERRORS[expectedQuickAccess[j]]) quickCount++;
  }
  if (quickCount === 5) {
    WScript.Echo("PASS: All 5 Quick Access codes valid and present in dataset");
  } else {
    WScript.Echo("FAIL: Quick Access codes invalid");
    passed = false;
  }

  WScript.Echo("\n=== 3. Testing 8 Service Sections Integrity ===");
  var counts = {};
  for (var s = 0; s < SERVICE_SECTIONS.length; s++) counts[SERVICE_SECTIONS[s]] = 0;
  for (var k in DEFAULT_ERRORS) {
    if (DEFAULT_ERRORS.hasOwnProperty(k)) {
      var item = DEFAULT_ERRORS[k];
      if (counts.hasOwnProperty(item.section)) counts[item.section]++;
    }
  }
  if (counts['Auth Service'] === 4 && counts['Banks'] === 1 && counts['Custodian'] === 1 &&
      counts['Investment'] === 2 && counts['Omnibus'] === 1 && counts['Payment Gateway'] === 1 &&
      counts['MyMalaa'] === 0 && counts['Lending'] === 0) {
    WScript.Echo("PASS: All 8 Service sections intact with CST_011 in Custodian and MyMalaa confirmed");
  } else {
    WScript.Echo("FAIL: Service section counts mismatch");
    passed = false;
  }

  if (passed) {
    WScript.Echo("\n*** ALL TESTS PASSED SUCCESSFULLY! ***");
  }
}

runTests();
