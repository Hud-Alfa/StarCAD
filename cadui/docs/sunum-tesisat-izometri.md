# StarCad — Tesisat & İzometri · Müşteri Sunumu (taslak v1)

Kapsam: yalnız `src/plumbing/` ve `src/isometric/` modülleri. Mimari çizim,
yönetici paneli, proje/poliçe süreçleri bu sunumun dışında.

---

## 01 · Kapak

**Boruyu çiz. İzometrik kendiliğinden gelsin.**

Doğal gaz iç tesisat · tarayıcıda CAD.

Bu sunum yalnız **tesisat** ve **izometri** modüllerini anlatır: gaz hattının
çizimi, cihazların bağlanması, kotun yönetimi ve izometrik paftanın otomatik
üretimi.

- Kapsam: tesisat çizimi + izometrik görünüm
- Kıyas: WebCAD, ZetaCAD
- Platform: tarayıcı, kurulum yok

---

## 02 · Bu sunumun kapsamı — iki modül, tek çizim verisi

| Modül | İçerik |
|---|---|
| **Tesisat** | Gaz borusu, branşman, baca/havalandırma güzergâhları; vana, sayaç, regülatör, filtre ve yakıcı cihazlar; kot yönetimi, ölçüler, metraj, hata kontrolü |
| **İzometri** | Çizimden otomatik üretilen, tüm katları tek parça gösteren izometrik şema; ekranda döndürülebilir, kâğıtta gaz paftası standardında |

> **Konuşmacı notu:** İkisi ayrı ürün değil — izometri çizimin türevi. Tesisatta
> bir boruyu uzatınca izometriyi kimse güncellemiyor; zaten güncel.

---

## 03 · Tesisat · çizim — her tık kendi borusunu yazar

- **Boru boru düzenlenebilir.** Bir jestin tamamı tek bir dev polyline değil; iki
  tık arası bir boru. Her boru tek başına seçilir, silinir, kendi çapını alır ve
  kendi `Ctrl+Z` adımıdır.
- **Köşeler bağlı kalır.** Ardışık borular ortak köşede birbirine tutunur —
  köşeyi sürüklerseniz ikisi birden gelir, ağ kopmaz.
- **Yakalama önceliği belli:** boş port → mevcut boru → duvar ekseni → ızgara.
  `Ctrl` ızgarayı kapatır ama bağlantı yakalamasını kapatmaz; bağlanmak, serbest
  konumlandırmadan güçlü bir niyettir.
- **Duvara yakınken hizalı, uzakta serbest.** Boru duvara yaklaştığında ona
  paralel/dik gider; uzakta çapraz dahil serbesttir. Duvarın gövdesi ve köşesi
  yasaklı alan — boru duvarla üst üste binmez.
- **Mevcut boruya bağlanmak onu ayırır.** Var olan bir hattın üstüne bağlanınca
  hat orada ikiye bölünür; parçaların kimlikleri korunur, ona bağlı sayaç ve
  vanalar sahipsiz kalmaz.

> **Konuşmacı notu:** Demoda göstereceğimiz an — yanlış bir adım atıp tek
> `Ctrl+Z` ile yalnız o adımı geri almak. Klasik polyline mantığında tüm zincir
> gider.

---

## 04 · Tesisat · sayısal giriş — fare ile çiz, klavye ile ölçülendir

Projeci hattı gözle değil sayıyla kurar. Çizim sürerken tek tuş ekseni kilitler,
tek kutu ölçüyü ister.

| Tuş | Ne yapar |
|---|---|
| `←` `↑` `→` `↓` | Ekseni kilitler, o eksende adımın uzunluğunu (cm) sorar |
| `+` / `−` | Kot yönünü kilitler; kutu mutlak yükseklik değil **fark** ister |
| `Enter` | Boruyu yazar. Tuş tek başına çizmez; yazılan sayı kesindir, yakalama araya girip ölçüyü bozmaz |
| `Esc` | Kutuyu kapatır; çizim devam eder, yazılmış adımlar silinmez |

