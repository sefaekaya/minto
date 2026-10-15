// Taksitler sekmesi: taksit planı oluşturma ve işlemler

function tsheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(TTAB);
  if (!s) s = ss.insertSheet(TTAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, THEAD.length).setValues([THEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(3, 240); s.setColumnWidth(10, 220);
  }
  baslikTamamla_(s, THEAD);
  return s;
}

function addMonths_(y, m, d, i) {
  const t = new Date(y, m - 1 + i, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d, last));
}

// Tek giriş -> taksit sayısı kadar satır. Kuruş farkı son taksite eklenir.
function addTaksit(e) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = tsheet_(), tz = ss_().getSpreadsheetTimeZone();
    const n = Math.max(1, Math.min(60, parseInt(e.adet, 10)));
    const total = Math.round(Number(e.toplam) * 100), base = Math.floor(total / n);
    const ana = 'P' + Utilities.getUuid().slice(0, 7), p = e.ilk.split('-').map(Number);
    const rows = [], items = [], kim = kim_();
    for (let i = 0; i < n; i++) {
      const amt = (i === n - 1 ? total - base * (n - 1) : base) / 100;
      const d = addMonths_(p[0], p[1], p[2], i), id = 'T' + Utilities.getUuid().slice(0, 8);
      rows.push([id, ana, e.aciklama, e.kategori, i + 1, n, amt, d, false, e.not || '', kim]);
      items.push({ id: id, ana: ana, aciklama: e.aciklama, kategori: e.kategori, no: i + 1, top: n, tutar: amt,
        tarih: Utilities.formatDate(d, tz, 'yyyy-MM-dd'), odendi: false, not: e.not || '', ekleyen: kim, tk: 1 });
    }
    const r0 = lastRow_(s) + 1;
    setV_(s.getRange(r0, 1, n, 11), rows);
    s.getRange(r0, 7, n, 1).setNumberFormat('"₺"#,##0.00');
    s.getRange(r0, 8, n, 1).setNumberFormat('dd.mm.yyyy');
    s.getRange(r0, 9, n, 1).insertCheckboxes();
    return items;
  } finally { lock.releaseLock(); }
}

function updateTk(id, not, odendi) {
  guard_();
  const s = tsheet_(), r = findRow_(s, id);
  if (r < 0) throw new Error('Kayıt bulunamadı');
  setV_(s.getRange(r, 10), [[not || '']]);
  s.getRange(r, 9).insertCheckboxes().setValue(!!odendi);
  return true;
}

function deletePlan(ana) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = tsheet_(), n = lastRow_(s);
    if (n < 2) return true;
    const a = s.getRange(2, 2, n - 1, 1).getValues();
    for (let i = a.length - 1; i >= 0; i--) if (String(a[i][0]) === String(ana)) s.deleteRow(i + 2);
    return true;
  } finally { lock.releaseLock(); }
}

// Silinen taksit planını aynı kimliklerle geri yazar (ödendi bilgisi korunur)
function geriYukleTaksit(items) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = tsheet_();
    if (!items.length || findRow_(s, items[0].id) > 0) return true;
    const rows = items.map(x => { const p = x.tarih.split('-'); return [x.id, x.ana, x.aciklama, x.kategori, x.no, x.top, x.tutar,
      new Date(+p[0], +p[1] - 1, +p[2]), !!x.odendi, x.not || '', x.ekleyen || '']; });
    const r0 = lastRow_(s) + 1, n = rows.length;
    setV_(s.getRange(r0, 1, n, 11), rows);
    s.getRange(r0, 7, n, 1).setNumberFormat('"₺"#,##0.00');
    s.getRange(r0, 8, n, 1).setNumberFormat('dd.mm.yyyy');
    s.getRange(r0, 9, n, 1).insertCheckboxes();
    rows.forEach((r, i) => s.getRange(r0 + i, 9).setValue(r[8]));
    return true;
  } finally { lock.releaseLock(); }
}
