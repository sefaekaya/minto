// Etkinlikler sekmesi: etkinlik grupları (tatil, taşınma...) ve gruplara ait giderler
// Etkinlik giderleri ayrı sekmede tutulur; ana Giderler ekranını, aylık toplamları ve Analiz'i etkilemez.
// Para birimi / kur mantığı mevcut dovizDonustur_ (Doviz.gs) ile ortaktır; dstr_ Abonelikler.gs'den gelir.
function esheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(ETAB);
  if (!s) s = ss.insertSheet(ETAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, EHEAD.length).setValues([EHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(2, 220); s.setColumnWidth(7, 220);
  }
  baslikTamamla_(s, EHEAD);
  return s;
}

function egsheet_() {
  const ss = ss_();
  let s = ss.getSheetByName(EGTAB);
  if (!s) s = ss.insertSheet(EGTAB);
  if (s.getRange('A1').getValue() !== 'ID') {
    s.getRange(1, 1, 1, EGHEAD.length).setValues([EGHEAD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.setFrozenRows(1); s.setColumnWidth(5, 240); s.setColumnWidth(10, 220);
  }
  baslikTamamla_(s, EGHEAD);
  return s;
}

function etkObj_(r, tz) {
  return { id: String(r[0]), ad: txt_(r[1]), baslangic: dstr_(r[2], tz), bitis: dstr_(r[3], tz), butce: Number(r[4]) || 0,
    aktif: r[5] === true, not: txt_(r[6]), ekleyen: r[7] || '' };
}

function egObj_(r, tz) {
  return { id: String(r[0]), eid: String(r[1]), tarih: dstr_(r[2], tz), kategori: txt_(r[3]), aciklama: txt_(r[4]), tutar: Number(r[5]) || 0,
    para: String(r[6] || ANA_PARA), doviz: Number(r[7]) || 0, kur: Number(r[8]) || 0, not: txt_(r[9]), ekleyen: r[10] || '' };
}

function getEtkinlikler() {
  guard_();
  const tz = ss_().getSpreadsheetTimeZone();
  return { items: rows_(esheet_(), 8).map(r => etkObj_(r, tz)), giderler: rows_(egsheet_(), 11).filter(r => r[2] instanceof Date).map(r => egObj_(r, tz)) };
}

function tarihDate_(s) { if (!s) return ''; const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
const TARIH_RE_ = /^\d{4}-\d{2}-\d{2}$/;

function etkKontrol_(e) {
  if (!String(e.ad || '').trim()) throw new Error('Etkinlik adı boş olamaz');
  if (!TARIH_RE_.test(String(e.baslangic || ''))) throw new Error('Başlangıç tarihi geçersiz');
  if (e.bitis && (!TARIH_RE_.test(String(e.bitis)) || e.bitis < e.baslangic)) throw new Error('Bitiş tarihi başlangıçtan önce olamaz');
  if (e.butce !== '' && e.butce != null && !(Number(e.butce) >= 0)) throw new Error('Bütçe geçersiz');
}

function writeEtk_(s, row, e, id, ekleyen) {
  setV_(s.getRange(row, 1, 1, 8), [[id, String(e.ad).trim(), tarihDate_(e.baslangic), tarihDate_(e.bitis),
    Number(e.butce) > 0 ? Number(e.butce) : '', e.aktif !== false, e.not || '', ekleyen || '']]);
  s.getRange(row, 3, 1, 2).setNumberFormat('dd.mm.yyyy');
  s.getRange(row, 5).setNumberFormat('"₺"#,##0.00');
  s.getRange(row, 6).insertCheckboxes().setValue(e.aktif !== false);
}

function etkItem_(e, id, ekleyen) {
  return { id: id, ad: String(e.ad).trim(), baslangic: e.baslangic, bitis: e.bitis || '', butce: Number(e.butce) > 0 ? Number(e.butce) : 0,
    aktif: e.aktif !== false, not: e.not || '', ekleyen: ekleyen || '' };
}

function addEtkinlik(e) {
  guard_(); etkKontrol_(e);
  const kim = kim_(), lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = esheet_(), id = 'E' + Utilities.getUuid().slice(0, 7);
    writeEtk_(s, lastRow_(s) + 1, e, id, kim);
    return etkItem_(e, id, kim);
  } finally { lock.releaseLock(); }
}

function updateEtkinlik(e) {
  guard_(); etkKontrol_(e);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = esheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    const kim = s.getRange(r, 8).getValue() || '';
    writeEtk_(s, r, e, e.id, kim);
    return etkItem_(e, e.id, kim);
  } finally { lock.releaseLock(); }
}

// Etkinliği ve giderlerini siler (geri alma için istemci kayıtları saklar)
function deleteEtkinlik(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = esheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    const gs = egsheet_(), n = lastRow_(gs);
    if (n >= 2) {
      const a = gs.getRange(2, 2, n - 1, 1).getValues();
      for (let i = a.length - 1; i >= 0; i--) if (String(a[i][0]) === String(id)) gs.deleteRow(i + 2);
    }
    return true;
  } finally { lock.releaseLock(); }
}