Fare ve klavye aynı tek yazım yolundan geçer — iki ayrı kod yolu olsaydı biri er
geç kotu ya da çapı unuturdu. Ekranda yukarı her zaman plan +Y'dir.

> **Konuşmacı notu:** "Ölçüyü tutturmak için zoom yapıp nişan almak" yok. 240
> yaz, Enter.

---

## 05 · Tesisat · kot (Z) — kot verirsiniz, kat kendiliğinden değişir

- **Kolon diye ayrı bir nesne yok.** Yükseklik borunun kendi başlangıç/bitiş
  kotu. Model sade kalıyor, buna rağmen saf dikey bağlantı da mümkün.
- **Kat tavanını aşan kot üst kata taşar.** Kalan miktar yeni katta devam eder,
  gerekiyorsa kat otomatik açılır. Aşağı yönde de aynısı geçerli — inerken yeni
  kata tavanından girilir.
- **Katlar arası bağ kilitli.** Kata bağlanmış boru uçları sürüklemeyle
  koparılamaz; kot yalnız panelden ya da sayısal girişten değişir.
- **Kot ekranda okunur.** Yükseliş noktasında fark ve varılan kot birlikte
  yazılır (`▲0,75 m (+2,00)`), servis kutusunun altında çıkış kotu görünür.
  İşaret taşıyan tek yazı türü budur.
- **Dikey hareket işaretlenir.** Plan görünümü tepeden baktığı için düşey boru
  tek nokta gibi görünürdü; mor halka ve kompakt etiket onu görünür kılar —
  gösterge, komşu boru oynayınca da kaybolmaz.

> **Konuşmacı notu:** Burası WebCAD'in en zayıf tarafı — kot bilgisi çizimin
> içinde değil kafanızda duruyor. Bizde metraj bile gerçek 3B boru boyundan
> hesaplanıyor.

---

## 06 · Tesisat · elemanlar — eleman nereye takılacağını kendi bilir

Kullanıcı doğru noktayı nişan almaz; eleman türü nereye tutunacağını söyler.
Yanlış yerleştirme kabul edilmez, sessizce kaydırılmaz.

| Yapışma | Kimler | Davranış |
|---|---|---|
| Boru üstünde | Vana, selenoid vana, regülatör, manometre, filtre kiti, süzme sayaç, izolasyon | Boruya oturur ve boruyu orada ayırır; armatür hattın bir düğümüdür |
| Boş uçta | Sayaç | Yalnız bağlantısız bir boru ucuna takılır, araya vanası kendiliğinden girer |
| En yakın uca | Ocak, kombi, kazan, şofben, soba, diğer yakıcı cihaz | En yakın açık boru ucuna kısa kolla bağlanır; kol kesikli ve kırmızı — boru değil, cihaz bağlantısı |
| Serbest | Servis kutusu, baca, havalandırma kanalı | Izgaraya oturur; servis kutusu ve sayaç konunca boru çizimi kendiliğinden başlar |

- **Bir porta ikinci bağlantı takılamaz.** Doluluk ayrı bir alanda tutulmaz,
  gerçek bağlantı kaydından okunur — geri alma ve yeniden yüklemeden sonra "dolu
  görünen boş port" olmaz.
- **Bağlı eleman da döndürülebilir.** Döndürme, elemanın tutunduğu noktayı sabit
  tutar: gövde döner, bağlantı yerinde kalır, boru kopmaz.

---

## 07 · Tesisat · baca ve havalandırma — ağız cihazın kenarında serbest

- **Sabit bağlantı noktası dayatmıyoruz.** Ağız, cihaz gövdesinin çevresinde
  imlece en yakın kenara oturur ve kenar boyunca kayar. Cihaz taşınınca ya da
  döndürülünce ağız kendiliğinden yerinde kalır.
