/**
 * Build a summary tab from a data tab, and rebuild it in place on every run.
 *
 * The rule this encodes: a report should be regenerated, never edited. If the
 * summary is hand-maintained, it is wrong by Wednesday.
 *
 * LAB CODE.
 */

/**
 * @param {string} dataSheetName   tab holding the rows, header in row 1
 * @param {string} groupByHeader   column to group on
 * @param {string} sumHeader       numeric column to total
 * @param {string} outSheetName    tab to write (created or cleared)
 */
function buildSummary(dataSheetName, groupByHeader, sumHeader, outSheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = ss.getSheetByName(dataSheetName);
  if (!data) throw new Error('No sheet named "' + dataSheetName + '"');

  var values = data.getDataRange().getValues();
  if (values.length < 2) throw new Error('"' + dataSheetName + '" has no rows below the header');

  var header = values.shift().map(String);
  var gi = header.indexOf(groupByHeader);
  var si = header.indexOf(sumHeader);
  if (gi === -1) throw new Error('No column "' + groupByHeader + '". Found: ' + header.join(', '));
  if (si === -1) throw new Error('No column "' + sumHeader + '". Found: ' + header.join(', '));

  var totals = {}, counts = {}, skipped = 0;
  values.forEach(function (row) {
    var key = String(row[gi]).trim();
    if (!key) { skipped++; return; }               // blank key is a data problem, not a group
    var n = Number(row[si]);
    if (isNaN(n)) { skipped++; return; }           // report it, do not silently treat as 0
    totals[key] = (totals[key] || 0) + n;
    counts[key] = (counts[key] || 0) + 1;
  });

  var out = ss.getSheetByName(outSheetName) || ss.insertSheet(outSheetName);
  out.clear();
  var rows = [[groupByHeader, 'Rows', 'Total ' + sumHeader]];
  Object.keys(totals).sort().forEach(function (k) { rows.push([k, counts[k], totals[k]]); });
  rows.push(['', '', '']);
  rows.push(['Generated', new Date(), skipped ? skipped + ' row(s) skipped' : 'all rows counted']);

  out.getRange(1, 1, rows.length, 3).setValues(rows);
  out.getRange(1, 1, 1, 3).setFontWeight('bold');
  out.autoResizeColumns(1, 3);
  return { groups: Object.keys(totals).length, skipped: skipped };
}
