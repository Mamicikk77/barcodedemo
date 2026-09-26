/* Barcode Garden Belek — QR menü verisi
 * Fiyat, isim, görsel veya bağlantı değiştirmek için sadece bu dosyayı düzenleyin.
 * a: alerjen kodları (aşağıdaki ALLERGENS listesinden), k: porsiyon başına ortalama kalori (kcal).
 * Alerjen ve kalori değerleri tahminidir; mutfak tarifleriyle kontrol edilmelidir.
 */
window.CONFIG = {
  whatsapp: "905000000000",                 // TODO: başında + olmadan, ülke koduyla (ör. 905321234567)
  instagram: "https://instagram.com/",      // TODO: Instagram profil linki
  googleReview: "https://maps.google.com/", // TODO: Google Haritalar "yorum yaz" linki
  wifi: { ssid: "BarcodeGarden", password: "sifre1234" }, // TODO
  video: "assets/welcome.mp4",              // karşılama videosu (dosyayı bu isimle assets klasörüne koyun)
  defaultLang: "tr"
};

const T = (tr, en, ru) => ({ tr, en, ru });

window.UI = {
  tagline:     T("Belek'in kalbinde bahçe keyfi", "Garden vibes in the heart of Belek", "Атмосфера сада в сердце Белека"),
  viewMenu:    T("Menüyü Görüntüle", "View Menu", "Открыть меню"),
  whatsapp:    T("WhatsApp", "WhatsApp", "WhatsApp"),
  instagram:   T("Instagram", "Instagram", "Instagram"),
  review:      T("Değerlendir", "Rate Us", "Отзыв"),
  wifi:        T("Wi-Fi", "Wi-Fi", "Wi-Fi"),
  categories:  T("Kategoriler", "Categories", "Категории"),
  menu:        T("Menü", "Menu", "Меню"),
  search:      T("Ürün ara…", "Search the menu…", "Поиск по меню…"),
  searchBtn:   T("Ara", "Search", "Поиск"),
  noResults:   T("Sonuç bulunamadı", "No results found", "Ничего не найдено"),
  items:       T("ürün", "items", "поз."),
  kcal:        T("kcal", "kcal", "ккал"),
  avgKcal:     T("Ortalama kalori", "Average calories", "Средняя калорийность"),
  allergens:   T("Alerjenler", "Allergens", "Аллергены"),
  noAllergens: T("Bilinen alerjen içermez", "No known allergens", "Без известных аллергенов"),
  na:          T("—", "—", "—"),
  disclaimer:  T("Alerjen ve kalori bilgileri ortalama değerlerdir. Alerjiniz varsa lütfen sipariş vermeden önce personelimize danışın.",
                 "Allergen and calorie information are average values. If you have an allergy, please inform our staff before ordering.",
                 "Данные об аллергенах и калорийности являются средними. При наличии аллергии сообщите, пожалуйста, персоналу перед заказом."),
  wifiTitle:   T("Wi-Fi Bağlantısı", "Wi-Fi Connection", "Подключение к Wi-Fi"),
  network:     T("Ağ adı", "Network", "Сеть"),
  password:    T("Şifre", "Password", "Пароль"),
  copy:        T("Kopyala", "Copy", "Копировать"),
  copied:      T("Kopyalandı", "Copied", "Скопировано"),
  back:        T("Geri", "Back", "Назад"),
  close:       T("Kapat", "Close", "Закрыть"),
  language:    T("Dil", "Language", "Язык"),
  skip:        T("Menüye geç", "Skip to menu", "Перейти к меню")
};