- **Kural yönetmelikten, arayüzden değil.** Bir cihazda ya tek baca ya bir veya
  daha çok havalandırma bulunur; ikisi bir arada olmaz. Kural çizimin kendisinden
  denetlenir.
- Ağız kullanıcıya kanalın tam genişliğindeki ağız çizgisiyle gösterilir; dar
  gövdelerde pay hesaplanır.

> **Konuşmacı notu:** Semboldeki çizili tek bir bağlantı çıkıntısına mahkûm
> olmadığımız için, gerçek projedeki baca yönü ne ise o çizilebiliyor.

---

## 08 · Tesisat · düzenleme — değiştirmek, yeniden çizmekten kolay

Revizyon bu işin asıl maliyeti. Modülün büyük kısmı çizmeyi değil, çizilmişi
bozmadan değiştirmeyi hedefliyor.

- **Panel — "Boy (cm)" yazınca ağ rijit ötelenir.** Ucun ötesindeki her şey
  birlikte kayar; hat esnemez, açılar bozulmaz.
- **Sürükleme — köşe köşeye tam oturur.** Köşe sürüklemesi duvardan önce başka
  bir hat köşesine kilitlenir; bozulan bir kolon yeniden tam düşey olabilsin diye.
- **Toplu iş — çoklu seçim, pano, kat kopyalama.** Bir katın tesisatı
  kopyalanabilir; kopya tümüyle yeni kimlik alır, kaynak katla bağı kalmaz.
- **Silme — bağlı ne varsa önce söylenir.** Silme bir şeyi sessizce kopuk
  bırakmaz; zincirleme etki onay penceresinde gösterilir.
- **Ölçüm — ölçü aracı çizime girmez.** İki nokta arası ölçü alınır, kaydedilen
  dosyaya yazılmaz ve geri alma geçmişini kirletmez.
- **Geri alma — tesisatın kendi geçmişi.** Tesisatta yaptığınız işi geri almak
  mimari çizimi etkilemez.

---

## 09 · Tesisat · çıktı ve denetim — çizim, teslim edilecek belgeyi de üretir

- **Hata kontrolleri çizimin üstünde çalışır.** Kurallar ayrı bir kontrol listesi
  değil, projenin kendi verisinden denetlenir.
- **Cihaza bağlanmamış boru ucu uyarıdır, engel değil.** Çalışmayı durdurmaz —
  projeci akışını bozmadan eksiği görür.
- **Sayaç bazlı birim/cihaz dökümü.** Hangi cihazın hangi sayaca bağlı olduğu
  ayrı bir alanda tutulmaz, gerçek hat grafiğinden izlenir: marka, model,
  kapasite, m³/h ve baca tipi tabloya bu izden gelir.
- **Metraj gerçek 3B boru boyundan.** Kot farkı metrajın içindedir; plan
  uzunluğu üzerinden eksik hesap yapılmaz.
- **PDF ve proje dosyası.** Kat planı ve izometrik sayfaları basılır; proje
  dosyası PDF'in içine gömülü çizim verisiyle birlikte arşivlenir.

---

## 10 · İzometri — elle çizilen izometrik paftanın sonu

İzometrik görünüm çizimden otomatik üretilir. Aktif kat kavramı yoktur: bütün
bina tek parça, tek şemada.

- **Yalnız tesisat.** Mimari çizilmez — pafta gaz hattının şemasıdır, binanın
  perspektifi değil.
- **Türetilmiş, saklanmış değil.** Şema veriden hesaplanır; "izometriği
  güncellemeyi unutmak" diye bir durum yok.
- **Gerçek 30° izometri.** Üç eksen ekranda eşit kısalır, eksenler yatayla 30°
  yapar — projecinin alışık olduğu okunuş.

> **WebCAD farkı:** WebCAD'in varsayılanı 40°/60°, yani aslında bir dimetrik.
> Aynı izdüşüm ailesini kullanıyoruz ama açıyı klasik izometriye getirdik — ve
> kullanıcı isterse açıyı sürgüden değiştirip "Üstten" ön ayarına geçebiliyor.

