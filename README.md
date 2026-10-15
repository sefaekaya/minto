# Minto

**Minto**, Google Apps Script web uygulamasıdır. Veriler bir Google Sheet'te tutulur, arayüz mobil uyumludur (Türkçe, TL).

**Özellikler:** Giderler, Gelirler, Taksitler, Tekrarlayan giderler, Abonelikler, Etkinlikler (grup bütçeli, döviz özetli), Analiz, önceki ayla karşılaştırma, döviz (USD/EUR) çevirisi (TCMB kuru), karanlık/açık tema, erişim kontrolü, aylık yedek, silmeyi geri alma, "kim ekledi" bilgisi, Liquid Glass arayüz.

## Dosya yapısı

| Dosya | Görev |
|---|---|
| `Code.gs` | `doGet`, erişim kontrolü, Sheet yardımcıları, `getAll`, kategoriler |
| `Variables.gs` | Sabitler: sekme adları, başlıklar, para birimleri, varsayılan kategori listeleri |
| `Giderler.gs` `Gelirler.gs` `Taksitler.gs` `Tekrarlayan.gs` `Abonelikler.gs` `Etkinlikler.gs` | Modül başına CRUD |
| `Doviz.gs` | TCMB kuru (yedek: open.er-api) ve TL'ye çevirme |
| `Yedek.gs` | Aylık otomatik yedek (zaman tetikleyicisi) |
| `Kurulum.ornek.gs` | Kişisel ayarlar için örnek (gerçek `Kurulum.gs` git'e eklenmez) |
| `Index.html` `Stylesheet.html` `JavaScript.html` `Yetkisiz.html` | Arayüz |

## Kurulum

1. [script.google.com](https://script.google.com) üzerinde yeni proje aç, bu repodaki tüm dosyaları ekle (`Kurulum.ornek.gs` hariç).
2. `Kurulum.ornek.gs` içeriğini `Kurulum.gs` adıyla ekle; Google Sheet ID'ni ve kullanıcı e-postalarını yaz.
3. `kurulum` fonksiyonunu bir kez çalıştır ve izinleri onayla. Ayarlar kodun dışında (Komut Dosyası Özellikleri) saklanır.
4. Dağıt → Yeni dağıtım → Web uygulaması. "Yürütme: Uygulamaya erişen kullanıcı" seçeneğini kullan; Sheet'i kullanıcılarla paylaş.
5. İsteğe bağlı: aylık yedek için `yedekZamanla` fonksiyonunu bir kez çalıştır.

Sekmeler (Giderler, Gelirler, Kategoriler, Etkinlikler vb.) ilk açılışta otomatik oluşturulur.

## Güncelleme

Dosyaları Apps Script'e yapıştır (ya da `clasp push`, bkz. [CLASP.md](CLASP.md)), sonra Dağıt → Dağıtımları yönet → Düzenle → Yeni sürüm.

## Kişisel veri

Sheet ID ve e-postalar repoda tutulmaz; `Kurulum.gs` `.gitignore` içindedir. Varsayılan kategori adları genel örneklerdir, Sheet'teki `Kategoriler` sekmesinden değiştirilir.
