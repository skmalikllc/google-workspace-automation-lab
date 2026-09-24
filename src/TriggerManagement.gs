/**
 * Install time-driven triggers idempotently.
 *
 * Why: re-running an install function is the single most common way a script
 * ends up firing four times a night. Delete first, then create.
 *
 * LAB CODE.
 */

function installDailyTrigger(handlerName, hour) {
  removeTriggers(handlerName);
  ScriptApp.newTrigger(handlerName).timeBased().atHour(hour).everyDays(1).create();
  Logger.log('installed daily trigger for %s at ~%s:00', handlerName, hour);
}

function removeTriggers(handlerName) {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handlerName) { ScriptApp.deleteTrigger(t); removed++; }
  });
  if (removed) Logger.log('removed %s existing trigger(s) for %s', removed, handlerName);
  return removed;
}

/** What is actually installed right now. Run this before assuming. */
function listTriggers() {
  var rows = ScriptApp.getProjectTriggers().map(function (t) {
    return t.getHandlerFunction() + '  ' + t.getEventType() + '  ' + t.getTriggerSource();
  });
  Logger.log(rows.length ? rows.join('\n') : 'no triggers installed');
  return rows;
}
