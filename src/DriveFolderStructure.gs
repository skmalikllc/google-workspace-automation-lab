/**
 * Build a folder tree in Drive from a declarative spec, idempotently.
 *
 * Why this exists: "set up the folder structure" is one of the most common
 * operational requests, and it is always done twice — once now, once six months
 * later when a new client or year starts. Running this again must not create
 * "Clients (1)".
 *
 * LAB CODE. Written for this repository, not taken from a client project.
 */

/** @param {string} rootId  @param {Object} spec  nested object, leaves = {} */
function ensureFolderTree(rootId, spec) {
  var root = DriveApp.getFolderById(rootId);
  var created = [];
  walk_(root, spec, created, '');
  Logger.log('created %s folder(s): %s', created.length, created.join(', ') || '(none)');
  return created;
}

function walk_(parent, spec, created, path) {
  Object.keys(spec).forEach(function (name) {
    var existing = parent.getFoldersByName(name);
    var folder;
    if (existing.hasNext()) {
      folder = existing.next();
      // Two folders with the same name is legal in Drive and always a mistake.
      if (existing.hasNext()) {
        Logger.log('WARNING: duplicate folder name "%s" under %s', name, path || 'root');
      }
    } else {
      folder = parent.createFolder(name);
      created.push((path ? path + '/' : '') + name);
    }
    walk_(folder, spec[name] || {}, created, (path ? path + '/' : '') + name);
  });
}

/** Example spec. Replace with your own; nothing here is client specific. */
function demoFolderTree() {
  var SPEC = {
    'Clients': { 'Active': {}, 'Archive': {} },
    'Operations': { 'Templates': {}, 'SOPs': {}, 'Reports': {} },
    'Finance': { '2026': { 'Invoices': {}, 'Receipts': {} } }
  };
  ensureFolderTree(DriveApp.getRootFolder().getId(), SPEC);
}