function writeEG_(s, row, x, id) {
  const fx = x.para && x.para !== ANA_PARA;
  setV_(s.getRange(row, 1, 1, 11), [[id, x.eid, tarihDate_(x.tarih), x.kategori || '', x.aciklama || '', Number(x.tutar) || 0,
    x.para || ANA_PARA, fx ? Number(x.doviz) || 0 : '', fx ? Number(x.kur) || 0 : '', x.not || '', x.ekleyen || '']]);
  s.getRange(row, 3).setNumberFormat('dd.mm.yyyy');
  s.getRange(row, 6).setNumberFormat('"₺"#,##0.00');
  s.getRange(row, 8).setNumberFormat('#,##0.00'); s.getRange(row, 9).setNumberFormat('0.0000');
}

function egKontrol_(e) {
  if (!TARIH_RE_.test(String(e.tarih || ''))) throw new Error('Tarih geçersiz');
  if (!(Number(e.tutar) > 0)) throw new Error('Geçerli bir tutar girin');
}

// Gider eklerken para birimi döviz ise güncel kurla TL'ye çevrilir (diğer gider ekranıyla aynı dovizDonustur_)
function addEtkinlikGider(e) {
  guard_(); egKontrol_(e);
  if (findRow_(esheet_(), e.eid) < 0) throw new Error('Etkinlik bulunamadı');
  const dv = dovizDonustur_(e.para, e.tutar, e.aciklama), kim = kim_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = egsheet_(), id = 'X' + Utilities.getUuid().slice(0, 8);
    const x = { id: id, eid: e.eid, tarih: e.tarih, kategori: e.kategori || '', aciklama: dv.aciklama, tutar: dv.tutar, para: dv.para,
      doviz: dv.doviz, kur: dv.kur === 1 ? 0 : dv.kur, not: e.not || '', ekleyen: kim };
    writeEG_(s, lastRow_(s) + 1, x, id);
    return Object.assign({}, x, { kurBilgi: dv.bilgi });
  } finally { lock.releaseLock(); }
}

// Döviz kayıtlarında tutar/kur değişmez (geçmiş kur korunur); TL kayıtlarda tutar düzenlenebilir.
function updateEtkinlikGider(e) {
  guard_(); egKontrol_(e);
  const tz = ss_().getSpreadsheetTimeZone(), lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = egsheet_(), r = findRow_(s, e.id);
    if (r < 0) throw new Error('Kayıt bulunamadı');
    const old = egObj_(s.getRange(r, 1, 1, 11).getValues()[0], tz), fx = old.para !== ANA_PARA;
    const x = { id: old.id, eid: old.eid, tarih: e.tarih, kategori: e.kategori || '', aciklama: e.aciklama || '',
      tutar: fx ? old.tutar : Number(e.tutar), para: old.para, doviz: old.doviz, kur: old.kur, not: e.not || '', ekleyen: old.ekleyen };
    writeEG_(s, r, x, x.id);
    return x;
  } finally { lock.releaseLock(); }
}

function deleteEtkinlikGider(id) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = egsheet_(), r = findRow_(s, id);
    if (r > 0) s.deleteRow(r);
    return true;
  } finally { lock.releaseLock(); }
}

function geriYukleEtkinlikGider(x) {
  guard_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = egsheet_();
    if (findRow_(s, x.id) > 0) return true;
    writeEG_(s, lastRow_(s) + 1, x, x.id);
    return true;
  } finally { lock.releaseLock(); }
}

function geriYukleEtkinlik(p) {
  guard_();
  const e = p.item, lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const s = esheet_();
    if (findRow_(s, e.id) > 0) return true;
    writeEtk_(s, lastRow_(s) + 1, e, e.id, e.ekleyen || '');
    const gs = egsheet_();
    (p.giderler || []).forEach(x => writeEG_(gs, lastRow_(gs) + 1, x, x.id));
    return true;
  } finally { lock.releaseLock(); }
}
