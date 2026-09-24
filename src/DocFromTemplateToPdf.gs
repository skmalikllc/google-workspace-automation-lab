/**
 * Fill a Google Docs template, export it as PDF into a Drive folder, and leave
 * the template untouched.
 *
 * The mistake this avoids: editing the template itself. Every run must start
 * from a copy, or the second run has last run's data baked into it.
 *
 * LAB CODE.
 */

/**
 * @param {string} templateId   Doc containing {{placeholders}}
 * @param {string} folderId     Drive folder to write the PDF into
 * @param {Object} values       { placeholder: replacement }
 * @param {string} filename
 * @returns {string} URL of the PDF
 */
function renderTemplateToPdf(templateId, folderId, values, filename) {
  var folder = DriveApp.getFolderById(folderId);
  var copy = DriveApp.getFileById(templateId).makeCopy(filename + ' (working)', folder);

  try {
    var doc = DocumentApp.openById(copy.getId());
    var body = doc.getBody();
    Object.keys(values).forEach(function (key) {
      body.replaceText('\\{\\{' + key + '\\}\\}', String(values[key]));
    });
    doc.saveAndClose();

    var leftovers = DocumentApp.openById(copy.getId()).getBody().getText().match(/\{\{[^}]+\}\}/g);
    if (leftovers) Logger.log('WARNING: unreplaced placeholders: %s', leftovers.join(', '));

    var pdf = folder.createFile(copy.getAs('application/pdf')).setName(filename + '.pdf');
    return pdf.getUrl();
  } finally {
    copy.setTrashed(true);   // the working copy is never a deliverable
  }
}
