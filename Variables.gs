// Tüm sabitler burada: sekme adları, başlıklar ve varsayılanlar tek yerden değişir.
// Kişisel ayarlar (tablo ID'si, kullanıcı e-postaları) burada DEĞİL, Komut Dosyası Özellikleri'nde tutulur (bkz. Kurulum.gs);
// böylece bu dosyayı güncellemek ayarlarını silmez.

// Sekme adları ve başlık satırları
const TAB = 'Giderler';
const ESKI_TAB = 'Harcamalar';  // eski sekme adı: varsa otomatik olarak TAB adına çevrilir
const ESKI_KAT_BASLIK = 'Harcama Kategorisi';  // eski başlık: varsa otomatik güncellenir
const HEAD = ['ID', 'Tarih', 'Ay', 'Kategori', 'Açıklama', 'Tutar', 'Ödendi Mi', 'Not', 'Tekrar ID', 'Ekleyen'];
const TTAB = 'Taksitler';
const THEAD = ['ID', 'Ana İşlem ID', 'Açıklama', 'Kategori', 'Taksit No', 'Toplam Taksit', 'Taksit Tutarı', 'Vade Tarihi', 'Ödendi Mi', 'Not', 'Ekleyen'];
const KTAB = 'Kategoriler';

// Tekrarlayan giderler sekmesi
const RTAB = 'Tekrarlayanlar';
const RHEAD = ['ID', 'Açıklama', 'Kategori', 'Tutar', 'Gün', 'Başlangıç Ay', 'Bitiş Ay', 'Aktif', 'Not', 'Son Üretilen', 'Para Birimi', 'Ekleyen'];

// Gelirler sekmesi
const GTAB = 'Gelirler';
const GHEAD = ['ID', 'Tarih', 'Ay', 'Kaynak', 'Açıklama', 'Tutar', 'Not', 'Ekleyen'];

// Abonelikler sekmesi (dijital platformlar) ve fiyat geçmişi sekmesi
const ATAB = 'Abonelikler';
const AHEAD = ['ID', 'Ad', 'Tutar', 'Para Birimi', 'Dönem', 'Sonraki Yenileme', 'Aktif', 'Not', 'Ekleyen'];
const AFTAB = 'Abonelik Fiyatları';
const AFHEAD = ['ID', 'Abonelik ID', 'Tarih', 'Eski Tutar', 'Yeni Tutar', 'Eski Para', 'Yeni Para'];

// Etkinlikler (Fransa Tatili, Taşınma...) ve etkinlik giderleri. Etkinlik giderleri ana Giderler ekranına YANSIMAZ.
const ETAB = 'Etkinlikler';
const EHEAD = ['ID', 'Ad', 'Başlangıç', 'Bitiş', 'Bütçe', 'Aktif', 'Not', 'Ekleyen'];
const EGTAB = 'Etkinlik Giderleri';
const EGHEAD = ['ID', 'Etkinlik ID', 'Tarih', 'Kategori', 'Açıklama', 'Tutar', 'Para Birimi', 'Döviz Tutar', 'Kur', 'Not', 'Ekleyen'];

// Kategoriler sekmesi ilk oluşturulurken kullanılan varsayılan listeler
// (sonradan tablodan düzenlenir: A = gider, B = taksit, C = gelir, D = etkinlik)
const AYLIK_KALEMLER = ['Kira', 'Aidat', 'Kredi Kartı 1', 'Kredi Kartı 2', 'Kredi Kartı 3', 'Kredi Kartı 4', 'Kredi', 'Diğer'];
const TAKSIT_KATEGORILERI = ['Kira', 'Faturalar', 'Market', 'Ulaşım', 'Restoran', 'Alışveriş', 'Eğlence', 'Sağlık', 'Abonelik', 'Borç / Kredi', 'Diğer'];
const GELIR_KAYNAKLARI = ['Kişi 1', 'Kişi 2', 'Maaş', 'Prim', 'Ek Gelir'];
const ETKINLIK_KATEGORILERI = ['Ulaşım', 'Konaklama', 'Yemek & İçecek', 'Alışveriş', 'Aktivite', 'Hizmet', 'Diğer'];

// Başlık satırı arka plan rengi
const BASLIK_RENK = '#12332F';

// Erişim yetkisi: true ise yalnızca Komut Dosyası Özellikleri'ndeki KULLANICILAR listesinde e-postası olan hesaplar uygulamayı kullanabilir.
const ERISIM_KONTROLU = true;

// Para birimleri: ana para birimi her zaman ilk ve varsayılan seçenektir.
// DOVIZ_LISTESI'ne eklenen kodlar (ör. 'GBP') gider formunda para birimi olarak çıkar; TCMB kur listesinde bulunan dövizler çalışır.
// Döviz seçilirse girilen tutar güncel kurla TL'ye çevrilir ve girilen döviz tutarı açıklamaya yazılır.
const ANA_PARA = 'TL';
const DOVIZ_LISTESI = ['USD', 'EUR'];
const KUR_TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';        // birincil kaynak (döviz satış)
const KUR_YEDEK_URL = 'https://open.er-api.com/v6/latest/';            // TCMB alınamazsa yedek

// Yedek: haftalık kopyalar bu adla Drive'a kaydedilir
const YEDEK_AD = 'Gider Takip Yedek';