---

## 11 · İzometri · etkileşim — otomatik ama sizin sözünüz geçiyor

Otomatik üretilen şemanın klasik derdi, üst üste binen dalları ayıramamaktır.
Burada düzeltebilirsiniz — hem de plan çizimini bozmadan.

- **Elle ayırma plana yazılmaz.** İzometriğe özel kaydırmalar ve etiket
  yerleşimleri ayrı alanlarda durur; kat planınız olduğu gibi kalır.
- **Köşe sürüklemesi borunun kendi eksenine kilitli.** Seçilen eksen hangi ucun
  sabit kalacağını da belirler; bağlı ağ o uçtan itibaren rijit gelir, şema
  dağılmaz.
- **Etiketler okunur kalır.** Ekranda künyeler nesnenin çevresinde halkaya
  dizilir, kâğıtta nesnenin yanına yazılır; künye gerektirmeyen armatürler iki
  tarafta da susar.
- **Kot değişen hatta yükseklik yazılır.** Hat başına tek etiket (`h = 2,75 m`) —
  segment segment tekrar edip paftayı kalabalıklaştırmaz.
- **Renk açıklaması çizimden türer.** Listede yalnız o projede gerçekten
  kullanılan çap ve hat türleri görünür, katalog sırasında.
- **Tıklanan hattın künyesi açılır**, tüketim süzgecinden bağımsız olarak.

---

## 12 · İzometri · kâğıt — ekran döner, kâğıt standardı korur

| | Davranış |
|---|---|
| **Ekranda** | Döndürülebilir izometri, gerçek ortografik kamera. Açıyı değiştirir, çakışan dalları farklı yönden okursunuz. |
| **Kâğıtta** | Sabit oblik izdüşüm: kot tam dikey, plan ekseni tam yatay, derinlik 30° eğik. Gerçek bir gaz paftası ve kat planları ölçülerek belirlendi — ekrandaki açı ne olursa olsun çıktı aynı standartta basılır. |

Bu ayrım bilinçli: paftada yatay segmentlerin yatay görünmesi izometrinin
geometrisiyle mümkün değil, oblik izdüşümle mümkün. Ekranın serbestliği yüzünden
çıktının standardından ödün vermiyoruz.

> **Konuşmacı notu:** Somut örnek — "Üstten" ön ayarında bakarken de PDF'iniz her
> zaman aynı, denetime giden formatta çıkar.

---

## 13 · Karşılaştırma — nerede farklılaşıyoruz

| Konu | Yaygın masaüstü çözümler | StarCad · tesisat & izometri |
|---|---|---|
| Kurulum | Kurulum, lisans, sürüm dağıtımı | Tarayıcıda açılır; ekip aynı sürümü kullanır |
| İzometrik açı | WebCAD varsayılanı 40°/60° dimetrik, sabit | Klasik 30° izometri; ekranda açı sürgüsü + "Üstten" ön ayarı |
| İzometrik düzeltme | Otomatik şema olduğu gibi kabul edilir | Dal ayırma ve etiket taşıma elle yapılır, plan çizimi bozulmaz |
| Kot | Kolon ayrı nesne / kot ayrı takip | Kot borunun kendi alanı; tavanı aşınca kat otomatik değişir |
| Sayısal çizim | Komut satırı alışkanlığı gerekir | Ok tuşu eksen kilidi + tek kutu; `+`/`−` ile kot farkı |
| Düzenleme birimi | Çok noktalı hat tek parça | Her boru ayrı nesne; ayrı çap, ayrı silme, ayrı geri alma |
| Baca / havalandırma ağzı | Sembolde sabit bağlantı noktası | Cihaz kenarında serbest kayan ağız, adet kuralı denetimli |
| Metraj | Plan uzunluğu esaslı | Gerçek 3B boru boyu; sayaç bazlı cihaz dökümü |
| Veri | Kapalı dosya formatı | WebCAD JSON ile uyumlu; sürüm geçmişi saklanır |

