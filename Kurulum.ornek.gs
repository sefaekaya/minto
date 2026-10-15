// KURULUM ÖRNEĞİ - Dosyayı 'Kurulum.gs' olarak kopyalayıp kendi bilgilerinle doldur (Kurulum.gs git'e eklenmez).
// KURULUM - BİR KEZ ÇALIŞTIRIP SİL.
// Kişisel ayarları "Komut Dosyası Özellikleri"ne kaydeder. Ayarlar kodun dışında durduğu için
// dosyaları güncelleyince silinmez. Çalıştırdıktan sonra bu dosyayı projeden silebilirsin.
//
// 1) Aşağıdaki e-postaları kendi Google hesaplarınla değiştir (küçük harfle yaz).
// 2) Üstteki fonksiyon listesinden "kurulum" seç, Çalıştır'a bas, izinleri onayla.
// 3) Günlüğün "Ayarlar kaydedildi" yazdığını kontrol et.
// (Alternatif: Proje Ayarları > Komut Dosyası Özellikleri > SHEET_ID ve KULLANICILAR ekle.)
function kurulum() {
  const kullanicilar = {
    'kisi1@example.com': 'Kişi 1',
    'kisi2@example.com': 'Kişi 2'
  };
  PropertiesService.getScriptProperties().setProperties({
    SHEET_ID: 'BURAYA_GOOGLE_SHEET_ID_YAZIN',
    KULLANICILAR: JSON.stringify(kullanicilar)
  });
  Logger.log('Ayarlar kaydedildi: ' + Object.keys(kullanicilar).join(', '));
}

// Kayıtlı ayarları görmek için çalıştır (günlüğe yazar).
function ayarlariGoster() {
  const p = PropertiesService.getScriptProperties();
  Logger.log('SHEET_ID: ' + p.getProperty('SHEET_ID'));
  Logger.log('KULLANICILAR: ' + p.getProperty('KULLANICILAR'));
}
