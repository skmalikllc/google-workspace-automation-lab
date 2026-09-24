/**
 * On form submit: validate the response, write a normalised row, notify a human
 * only when something needs a human.
 *
 * The rule this encodes: a notification that fires on every submission is muted
 * within a week. Notify on exceptions, log everything.
 *
 * LAB CODE.
 */

var NOTIFY_TO = '';        // set to an address to enable email
var LOG_SHEET  = 'Intake Log';

/** Install: Triggers > From spreadsheet > On form submit. */
function onFormSubmit(e) {
  var named = e.namedValues || {};
  var record = {
    submittedAt: new Date(),
    organisation: collapse_(first_(named['Organisation'])),
    reference: digits_(first_(named['Reference number'])),
    email: String(first_(named['Email'])).trim().toLowerCase(),
    amount: Number(first_(named['Amount']) || 0)
  };

  var problems = [];
  if (!record.organisation) problems.push('organisation missing');
  if (!/^\d{6,}$/.test(record.reference)) problems.push('reference not in the expected format');
  if (!/.+@.+\..+/.test(record.email)) problems.push('email not valid');
  if (isNaN(record.amount) || record.amount < 0) problems.push('amount not a positive number');

  var duplicate = findByReference_(record.reference);

  logRow_(record, problems, duplicate);

  if (NOTIFY_TO && (problems.length || duplicate)) {
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: 'Intake needs review: ' + (record.organisation || '(no name)'),
      body: [
        'Reference: ' + record.reference,
        'Email: ' + record.email,
        problems.length ? 'Problems: ' + problems.join('; ') : '',
        duplicate ? 'Possible duplicate of row ' + duplicate : ''
      ].filter(String).join('\n')
    });
  }
}

function logRow_(r, problems, duplicate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOG_SHEET) || ss.insertSheet(LOG_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Submitted', 'Organisation', 'Reference', 'Email', 'Amount', 'Problems', 'Duplicate of']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  sheet.appendRow([r.submittedAt, r.organisation, r.reference, r.email, r.amount,
                   problems.join('; '), duplicate || '']);
}

/** Exact-key duplicate check. A reference number is a key; a name is not. */
function findByReference_(reference) {
  if (!reference) return '';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return '';
  var refs = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]) === reference) return i + 2;
  }
  return '';
}

function first_(v) { return Array.isArray(v) ? v[0] : (v || ''); }
function collapse_(v) { return String(v).replace(/\s+/g, ' ').trim(); }
function digits_(v) { return String(v).replace(/\D+/g, ''); }
