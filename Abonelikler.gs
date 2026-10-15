// Abonelikler sekmesi: dijital platform abonelikleri ve fiyat geçmişi
// Tutar, seçilen para biriminde (TL/USD/EUR...) olduğu gibi saklanır; kur çevirisi yalnızca toplamlar için ekranda yapılır.
function asheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(ATAB);
  if (!s) s = ss.insertSheet(ATAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, AHEAD.length).setValues([AHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(2, 220); s.setColumnWidth(8, 220);
  }
  baslikTamamla_(s, AHEAD);
  return s;
}

function afsheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(AFTAB);
  if (!s) s = ss.insertSheet(AFTAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, AFHEAD.length).setValues([AFHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1);
  }
  baslikTamamla_(s, AFHEAD);
  return s;
}

function dstr_(v, tz) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : ''; }

function aboObj_(r, tz) {
  return { id: String(r[0]), ad: txt_(r[1]), tutar: Number(r[2]) || 0, para: String(r[3] || ANA_PARA), donem: String(r[4] || 'Aylık'),
    yenileme: dstr_(r[5], tz), aktif: r[6] === true, not: txt_(r[7]), ekleyen: r[8] || '' };
}

function histObj_(r, tz) {
  return { id: String(r[0]), aid: String(r[1]), tarih: dstr_(r[2], tz), eski: Number(r[3]) || 0, yeni: Number(r[4]) || 0,
    eskiPara: String(r[5] || ANA_PARA), yeniPara: String(r[6] || ANA_PARA) };
}

// Abonelikler + fiyat geçmişi + aktif dövizli abonelikler için güncel kur (toplamlar için)
function getAbonelikler() {
  guard_();
  const tz = ss_().getSpreadsheetTimeZone();
  const items = rows_(asheet_(), 9).map(r => aboObj_(r, tz));
  const hist = rows_(afsheet_(), 7).map(r => histObj_(r, tz));
  const kur = {};
  items.forEach(x => {
    if (x.aktif && x.para !== ANA_PARA && DOVIZ_LISTESI.indexOf(x.para) >= 0 && !(x.para in kur)) {
      try { kur[x.para] = kurAl_(x.para).kur; } catch (err) { kur[x.para] = 0; }
    }
  });
  return { items: items, hist: hist, kur: kur };
}

function aboKontrol_(e) {
  const para = String(e.para || ANA_PARA);
  if (para !== ANA_PARA && DOVIZ_LISTESI.indexOf(para) < 0) throw new Error('Desteklenmeyen para birimi');
  if (!String(e.ad || '').trim()) throw new Error('Platform adı boş olamaz');
  if (!(Number(e.tutar) > 0)) throw new Error('Geçerli bir tutar girin');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.yenileme || ''))) throw new Error('Yenilenme tarihi geçersiz');
  return para;
}

function writeAbo_(s, row, e, id, para, ekleyen) {
  const p = e.yenileme.split('-'), aktif = e.aktif !== false;
  setV_(s.getRange(row, 1, 1, 9), [[id, String(e.ad).trim(), Number(e.tutar), para, e.donem === 'Yıllık' ? 'Yıllık' : 'Aylık',
    new Date(+p[0], +p[1] - 1, +p[2]), aktif, e.not || '', ekleyen || '']]);
  s.getRange(row, 3).setNumberFormat('#,##0.00');
  s.getRange(row, 6).setNumberFormat('dd.mm.yyyy');
  s.getRange(row, 7).insertCheckboxes().setValue(aktif);
}

function addAbonelik(e) {
  guard_();
  const para = aboKontrol_(e), kim = kim_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = asheet_(), id = 'A' + Utilities.getUuid().slice(0, 7);
    writeAbo_(s, lastRow_(s) + 1, e, id, para, kim);
    return { item: Object.assign({}, e, { id: id, ad: String(e.ad).trim(), tutar: Number(e.tutar), para: para, aktif: e.aktif !== false, ekleyen: kim }), h: null };
  } finally { lock.releaseLock(); }
}

// Tutar ya da para birimi değişirse (zam/indirim) eski ve yeni değer fiyat geçmişine yazılır.
function updateAbonelik(e) {
  guard_();
  const para = aboKontrol_(e), tz = ss_().getSpreadsheetTimeZone();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = asheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    const old = s.getRange(r, 1, 1, 9).getValues()[0];
    const eskiTutar = Number(old[2]) || 0, eskiPara = String(old[3] || ANA_PARA);
    writeAbo_(s, r, e, e.id, para, old[8] || '');
    let h = null;
    if (Math.round(eskiTutar * 100) !== Math.round(Number(e.tutar) * 100) || eskiPara !== para) {
      const fs = afsheet_(), row = lastRow_(fs) + 1, id = 'H' + Utilities.getUuid().slice(0, 7), now = new Date();
      setV_(fs.getRange(row, 1, 1, 7), [[id, e.id, now, eskiTutar, Number(e.tutar), eskiPara, para]]);
      fs.getRange(row, 3).setNumberFormat('dd.mm.yyyy');
      h = { id: id, aid: e.id, tarih: dstr_(now, tz), eski: eskiTutar, yeni: Number(e.tutar), eskiPara: eskiPara, yeniPara: para };
    }
    return { item: Object.assign({}, e, { ad: String(e.ad).trim(), tutar: Number(e.tutar), para: para, aktif: e.aktif !== false, ekleyen: old[8] || '' }), h: h };
  } finally { lock.releaseLock(); }
}

// Aboneliği ve fiyat geçmişini siler (geri alma için istemci kayıtları saklar)
function deleteAbonelik(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = asheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    const fs = afsheet_(), n = lastRow_(fs);
    if (n >= 2) {
      const a = fs.getRange(2, 2, n - 1, 1).getValues();
      for (let i = a.length - 1; i >= 0; i--) if (String(a[i][0]) === String(id)) fs.deleteRow(i + 2);
    }
    return true;
  } finally { lock.releaseLock(); }
}

function geriYukleAbonelik(p) {
  guard_();
  const e = p.item, para = aboKontrol_(e), tz = ss_().getSpreadsheetTimeZone();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = asheet_();
    if (findRow_(s, e.id) > 0) return true;
    writeAbo_(s, lastRow_(s) + 1, e, e.id, para, e.ekleyen || '');
    const fs = afsheet_();
    (p.hist || []).forEach(h => {
      const row = lastRow_(fs) + 1, d = (h.tarih || '').split('-');
      setV_(fs.getRange(row, 1, 1, 7), [[h.id, h.aid, new Date(+d[0], +d[1] - 1, +d[2]), h.eski, h.yeni, h.eskiPara, h.yeniPara]]);
      fs.getRange(row, 3).setNumberFormat('dd.mm.yyyy');
    });
    return true;
  } finally { lock.releaseLock(); }
}
