/**
 * Apply a label to a Gmail search result, in batches, without timing out.
 *
 * Two things this gets right that a naive loop does not:
 *  - Apps Script has a ~6 minute execution limit. A backlog of 40,000 threads
 *    will not finish in one run, so the run is bounded and resumable.
 *  - Labels are created if missing, so the script is safe on a fresh account.
 *
 * LAB CODE.
 */

var BATCH_SIZE = 100;     // Gmail's own batch ceiling for label operations
var MAX_THREADS = 500;    // per run; raise once you know the run time

/**
 * @param {Array<{query:string, label:string}>} rules
 * Example: [{ query: 'from:notifications@ older_than:30d', label: 'Automated/Notifications' }]
 */
function applyLabelRules(rules) {
  rules.forEach(function (rule) {
    var label = GmailApp.getUserLabelByName(rule.label) || GmailApp.createLabel(rule.label);
    var processed = 0;

    while (processed < MAX_THREADS) {
      var threads = GmailApp.search(rule.query + ' -label:"' + rule.label + '"', processed, BATCH_SIZE);
      if (!threads.length) break;
      label.addToThreads(threads);
      processed += threads.length;
      if (threads.length < BATCH_SIZE) break;
    }
    Logger.log('%s -> %s : %s thread(s)', rule.query, rule.label, processed);
  });
}

/**
 * Preview mode. Always run this first on someone else's mailbox.
 * Nothing is modified; it only reports how many threads each rule would touch.
 */
function previewLabelRules(rules) {
  return rules.map(function (rule) {
    var n = GmailApp.search(rule.query + ' -label:"' + rule.label + '"', 0, 500).length;
    Logger.log('%s would label %s thread(s)%s', rule.label, n, n === 500 ? '+ (capped)' : '');
    return { label: rule.label, query: rule.query, wouldLabel: n };
  });
}