> ⚠️ **Sunumdan önce teyit:** ZetaCAD satırları için elimizde doğrulanmış
> karşılaştırma yok. Bu tablonun sol sütunu şu an "yaygın masaüstü çözümler"
> genellemesi — müşteri ZetaCAD kullanıyorsa toplantı öncesi sürüm bazında teyit
> edelim, yoksa iddia geri teper.

---

## 14 · Geçiş ve süreklilik — alıştığınız düzenle uyumlu

- **WebCAD JSON'u ile karşılıklı uyum.** Kalıcı kimlikler proje bazlı artan
  tamsayı — dosya gidip geri geldiğinde birebir aynı kalsın diye.
- **Çap renkleri aynı sınıflandırma.** Gaz hattının rengi çapından gelir;
  projecinin ekrandan okuduğu şey değişmiyor.
- **Sembol seti gerçek katalog.** Vana, selenoid vana, regülatör, manometre,
  filtre kiti, süzme sayaç, sayaç, izolasyon, servis kutusu, ocak, soba, şofben,
  kombi, kazan ve diğer yakıcı cihazlar.
- **Her kayıt yeni ve değişmez bir sürüm.** Kayıt geçmişinden eski sürüm açılır;
  kaydedilmemiş değişiklik varsa kullanıcı uyarılır.
- **Türkçe arayüz, tr-TR biçimlendirme.** Uzunluklar cm, açılar derece, kot metre
  olarak yazılır.

---

## 15 · Canlı demo akışı — yedi dakikada tam tur

| # | Süre | Adım |
|---|---|---|
| 01 | 60 sn | **Servis kutusu** — kutuyu koy, boru çizimi kendiliğinden başlasın |
| 02 | 90 sn | **Kolon** — `↑` ile 240 yaz, `+` ile kot ver, tavanı aşır: üst kata kendiliğinden çık |
| 03 | 60 sn | **Sayaç ve vana** — sayacı boş uca tak, arasına vananın kendiliğinden girişini göster |
| 04 | 60 sn | **Kombi** — cihazı bırak, kısa kolla bağlansın; bacayı gövde kenarında kaydır |
| 05 | 60 sn | **Revizyon** — panelden boy değiştir, ağın rijit ötelendiğini göster |
| 06 | 90 sn | **İzometri** — sekmeye geç, şema hazır; açıyı çevir, bir dalı ayır, plana dönüp bozulmadığını göster |
| 07 | 60 sn | **Çıktı** — hata kontrolü, metraj ve PDF |

> **Konuşmacı notu:** Demoyu tek projede, kesintisiz yapalım. Her adımda "bunu
> diğerinde nasıl yapıyordunuz?" diye sormak, tabloyu bizim yerimize müşteriye
> kurdurur.

---

## 16 · Kapanış — özetle

- **Çizmek hızlı:** sayısal giriş, akıllı yakalama, türünden bilen elemanlar.
- **Değiştirmek güvenli:** boru bazlı düzenleme, rijit öteleme, zincirleme etkiyi
  önden söyleyen silme.
- **Teslim etmek hazır:** otomatik izometri, standart pafta, 3B metraj, hata
  kontrolü.

### Sunum öncesi kapatılacak maddeler

1. ZetaCAD karşılaştırma satırlarının sürüm bazında doğrulanması.
2. Demo ortamında canlı hesapla giriş (kimlik bilgisi eksikti).
3. Bağlı eleman döndürmenin tarayıcıda görsel doğrulaması.
4. Hata kontrolü listesinde henüz yazılmayan iki kural (mahal tipi, topraklanma)
   — demoda o sekmeye girilecekse önden bilinsin.

---

Bu taslak yalnız tesisat ve izometri modüllerini kapsar; mimari çizim, yönetim
paneli, proje ve poliçe süreçleri ayrı bir sunumun konusu.
