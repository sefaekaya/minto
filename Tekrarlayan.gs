// Tekrarlayanlar sekmesi: her ay otomatik gider olarak eklenen giderler (kira, aidat, kredi...)
function rsheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(RTAB);
  if (!s) s = ss.insertSheet(RTAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, RHEAD.length).setValues([RHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(2, 220); s.setColumnWidth(9, 200);
    s.getRange('F2:G').setNumberFormat('@'); s.getRange('J2:J').setNumberFormat('@');  // yyyy-MM metin olarak kalsın
  }
  baslikTamamla_(s, RHEAD);  // eski sekmeye Para Birimi / Ekleyen sütunları
  return s;
}

function key_(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM') : String(v || '').trim();
}

function addKey_(k, n) {
  const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1 + n, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

function recObj_(r, tz) {
  return { id: String(r[0]), aciklama: txt_(r[1]), kategori: txt_(r[2]), tutar: Number(r[3]) || 0, gun: Number(r[4]) || 1,
    bas: key_(r[5], tz), bit: key_(r[6], tz), aktif: r[7] === true, not: txt_(r[8]), para: String(r[10] || ANA_PARA), son: key_(r[9], tz), ekleyen: r[11] || '' };
}

function getRecs() {
  guard_();
  const tz = ss_().getSpreadsheetTimeZone();
  return rows_(rsheet_(), 12).map(r => recObj_(r, tz));
}

function writeRec_(s, row, e, id, son) {
  const bas = e.ilk.slice(0, 7), sure = parseInt(e.sure, 10), aktif = e.aktif !== false;
  s.getRange(row, 6, 1, 2).setNumberFormat('@'); s.getRange(row, 10).setNumberFormat('@');
  setV_(s.getRange(row, 1, 1, 12), [[id, e.aciklama, e.kategori, Number(e.tutar) || 0, +e.ilk.slice(8, 10),
    bas, sure > 0 ? addKey_(bas, sure - 1) : '', aktif, e.not || '', son || '', String(e.para || ANA_PARA), e.ekleyen || '']]);
  s.getRange(row, 4).setNumberFormat('"₺"#,##0.00');
  s.getRange(row, 8).insertCheckboxes().setValue(aktif);
}

function addRec(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = rsheet_();
    writeRec_(s, lastRow_(s) + 1, Object.assign({}, e, { ekleyen: kim_() }), 'R' + Utilities.getUuid().slice(0, 7), '');
  } finally { lock.releaseLock(); }
  uret_();
  return true;
}

function updateRec(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = rsheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    writeRec_(s, r, Object.assign({}, e, { ekleyen: s.getRange(r, 12).getValue() }), e.id, key_(s.getRange(r, 10).getValue(), ss_().getSpreadsheetTimeZone()));
  } finally { lock.releaseLock(); }
  uret_();
  return true;
}

function setRecActive(id, val) {
  guard_();
  const s = rsheet_(), r = findRow_(s, id);
  if (r < 0) throw new Error('Kayıt bulunamadı');
  s.getRange(r, 8).insertCheckboxes().setValue(!!val);
  if (val) uret_();
  return true;
}

// Silinen tanım gelecekte gider üretmez; daha önce oluşan giderlere dokunulmaz.
function deleteRec(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = rsheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    return true;
  } finally { lock.releaseLock(); }
}

// Her aktif tanım için, son üretilen aydan bu aya kadar eksik ayların giderini ekler.
// "Son Üretilen" sütunu tekrar üretimi engeller; elle silinen kayıt yeniden oluşmaz.
function uret_() {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = rsheet_(), tz = ss_().getSpreadsheetTimeZone(), n = lastRow_(s);
    if (n < 2) return 0;
    const hs = sheet_(), cur = Utilities.formatDate(new Date(), tz, 'yyyy-MM');
    let made = 0;
    s.getRange(2, 1, n - 1, 12).getValues().forEach((r, i) => {
      if (r[0] === '' || r[7] !== true) return;
      const bas = key_(r[5], tz), bit = key_(r[6], tz), son = key_(r[9], tz);
      if (!bas) return;
      let k = son ? addKey_(son, 1) : bas, last = son, guard = 0;
      if (k < bas) k = bas;
      while (k <= cur && (!bit || k <= bit) && guard++ < 36) {
        const y = +k.slice(0, 4), m = +k.slice(5, 7), son_gun = new Date(y, m, 0).getDate();
        let dv;
        try { dv = dovizDonustur_(r[10] || ANA_PARA, r[3], r[1]); } catch (err) { break; }  // kur alınamazsa bu tanım bir sonraki açılışa kalır
        const row = lastRow_(hs) + 1;
        writeRow_(hs, row, { tarih: k + '-' + ('0' + Math.min(Number(r[4]) || 1, son_gun)).slice(-2),
          kategori: txt_(r[2]), aciklama: dv.aciklama, tutar: dv.tutar, odendi: false, not: txt_(r[8]) }, Utilities.getUuid().slice(0, 8));
        setV_(hs.getRange(row, 9, 1, 2), [[r[0], r[11] || '']]);
        last = k; k = addKey_(k, 1); made++;
      }
      if (last !== son) s.getRange(i + 2, 10).setNumberFormat('@').setValue(last);
    });
    return made;
  } finally { lock.releaseLock(); }
}

// Silinen tekrarlayan tanımı aynı kimlik ve "Son Üretilen" ile geri yazar (aksi halde eski aylar yeniden üretilirdi)
function geriYukleRec(x) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = rsheet_();
    if (findRow_(s, x.id) > 0) return true;
    const row = lastRow_(s) + 1;
    s.getRange(row, 6, 1, 2).setNumberFormat('@'); s.getRange(row, 10).setNumberFormat('@');
    setV_(s.getRange(row, 1, 1, 12), [[x.id, x.aciklama, x.kategori, Number(x.tutar) || 0, x.gun, x.bas, x.bit || '', !!x.aktif,
      x.not || '', x.son || '', x.para || ANA_PARA, x.ekleyen || '']]);
    s.getRange(row, 4).setNumberFormat('"₺"#,##0.00');
    s.getRange(row, 8).insertCheckboxes().setValue(!!x.aktif);
    return true;
  } finally { lock.releaseLock(); }
}