window.ALLERGENS = {
  gluten:      T("Gluten", "Gluten", "Глютен"),
  crustaceans: T("Kabuklu deniz ürünü", "Crustaceans", "Ракообразные"),
  eggs:        T("Yumurta", "Eggs", "Яйца"),
  fish:        T("Balık", "Fish", "Рыба"),
  peanuts:     T("Yer fıstığı", "Peanuts", "Арахис"),
  soy:         T("Soya", "Soy", "Соя"),
  milk:        T("Süt", "Milk", "Молоко"),
  nuts:        T("Sert kabuklu yemiş", "Tree nuts", "Орехи"),
  celery:      T("Kereviz", "Celery", "Сельдерей"),
  mustard:     T("Hardal", "Mustard", "Горчица"),
  sesame:      T("Susam", "Sesame", "Кунжут"),
  sulphites:   T("Sülfit", "Sulphites", "Сульфиты")
};

const I = f => "img/" + f + ".jpg";
const it = (n, p, img, a, k, d) => ({ n, p, img: I(img), a, k, d });

/* Sert içkiler: aynı görseli paylaşan boy/ölçü seçenekleri */
const V = {
  set35:  T("35 cl Set", "35 cl Set", "Сет 35 cl"),
  set70:  T("70 cl Set", "70 cl Set", "Сет 70 cl"),
  single: T("Tek", "Single", "Одинарный"),
  double: T("Double", "Double", "Двойной")
};
const spirit = (brand, img, rows) => rows.map(([v, p, k, a]) =>
  it(T(`${brand} · ${V[v].tr}`, `${brand} · ${V[v].en}`, `${brand} · ${V[v].ru}`), p, img, a || [], k));
const K40 = { set35: 780, set70: 1560, single: 110, double: 220 };
const std = (brand, img, prices) =>
  spirit(brand, img, Object.entries(prices).map(([v, p]) => [v, p, K40[v]]));

const wine = (kind, img) => {
  const b = T("Şişe", "Bottle", "Бутылка"), g = T("Kadeh", "Glass", "Бокал");
  const kc = { bottle: 620, glass: 125 };
  const mk = (pre, x, p, k) => it(T(`${kind.tr} · ${pre.tr}${x.tr}`, `${kind.en} · ${pre.en}${x.en}`, `${kind.ru} · ${pre.ru}${x.ru}`), p, img, ["sulphites"], k);
  const prem = T("Premium ", "Premium ", "Премиум "), none = T("", "", "");
  return [mk(prem, b, "3.500 TL", kc.bottle), mk(prem, g, "450 TL", kc.glass),
          mk(none, b, "3.000 TL", kc.bottle), mk(none, g, "350 TL", kc.glass)];
};

