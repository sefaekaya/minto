# clasp ile GitHub ↔ Apps Script

`clasp`, Apps Script projesini komut satırından yönetir. Repo = tek doğru kaynak, `clasp push` = canlıya alma.

## Bir kerelik kurulum (kendi bilgisayarında)

1. Node.js (LTS) kur: https://nodejs.org
2. `npm install -g @google/clasp`
3. `clasp login` (tarayıcı açılır, Google hesabınla izin ver)
4. https://script.google.com/home/usersettings adresinde **Google Apps Script API**'yi aç.
5. Apps Script projende: Proje Ayarları → "appsscript.json bildirim dosyasını düzenleyicide göster" kutusunu işaretle, `appsscript.json` içeriğini kopyalayıp repo klasörüne `appsscript.json` olarak kaydet (zaman dilimi, web uygulaması ayarları orada durur; commit edebilirsin, kişisel veri içermez).
6. Aynı ayarlar sayfasındaki **Komut Dosyası Kimliği**ni (Script ID) kopyala ve repo klasöründe `.clasp.json` oluştur:
   ```json
   { "scriptId": "SCRIPT_ID_BURAYA", "rootDir": "." }
   ```
   (`.clasp.json` git'e eklenmez.)
7. Gerçek `Kurulum.gs` dosyanı (Sheet ID ve e-postalar) repo klasörüne koy; git yok sayar, ama `clasp push` onu da gönderir. Ayarları bir kez çalıştırıp sonra silmek istersen push'tan önce kaldır.

> **Dikkat:** `clasp clone` ya da `clasp pull` repodaki dosyaların üzerine canlı projenin (kişisel adlı) dosyalarını yazar. Bunları repo klasöründe değil, ayrı bir klasörde kullan.

## Günlük kullanım

```
git pull
# düzenle, test et
git add -A && git commit -m "..."
clasp push           # dosyaları Apps Script'e gönderir
clasp version "açıklama"
clasp deployments    # dağıtım ID'sini görmek için
clasp deploy -i DAĞITIM_ID -d "açıklama"   # mevcut web uygulaması adresini yeni sürüme taşır
```

`clasp push` uzaktaki projeyi yerel dosyalarla birebir eşitler: repoda olmayan uzak dosyalar silinir.
Varsayılan kategori adları anonimdir; canlı uygulama kategorileri Sheet'teki `Kategoriler` sekmesinden okur, bu yüzden etkilenmez.
