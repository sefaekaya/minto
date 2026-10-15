// Yedek: tablonun tamamını Drive'a tarih damgalı kopya olarak alır.
// Aylık otomatik yedek için editörden BİR KEZ "yedekZamanla" fonksiyonunu çalıştır (her ayın 1'i, 03:00).
// Kopyalar Drive'ında "Gider Takip Yedek ..." adıyla görünür; eskileri zaman zaman elle silebilirsin.
function yedekAl() {
  const m = mail_();
  if (m && !yetkili_()) throw new Error('YETKISIZ');  // tetikleyici bağlamında e-posta boş olabilir
  const ss = ss_(), ad = YEDEK_AD + ' ' + Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm');
  const kopya = ss.copy(ad);
  Logger.log('Yedek alındı: ' + kopya.getUrl());
  return kopya.getUrl();
}

// Aylık tetikleyiciyi kurar (tekrar çalıştırırsan eskisini silip yenisini kurar)
function yedekZamanla() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'yedekAl') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('yedekAl').timeBased().onMonthDay(1).atHour(3).create();
  Logger.log('Aylık yedek kuruldu: her ayın 1\'i 03:00');
}

// Aylık yedeği kapatır
function yedekDurdur() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'yedekAl') ScriptApp.deleteTrigger(t); });
  Logger.log('Aylık yedek kapatıldı');
}
