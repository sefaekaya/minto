// Giderler sekmesi: veri erişimi ve işlemler

function sheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(TAB);
  if (!s) {
    const eski = ss.getSheetByName(ESKI_TAB);  // eski adla kayıtlı veri varsa sekmeyi yeniden adlandır
    if (eski) { eski.setName(TAB); s = eski; } else s = ss.insertSheet(TAB);
  }
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1);
    s.setColumnWidth(5, 240); s.setColumnWidth(8, 220);
  }
  baslikTamamla_(s, HEAD);  // eski sekmeye Tekrar ID / Ekleyen sütunları
  return s;
}

function toItem_(r, tz) {
  const d = r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : '';
  return { id: String(r[0]), tarih: d, kategori: txt_(r[3]), aciklama: txt_(r[4]), tutar: Number(r[5]) || 0, odendi: r[6] === true, not: txt_(r[7]), rec: r[8] ? 1 : 0, rid: r[8] || '', ekleyen: r[9] || '' };
}

function writeRow_(s, row, e, id) {
  const p = e.tarih.split('-');
  const date = new Date(+p[0], +p[1] - 1, +p[2]);
  setV_(s.getRange(row, 1, 1, 8), [[id, date, '', e.kategori, e.aciklama, Number(e.tutar) || 0, false, e.not || '']]);
  s.getRange(row, 2).setNumberFormat('dd.mm.yyyy');
  // Ay anahtarı: ayın ilk günü (sıralama bozulmaz), "Ekim 2026" biçiminde görünür
  s.getRange(row, 3).setFormula('=DATE(YEAR(B' + row + '),MONTH(B' + row + '),1)').setNumberFormat('mmmm yyyy');
  s.getRange(row, 6).setNumberFormat('"₺"#,##0.00');
  s.getRange(row, 7).insertCheckboxes().setValue(!!e.odendi);
}

function addItem(e) {
  guard_();
  const dv = dovizDonustur_(e.para, e.tutar, e.aciklama);  // döviz seçildiyse güncel kurla TL'ye çevirir (kilit dışında)
  const kim = kim_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_(), id = Utilities.getUuid().slice(0, 8), row = lastRow_(s) + 1;
    const k = Object.assign({}, e, { tutar: dv.tutar, aciklama: dv.aciklama });
    writeRow_(s, row, k, id);
    s.getRange(row, 10).setValue(kim);
    return Object.assign({}, k, { id: id, odendi: !!e.odendi, kurBilgi: dv.bilgi, ekleyen: kim });
  } finally { lock.releaseLock(); }
}

function updateItem(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    writeRow_(s, r, e, e.id);
    return e;
  } finally { lock.releaseLock(); }
}

function setPaid(id, val) {
  guard_();
  const tk = String(id)[0] === 'T', s = tk ? tsheet_() : sheet_(), r = findRow_(s, id);
  if (r < 0) throw new Error('Kayıt bulunamadı');
  s.getRange(r, tk ? 9 : 7).insertCheckboxes().setValue(!!val);
  return true;
}

function deleteItem(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    return true;
  } finally { lock.releaseLock(); }
}

// Silmeyi geri al: silinen kaydı aynı kimlikle tabloya geri yazar
function geriYukleGider(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = sheet_();
    if (findRow_(s, e.id) > 0) return true;
    const row = lastRow_(s) + 1;
    writeRow_(s, row, e, e.id);
    setV_(s.getRange(row, 9, 1, 2), [[e.rid || '', e.ekleyen || '']]);
    return true;
  } finally { lock.releaseLock(); }
}
