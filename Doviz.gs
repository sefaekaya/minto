// Döviz kategorileri: kur alma ve TL'ye çevirme
// Gider formundaki para birimi listesi: ana para birimi + Variables'taki dövizler
function getParaBirimleri() { guard_(); return [ANA_PARA].concat(DOVIZ_LISTESI.filter(p => p !== ANA_PARA)); }

// Önizleme için güncel kur
function getKur(code) {
  guard_();
  if (DOVIZ_LISTESI.indexOf(code) < 0) throw new Error('Desteklenmeyen döviz');
  return kurAl_(code);
}

function kurTcmb_(code) {
  const r = UrlFetchApp.fetch(KUR_TCMB_URL, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const root = XmlService.parse(r.getContentText()).getRootElement(), cs = root.getChildren('Currency');
  for (let i = 0; i < cs.length; i++) {
    if (cs[i].getAttribute('CurrencyCode').getValue() === code) {
      const v = Number(cs[i].getChildText('ForexSelling')) || Number(cs[i].getChildText('ForexBuying'));
      const t = root.getAttribute('Tarih');
      if (v > 0) return { kur: v, kaynak: 'TCMB' + (t ? ' ' + t.getValue() : '') };
    }
  }
  return null;
}

function kurYedek_(code) {
  const r = UrlFetchApp.fetch(KUR_YEDEK_URL + code, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const v = Number(((JSON.parse(r.getContentText()) || {}).rates || {}).TRY);
  return v > 0 ? { kur: v, kaynak: 'open.er-api' } : null;
}

// Güncel kur (10 dakika önbellek). Alınamazsa hata verir: yanlış tutar yazılmasın.
function kurAl_(code) {
  const cache = CacheService.getScriptCache(), ck = 'kur_' + code, hit = cache.get(ck);
  if (hit) return JSON.parse(hit);
  let res = null;
  try { res = kurTcmb_(code); } catch (err) {}
  if (!res) { try { res = kurYedek_(code); } catch (err) {} }
  if (!res) throw new Error('Döviz kuru alınamadı, lütfen tekrar deneyin');
  res.kur = Math.round(res.kur * 10000) / 10000;
  cache.put(ck, JSON.stringify(res), 600);
  return res;
}

function fmtTR_(n, d) {
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}

// Para birimi döviz ise: tutar TL'ye çevrilir, açıklamaya "[100,00 EUR × 38,5123]" eklenir. TL ise olduğu gibi döner.
function dovizDonustur_(para, tutar, aciklama) {
  const code = String(para || ANA_PARA).toUpperCase(), t = Number(tutar) || 0;
  if (code === ANA_PARA) return { tutar: t, aciklama: aciklama || '', bilgi: '', para: ANA_PARA, doviz: 0, kur: 1 };
  if (DOVIZ_LISTESI.indexOf(code) < 0) throw new Error('Desteklenmeyen para birimi');
  const k = kurAl_(code), tl = Math.round(t * k.kur * 100) / 100;
  const info = fmtTR_(t, 2) + ' ' + code + ' × ' + fmtTR_(k.kur, 4);
  return { tutar: tl, aciklama: ((aciklama || '') + ' [' + info + ']').trim(), bilgi: info + ' = ₺' + fmtTR_(tl, 2), para: code, doviz: t, kur: k.kur };
}
