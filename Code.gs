// Gider Takip – giriş noktası ve ortak yardımcılar
function include(f) {
  return HtmlService.createHtmlOutputFromFile(f).getContent();
}

function doGet() {
  if (kurulumEksik_() || !yetkili_()) {
    const t = HtmlService.createTemplateFromFile('Yetkisiz');
    t.mail = mail_();
    t.eksik = kurulumEksik_();
    return t.evaluate().setTitle('Erişim yetkisi yok')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Giderlerim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Kişisel ayarlar Komut Dosyası Özellikleri'nde durur (Kurulum.gs ile kaydedilir); kod güncellenince silinmez.
function ayar_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function sheetId_() { return ayar_('SHEET_ID'); }
function kullanicilar_() {
  try { const o = JSON.parse(ayar_('KULLANICILAR') || '{}'); return o && typeof o === 'object' ? o : {}; } catch (err) { return {}; }
}
function kurulumEksik_() { return !sheetId_() || (ERISIM_KONTROLU && Object.keys(kullanicilar_()).length === 0); }

function ss_() {
  const id = sheetId_();
  if (!id) throw new Error('KURULUM: SHEET_ID ayarlanmamış (Kurulum.gs > kurulum)');
  return SpreadsheetApp.openById(id);
}

// Eksik başlık hücrelerini tamamlar (eski sekmelere yeni sütun eklenirken)
function baslikTamamla_(s, heads) {
  const cur = s.getRange(1, 1, 1, heads.length).getValues()[0];
  heads.forEach((h, i) => { if (!cur[i]) s.getRange(1, i + 1).setValue(h).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff'); });
}

// Metin alanları: Sheets "14.10" gibi girişleri tarih/sayıya çevirmesin diye yazılan metin hücreleri düz metin biçimine alınır.
function setV_(rng, vals) {
  const sh = rng.getSheet(), r0 = rng.getRow(), c0 = rng.getColumn();
  vals.forEach((row, i) => row.forEach((v, j) => { if (typeof v === 'string' && v !== '') sh.getRange(r0 + i, c0 + j).setNumberFormat('@'); }));
  return rng.setValues(vals);
}
// Okurken: daha önce tarihe/sayıya dönüşmüş metin hücreleri istemciye Date olarak gitmesin (aksi halde liste boş/hatalı gelir).
function txt_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd.MM');
  return v === null || v === undefined ? '' : String(v);
}

function lastRow_(s) {
  const a = s.getRange('A1:A').getValues();
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i][0] !== '') n = i + 1;
  return n;
}

function findRow_(s, id) {
  const n = lastRow_(s);
  if (n < 2) return -1;
  const a = s.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < a.length; i++) if (String(a[i][0]) === String(id)) return i + 2;
  return -1;
}

function rows_(s, w) {
  const n = lastRow_(s);
  if (n < 2) return [];
  return s.getRange(2, 1, n - 1, w).getValues().filter(r => r[0] !== '');
}

// Giderler + taksitler tek listede döner (taksitler tk:1 ile işaretli)
function getAll() {
  guard_();
  try { uret_(); } catch (err) {}  // tekrarlayan giderleri bu ay için oluştur
  const tz = ss_().getSpreadsheetTimeZone();
  const out = rows_(sheet_(), 10).filter(r => r[1] instanceof Date).map(r => toItem_(r, tz));
  rows_(tsheet_(), 11).forEach(r => {
    if (r[7] instanceof Date) out.push({ id: String(r[0]), ana: String(r[1]), aciklama: txt_(r[2]), kategori: txt_(r[3]), no: r[4], top: r[5],
      tutar: Number(r[6]) || 0, tarih: Utilities.formatDate(r[7], tz, 'yyyy-MM-dd'), odendi: r[8] === true, not: txt_(r[9]), ekleyen: r[10] || '', tk: 1 });
  });
  return out;
}

// Kategoriler sekmesi: A = gider kategorileri, B = taksit kategorileri, C = gelir kaynakları.
// A2/B2/C2'den aşağı her satır bir seçenektir. Eklemek/çıkarmak için tabloyu düzenlemek yeterli.
function getCategories() {
  guard_();
  const ss = ss_(), defs = [AYLIK_KALEMLER, TAKSIT_KATEGORILERI, GELIR_KAYNAKLARI, ETKINLIK_KATEGORILERI];
  const HD = ['Gider Kategorisi', 'Taksit Kategorisi', 'Gelir Kaynağı', 'Etkinlik Kategorisi'];
  let s = ss.getSheetByName(KTAB), cols = defs;
  if (!s) s = ss.insertSheet(KTAB);
  const a1 = s.getRange('A1').getValue();
  if (a1 === ESKI_KAT_BASLIK) s.getRange('A1').setValue(HD[0]);  // yalnızca başlığı güncelle, listeye dokunma
  else if (a1 !== HD[0]) {
    // Eski düzen (tek sütun): eski liste taksit kategorisi olarak korunur
    const old = a1 === 'Kategori' ? s.getRange(2, 1, Math.max(s.getMaxRows() - 1, 1), 1).getValues().map(r => String(r[0]).trim()).filter(String) : [];
    cols = [AYLIK_KALEMLER, old.length ? old : TAKSIT_KATEGORILERI, GELIR_KAYNAKLARI, ETKINLIK_KATEGORILERI];
    s.clear();
    s.getRange(1, 1, 1, HD.length).setValues([HD]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    cols.forEach((l, i) => s.getRange(2, i + 1, l.length, 1).setValues(l.map(k => [k])));
    s.setColumnWidths(1, HD.length, 190); s.setFrozenRows(1);
  }
  if (!s.getRange(1, 4).getValue()) {  // mevcut 3 sütunlu sekmeye Etkinlik Kategorisi sütunu ekle (diğer sütunlara dokunma)
    s.getRange(1, 4).setValue(HD[3]).setFontWeight('bold').setBackground(BASLIK_RENK).setFontColor('#fff');
    s.getRange(2, 4, defs[3].length, 1).setValues(defs[3].map(k => [k]));
    s.setColumnWidth(4, 190);
  }
  const rows = Math.max(s.getMaxRows() - 1, 1);
  return [1, 2, 3, 4].map((n, i) => {
    const l = s.getRange(2, n, rows, 1).getValues().map(r => String(r[0]).trim()).filter((k, j, a) => k && a.indexOf(k) === j);
    return l.length ? l : defs[i];
  });
}

// Giriş yapan kullanıcı ve yetki kontrolü (e-posta yalnızca "uygulamayı kullanan kullanıcı olarak çalıştır" modunda gelir)
function mail_() { return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); }

function yetkili_() {
  if (!ERISIM_KONTROLU) return true;
  const m = mail_();
  return !!m && Object.keys(kullanicilar_()).some(k => String(k).trim().toLowerCase() === m);
}

// Her sunucu fonksiyonunun başında çağrılır: yetkisiz isteği veriye ulaşmadan durdurur
function guard_() { if (!yetkili_()) throw new Error('YETKISIZ'); }

function getUser() {
  const mail = mail_();
  let ad = '';
  const ku = kullanicilar_();
  Object.keys(ku).forEach(k => { if (String(k).trim().toLowerCase() === mail) ad = ku[k]; });
  return { email: mail, ad: ad, yetkili: yetkili_() };
}

// Kaydı kimin eklediği: tanımlı ad, yoksa e-posta
function kim_() { const u = getUser(); return u.ad || u.email || ''; }