window.MENU = [
  { id: "salads", name: T("Salatalar", "Salads", "Салаты"), cover: I("002-ceasar-salad-sezar-salata"), items: [
    it(T("Ton Balıklı Salata", "Tuna Salad", "Салат с тунцом"), "380 TL", "001-tuna-salad-ton-balikli-salata", ["fish", "eggs", "mustard"], 380),
    it(T("Sezar Salata", "Caesar Salad", "Салат «Цезарь»"), "380 TL", "002-ceasar-salad-sezar-salata", ["gluten", "eggs", "milk", "fish", "mustard"], 450),
    it(T("Akdeniz Salatası", "Mediterranean Salad", "Средиземноморский салат"), "300 TL", "003-mediterranean-salad-akdeniz-salatasi", ["milk"], 250)
  ]},
  { id: "snacks", name: T("Aperatifler", "Snacks", "Закуски"), cover: I("007-citir-tavuk-crispy-chicken"), items: [
    it(T("Bira Tabağı (Başlangıç)", "Beer Snacks (Starter Plate)", "Закуски к пиву (сет)"), "450 TL", "004-beer-snacks-starter-plate-bira-baslangic-tabagi", ["gluten", "milk", "peanuts", "nuts"], 650),
    it(T("Karides", "Shrimp", "Креветки"), "750 TL", "005-karides", ["crustaceans", "milk"], 350),
    it(T("Patates Tabağı", "Potato Crisps", "Картофель фри"), "300 TL", "006-potato-crisps-patates-tabagi", [], 450),
    it(T("Çıtır Tavuk", "Crispy Chicken", "Хрустящая курица"), "300 TL", "007-citir-tavuk-crispy-chicken", ["gluten", "eggs", "milk"], 550),
    it(T("Sigara Böreği", "Cheese Rolls (Sigara Böreği)", "Сигара бёрек (сырные рулетики)"), "160 TL", "008-sigara-boregi", ["gluten", "milk", "eggs"], 400),
    it(T("Karışık Tost", "Mixed Toast", "Тост ассорти"), "280 TL", "009-mixed-toast-karisik-tost", ["gluten", "milk"], 480),
    it(T("Kaşarlı Tost", "Cheddar Toast", "Тост с сыром"), "250 TL", "010-cheddar-toast-kasarli-tost", ["gluten", "milk"], 420),
    it(T("Sucuklu Tost", "Sausage Toast", "Тост с суджуком"), "250 TL", "011-sausage-toast-sucuklu-tost", ["gluten", "milk"], 470),
    it(T("Peynir Tabağı", "Cheese Plate", "Сырная тарелка"), "300 TL", "012-cheese-plate-peynir-tabagi", ["milk", "nuts"], 450)
  ]},
  { id: "burgers", name: T("Burgerler", "Burgers", "Бургеры"), cover: I("015-barcode-special-double-burger"), items: [
    it(T("Hamburger", "Hamburger", "Гамбургер"), "450 TL", "013-hamburger", ["gluten", "sesame", "eggs", "mustard"], 750),
    it(T("Cheeseburger", "Cheeseburger", "Чизбургер"), "450 TL", "014-cheeseburger", ["gluten", "sesame", "eggs", "mustard", "milk"], 850),
    it(T("Barcode Special Double Burger", "Barcode Special Double Burger", "Barcode Special Double Burger"), "600 TL", "015-barcode-special-double-burger", ["gluten", "sesame", "eggs", "mustard", "milk"], 1200),
    it(T("Tavuk Burger", "Chicken Burger", "Куриный бургер"), "350 TL", "016-tavuk-burger-chicken-burger", ["gluten", "sesame", "eggs", "mustard", "milk"], 650)
  ]},
  { id: "pasta", name: T("Makarnalar", "Pasta", "Паста"), cover: I("018-pesto-soslu-tavuklu-penne"), items: [
    it(T("Penne Arrabbiata", "Penne Arrabbiata", "Пенне арраббьята"), "400 TL", "017-penne-arabiata", ["gluten"], 550,
       T("Sebzeli ve domates soslu", "With vegetables and tomato sauce", "С овощами и томатным соусом")),
    it(T("Pesto Soslu Tavuklu Penne", "Chicken Penne with Pesto", "Пенне с курицей и песто"), "450 TL", "018-pesto-soslu-tavuklu-penne", ["gluten", "milk", "nuts"], 800,
       T("Kremalı, mantarlı, tavuklu", "Creamy, with mushrooms and chicken", "Сливочный соус, грибы, курица")),
    it(T("Spagetti Bolonez", "Spaghetti Bolognese", "Спагетти болоньезе"), "400 TL", "019-spaghetti-bolognese", ["gluten", "celery", "milk"], 700)
  ]},
  { id: "pizza", name: T("Pizzalar", "Pizza", "Пицца"), cover: I("021-karisik-pizza-mixed-pizza"), items: [
    it(T("Pizza Margarita", "Pizza Margherita", "Пицца «Маргарита»"), "450 TL", "020-pizza-margarita", ["gluten", "milk"], 850),
    it(T("Karışık Pizza", "Mixed Pizza", "Пицца ассорти"), "450 TL", "021-karisik-pizza-mixed-pizza", ["gluten", "milk"], 1050),
    it(T("Vejetaryen Pizza", "Vegetarian Pizza", "Вегетарианская пицца"), "400 TL", "022-vegeterian-pizza", ["gluten", "milk"], 800)
  ]},
  { id: "wraps", name: T("Wraplar", "Wraps", "Роллы"), cover: I("023-meat-wrap-et-wrap"), items: [
    it(T("Et Wrap", "Meat Wrap", "Ролл с говядиной"), "450 TL", "023-meat-wrap-et-wrap", ["gluten", "milk", "mustard"], 700),
    it(T("Tavuk Wrap", "Chicken Wrap", "Ролл с курицей"), "320 TL", "024-chicken-wrap-tavuk-wrap", ["gluten", "milk", "mustard"], 600),
    it(T("Vejetaryen Wrap", "Vegetarian Wrap", "Вегетарианский ролл"), "280 TL", "025-vegeterian-wrap", ["gluten", "milk"], 480)
  ]},
  { id: "chicken", name: T("Tavuk Menüler", "Chicken Dishes", "Блюда из курицы"), cover: I("032-chicken-fajita"), items: [
    it(T("Kremalı Mantarlı Tavuk", "Creamy Mushroom Chicken", "Курица в сливочно-грибном соусе"), "450 TL", "026-kremali-mantarli-tavuk-menu", ["milk"], 750),
    it(T("Kekikli Tavuk", "Chicken with Thyme", "Курица с тимьяном"), "450 TL", "026-kremali-mantarli-tavuk-menu", [], 600),
    it(T("Sebzeli Tavuk", "Chicken with Vegetables", "Курица с овощами"), "450 TL", "026-kremali-mantarli-tavuk-menu", [], 550),
    it(T("Köri Soslu Tavuk", "Chicken with Curry Sauce", "Курица в соусе карри"), "450 TL", "026-kremali-mantarli-tavuk-menu", ["milk", "mustard", "celery"], 700),
    it(T("Acı Soslu Tavuk", "Spicy Sauce Chicken", "Курица в остром соусе"), "450 TL", "026-kremali-mantarli-tavuk-menu", [], 620),
    it(T("Barbekü Soslu Tavuk", "Barbecue Sauce Chicken", "Курица в соусе барбекю"), "450 TL", "026-kremali-mantarli-tavuk-menu", ["mustard", "celery"], 680),
    it(T("Tavuk Fajita", "Chicken Fajita", "Фахитас с курицей"), "450 TL", "032-chicken-fajita", ["gluten", "milk"], 700)
  ]},
  { id: "cocktails", name: T("Kokteyller", "Cocktails", "Коктейли"), cover: I("106-aperol-spritz"), items: [
    it(T("Aperol Spritz", "Aperol Spritz", "Апероль Шприц"), "460 TL", "106-aperol-spritz", ["sulphites"], 200),
    it(T("Long Island", "Long Island", "Лонг-Айленд"), "550 TL", "107-long-island", [], 280),
    it(T("Sex On The Beach", "Sex On The Beach", "Секс на пляже"), "460 TL", "108-sex-on-the-beach", [], 250),
    it(T("Bespresso", "Bespresso", "Беспрессо"), "500 TL", "109-bespresso", [], 230),
    it(T("Mojito", "Mojito", "Мохито"), "460 TL", "110-mojito", [], 220),
    it(T("Piña Colada", "Piña Colada", "Пина колада"), "460 TL", "111-pi-a-colada", ["milk"], 490),
    it(T("Kuzu Kulağı", "Kuzu Kulağı (Sorrel)", "Кузу Кулагы (щавель)"), "460 TL", "112-kuzu-kulagi", [], 220),
    it(T("Cosmopolitan", "Cosmopolitan", "Космополитен"), "460 TL", "113-cosmopolitan", [], 170),
    it(T("Cuba Libre", "Cuba Libre", "Куба либре"), "460 TL", "114-cuba-libre", [], 190),
    it(T("La Passion by Code", "La Passion by Code", "Ла Пассьон бай Код"), "550 TL", "115-la-passion-by-code", [], 250),
    it(T("Margarita", "Margarita", "Маргарита"), "460 TL", "116-margarita", [], 250),
    it(T("Tequila Sunrise", "Tequila Sunrise", "Текила санрайз"), "460 TL", "117-tequila-sunrise", [], 230),
    it(T("Lynchburg Lemonade", "Lynchburg Lemonade", "Линчбургский лимонад"), "500 TL", "118-lynchburg-lemonade", [], 230),
    it(T("Martini", "Martini", "Мартини"), "450 TL", "119-martini", ["sulphites"], 200),
    it(T("Baileys", "Baileys", "Бейлис"), "450 TL", "120-baileys", ["milk"], 230)
  ]},
  { id: "raki", name: T("Rakı & Mezeler", "Raki & Meze", "Раки и мезе"), cover: I("121-raki-70-cl-set"), items: [
    it(T("Rakı · 70 cl Set", "Raki · 70 cl Set", "Раки · Сет 70 cl"), "4.500 TL", "121-raki-70-cl-set", [], 1760),
    it(T("Rakı · 35 cl Set", "Raki · 35 cl Set", "Раки · Сет 35 cl"), "2.750 TL", "121-raki-70-cl-set", [], 880),
    it(T("Tek Rakı · Kadeh", "Raki · Single Glass", "Раки · одинарный"), "400 TL", "123-tek-raki-kadeh", [], 120),
    it(T("Double Rakı · Kadeh", "Raki · Double Glass", "Раки · двойной"), "550 TL", "123-tek-raki-kadeh", [], 240),
    it(T("Havuç Tarator", "Carrot Tarator", "Морковный таратор"), "260 TL", "125-havuc-tarator", ["milk", "nuts"], 180),
    it(T("Haydari", "Haydari (Yogurt & Herb Dip)", "Хайдари (йогурт с травами)"), "260 TL", "126-haydari", ["milk"], 170),
    it(T("Süzme Yoğurt", "Strained Yogurt", "Густой йогурт"), "260 TL", "127-suzme-yogurt", ["milk"], 150),
    it(T("Meyve Tabağı", "Fruit Plate", "Фруктовая тарелка"), "400 TL", "128-meyve-tabagi", [], 250),
    it(T("Peynir Tabağı", "Cheese Plate", "Сырная тарелка"), "300 TL", "129-peynir-tabagi", ["milk"], 450),
    it(T("Salatalık Söğüş", "Sliced Cucumber", "Нарезка из огурцов"), "200 TL", "130-salatalik-sogus", [], 40)
  ]},
  { id: "whisky", name: T("Viski", "Whisky", "Виски"), cover: I("037-black-label-35-cl-set"), items: [
    ...std("Red Label", "033-red-label-35-cl-set", { set35: "3.000 TL", set70: "5.000 TL", single: "390 TL", double: "550 TL" }),
    ...std("Black Label", "037-black-label-35-cl-set", { set35: "3.750 TL", set70: "6.500 TL", single: "550 TL", double: "650 TL" }),
    ...std("Chivas Regal", "041-chivas-regal-35-cl-set", { set35: "3.750 TL", set70: "6.500 TL", single: "550 TL", double: "650 TL" }),
    ...std("Jack Daniel's", "045-jack-daniels-35-cl-set", { set35: "3.750 TL", set70: "6.500 TL", single: "550 TL", double: "650 TL" }),
    ...std("Jameson", "049-jameson-35-cl-set", { set35: "3.250 TL", set70: "5.500 TL", single: "450 TL", double: "600 TL" })
  ]},
  { id: "vodka", name: T("Votka", "Vodka", "Водка"), cover: I("069-absolut-35-cl-set"), items: [
    ...std("Absolut", "069-absolut-35-cl-set", { set35: "3.250 TL", set70: "5.750 TL", single: "500 TL", double: "600 TL" }),
    ...std("Istanblue", "073-istanblue-35-cl-set", { set35: "3.250 TL", set70: "5.500 TL", single: "450 TL", double: "550 TL" }),
    ...std("Smirnoff", "077-smirnoff-35-cl-set", { set35: "3.250 TL", set70: "5.500 TL", single: "450 TL", double: "550 TL" })
  ]},
  { id: "spirits", name: T("Cin · Jäger · Tekila · Konyak · Rom", "Gin · Jäger · Tequila · Cognac · Rum", "Джин · Егерь · Текила · Коньяк · Ром"), cover: I("053-gordon-cin-35-cl-set"), items: [
    ...std("Gordon's Gin", "053-gordon-cin-35-cl-set", { set35: "3.250 TL", set70: "5.500 TL", single: "450 TL", double: "550 TL" }),
    ...std("Beefeater Gin", "057-beefeater-cin-35-cl-set", { set35: "3.250 TL", set70: "5.250 TL" }),
    ...spirit("Jägermeister", "059-j-germeister-35-cl-set", [["set35", "3.250 TL", 900], ["set70", "5.500 TL", 1800], ["single", "360 TL", 100], ["double", "600 TL", 200]]),
    ...std("Olmeca Tequila", "063-olmeca-tequila-35-cl-set", { set35: "3.250 TL", set70: "5.000 TL" }),
    ...std("Cognac", "066-cognac-tek", { single: "500 TL" }),
    ...std("Cognac", "067-cognac-double", { double: "600 TL" }),
    ...std("White Rum", "066-cognac-tek", { set35: "2.500 TL" })
  ]},
  { id: "wines", name: T("Şaraplar", "Wines", "Вина"), cover: I("090-kirmizi-sarap-sise"), items: [
    ...wine(T("Kırmızı Şarap", "Red Wine", "Красное вино"), "090-kirmizi-sarap-sise"),
    ...wine(T("Beyaz Şarap", "White Wine", "Белое вино"), "094-beyaz-sarap-sise"),
    ...wine(T("Rose Şarap", "Rosé Wine", "Розовое вино"), "098-rose-sarap-sise"),
    ...["6.000 TL", "4.500 TL", "3.000 TL", "2.500 TL"].map(p =>
      it(T("Şampanya · Şişe", "Champagne · Bottle", "Шампанское · бутылка"), p, "102-sampanya-sise", ["sulphites"], 580))
  ]},
  { id: "beers", name: T("Biralar", "Beers", "Пиво"), cover: I("081-efes"), items: [
    it(T("Efes", "Efes", "Эфес"), "300 TL", "081-efes", ["gluten"], 210),
    it(T("Efes Malt", "Efes Malt", "Эфес Мальт"), "300 TL", "082-efes-malt", ["gluten"], 230),
    it(T("Bomonti Filtresiz", "Bomonti Unfiltered", "Бомонти нефильтрованное"), "300 TL", "083-bomonti-unfiltered", ["gluten"], 220),
    it(T("Bomonti Malt", "Bomonti Malt", "Бомонти Мальт"), "300 TL", "084-bomonti-malt", ["gluten"], 230),
    it(T("Beck's", "Beck's", "Бекс"), "300 TL", "085-becks", ["gluten"], 210),
    it(T("Miller", "Miller", "Миллер"), "300 TL", "086-miller", ["gluten"], 200),
    it(T("Tuborg", "Tuborg", "Туборг"), "300 TL", "087-tuborg", ["gluten"], 210),
    it(T("Carlsberg", "Carlsberg", "Карлсберг"), "300 TL", "088-carlsberg", ["gluten"], 210),
    it(T("Meksika Bardak", "Mexican Glass", "Мексиканский бокал"), "50 TL", "089-mexican-glass-meksika-bardak", [], 5,
       T("Tuzlu, limonlu bardak (ek ücret)", "Salt & lime rimmed glass (extra)", "Бокал с солью и лаймом (доплата)"))
  ]},
  { id: "mocktails", name: T("Alkolsüz Kokteyller", "Mocktails", "Безалкогольные коктейли"), cover: I("133-berrys"), items: [
    it(T("Alkolsüz Mojito", "Virgin Mojito", "Безалкогольный мохито"), "300 TL", "131-alkolsuz-mojito", [], 150),
    it(T("Belek", "Belek", "Белек"), "300 TL", "132-belek", [], 190),
    it(T("Berrys", "Berrys", "Беррис"), "300 TL", "133-berrys", [], 180),
    it(T("Rainbow", "Rainbow", "Рейнбоу"), "300 TL", "134-rainbow", [], 210),
    it(T("Smurfs", "Smurfs", "Смёрфс"), "300 TL", "135-smurfs", [], 200)
  ]},
  { id: "shakes", name: T("Milkshake · Frozen · Frappe", "Milkshake · Frozen · Frappe", "Милкшейк · Фрозен · Фраппе"), cover: I("137-milkshake"), items: [
    it(T("Ice Coffee", "Iced Coffee", "Холодный кофе"), "270 TL", "136-ice-coffee", ["milk"], 250),
    it(T("Milkshake", "Milkshake", "Милкшейк"), "270 TL", "137-milkshake", ["milk"], 450),
    it(T("Frozen", "Frozen", "Фрозен"), "300 TL", "138-frozen", [], 250),
    it(T("Frappe", "Frappé", "Фраппе"), "300 TL", "139-frappe", ["milk"], 320)
  ]},
  { id: "soft", name: T("Meşrubatlar", "Soft Drinks", "Безалкогольные напитки"), cover: I("143-kola"), items: [
    it(T("Su (Küçük)", "Water (Small)", "Вода (маленькая)"), "45 TL", "140-su-kucuk", [], 0),
    it(T("Sade Soda", "Sparkling Water", "Минеральная вода"), "60 TL", "141-sade-soda", [], 0),
    it(T("Meyveli Soda", "Flavoured Soda", "Фруктовая газировка"), "90 TL", "142-meyveli-soda", [], 90),
    it(T("Kola", "Cola", "Кола"), "180 TL", "143-kola", [], 140),
    it(T("Fanta", "Fanta", "Фанта"), "180 TL", "144-fanta", [], 150),
    it(T("Sprite", "Sprite", "Спрайт"), "180 TL", "145-sprite", [], 140),
    it(T("Ice Tea", "Iced Tea", "Холодный чай"), "180 TL", "146-ice-tea", [], 110),
    it(T("Limonata", "Lemonade", "Лимонад"), "150 TL", "147-limonata", [], 150),
    it(T("Meyve Suyu", "Fruit Juice", "Фруктовый сок"), "180 TL", "148-meyve-suyu", [], 150),
    it(T("Taze Sıkılmış Portakal Suyu", "Fresh Orange Juice", "Свежевыжатый апельсиновый сок"), "150 TL", "149-taze-sikilmis-portakal-suyu", [], 120),
    it(T("Taze Sıkılmış Nar Suyu", "Fresh Pomegranate Juice", "Свежевыжатый гранатовый сок"), "150 TL", "150-taze-sikilmis-nar-suyu", [], 140),
    it(T("Red Bull", "Red Bull", "Ред Булл"), "200 TL", "151-redbull", [], 110),
    it(T("Şalgam (Büyük)", "Şalgam – Turnip Juice (Large)", "Шалгам – сок из репы (большой)"), "250 TL", "152-salgam-buyuk", [], 30),
    it(T("Churchill", "Churchill (Lemon Soda)", "Черчилль (содовая с лимоном)"), "150 TL", "153-churchill", [], 60)
  ]},
  { id: "hot", name: T("Sıcak İçecekler", "Hot Drinks", "Горячие напитки"), cover: I("156-turk-kahvesi"), items: [
    it(T("Çay (Fincan)", "Tea (Cup)", "Чай (чашка)"), "100 TL", "154-cay-fincan", [], 2),
    it(T("Bitki Çayları", "Herbal Teas", "Травяной чай"), "180 TL", "155-bitki-caylari", [], 2),
    it(T("Türk Kahvesi", "Turkish Coffee", "Турецкий кофе"), "150 TL", "156-turk-kahvesi", [], 10),
    it(T("Espresso", "Espresso", "Эспрессо"), "150 TL", "157-espresso", [], 3),
    it(T("Double Espresso", "Double Espresso", "Двойной эспрессо"), "200 TL", "158-double-espresso", [], 5),
    it(T("Americano", "Americano", "Американо"), "180 TL", "159-americano", [], 10),
    it(T("Latte", "Latte", "Латте"), "240 TL", "160-latte", ["milk"], 190),
    it(T("Cappuccino", "Cappuccino", "Капучино"), "240 TL", "161-cappucino", ["milk"], 130),
    it(T("Sıcak Çikolata", "Hot Chocolate", "Горячий шоколад"), "240 TL", "162-sicak-cikolata", ["milk"], 350)
  ]},
  { id: "desserts", name: T("Tatlı · Çerez · Meyve", "Desserts · Nuts · Fruit", "Десерты · Орехи · Фрукты"), cover: I("168-waffle"), items: [
    it(T("Meyve Tabağı", "Fruit Plate", "Фруктовая тарелка"), "400 TL", "163-fruit-plate-meyve-tabagi", [], 250),
    it(T("Çerez Tabağı", "Nuts Plate", "Тарелка орехов"), "150 TL", "164-nuts-plate-cerez-tabagi", ["nuts", "peanuts"], 600),
    it(T("Lüks Çerez Tabağı", "Luxury Nuts Plate", "Ассорти орехов «Люкс»"), "250 TL", "165-luxury-nuts-luks-cerez-tabagi", ["nuts", "peanuts"], 650),
    it(T("3'lü Çerez Tabağı", "Trio Nuts Plate", "Ассорти из трёх видов орехов"), "250 TL", "166-3-lu-cerez-tabagi", ["nuts", "peanuts"], 600),
    it(T("Havuç Salatalık Söğüş", "Carrot & Cucumber Sticks", "Морковь и огурцы (нарезка)"), "200 TL", "167-havuc-salatalik-sogus", [], 60),
    it(T("Waffle", "Waffle", "Вафли"), "290 TL", "168-waffle", ["gluten", "eggs", "milk", "nuts", "soy"], 650),
    it(T("Büyük Doğum Günü Pastası", "Large Birthday Cake", "Большой праздничный торт"), "1.200 TL", "169-buyuk-dogum-gunu-pastasi", ["gluten", "eggs", "milk"], 3500),
    it(T("Küçük Doğum Günü Pastası", "Small Birthday Cake", "Маленький праздничный торт"), "650 TL", "170-kucuk-dogum-gunu-pastasi", ["gluten", "eggs", "milk"], 1800),
    it(T("Pasta Dilimi", "Slice of Cake", "Кусочек торта"), "250 TL", "171-pasta-dilimi", ["gluten", "eggs", "milk"], 420)
  ]},
  { id: "shisha", name: T("Nargile", "Shisha", "Кальян"), cover: I("172-el-fakher"), items: [
    ...["El Fakher", "Adalya", "Nakhla", "Starbuzz", "Jibiar", "Dark", "Naturel"].map(n =>
      it(T(n, n, n), "1.000 TL", "172-el-fakher", [], null)),
    it(T("Lüle Değişimi", "Bowl Change", "Замена чаши"), "300 TL", "172-el-fakher", [], null)
  ]}
];
