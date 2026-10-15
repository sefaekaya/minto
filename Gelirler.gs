// Gelirler sekmesi: gelir kayıtları
function gsheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(GTAB);
  if (!s) s = ss.insertSheet(GTAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, GHEAD.length).setValues([GHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(5, 240); s.setColumnWidth(7, 220);
  }
  baslikTamamla_(s, GHEAD);
  return s;
}

function getGelirler() {
  guard_();
  const tz = ss_().getSpreadsheetTimeZone();
  return rows_(gsheet_(), 8).filter(r => r[1] instanceof Date).map(r => ({
    id: String(r[0]), tarih: Utilities.formatDate(r[1], tz, 'yyyy-MM-dd'), kaynak: txt_(r[3]), aciklama: txt_(r[4]), tutar: Number(r[5]) || 0, not: txt_(r[6]), ekleyen: r[7] || '' }));
}

function writeGelir_(s, row, e, id) {
  const p = e.tarih.split('-');
  setV_(s.getRange(row, 1, 1, 7), [[id, new Date(+p[0], +p[1] - 1, +p[2]), '', e.kaynak, e.aciklama || '', Number(e.tutar) || 0, e.not || '']]);
  s.getRange(row, 2).setNumberFormat('dd.mm.yyyy');
  s.getRange(row, 3).setFormula('=DATE(YEAR(B' + row + '),MONTH(B' + row + '),1)').setNumberFormat('mmmm yyyy');
  s.getRange(row, 6).setNumberFormat('"₺"#,##0.00');
}

function addGelir(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = gsheet_(), id = 'G' + Utilities.getUuid().slice(0, 8), row = lastRow_(s) + 1, kim = kim_();
    writeGelir_(s, row, e, id);
    s.getRange(row, 8).setValue(kim);
    return Object.assign({}, e, { id: id, tutar: Number(e.tutar) || 0, ekleyen: kim });
  } finally { lock.releaseLock(); }
}

function updateGelir(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = gsheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    writeGelir_(s, r, e, e.id);
    return e;
  } finally { lock.releaseLock(); }
}

function deleteGelir(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = gsheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    return true;
  } finally { lock.releaseLock(); }
}

function geriYukleGelir(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = gsheet_();
    if (findRow_(s, e.id) > 0) return true;
    const row = lastRow_(s) + 1;
    writeGelir_(s, row, e, e.id);
    s.getRange(row, 8).setValue(e.ekleyen || '');
    return true;
  } finally { lock.releaseLock(); }
}
