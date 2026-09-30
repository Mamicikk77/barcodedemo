/* Barcode Garden Belek — arayüz metinleri ve alerjen etiketleri (TR / EN / RU) */
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
  waTitle:     T("WhatsApp ile yazın", "Message us on WhatsApp", "Напишите нам в WhatsApp"),
  waLine:      T("Hat", "Line", "Линия"),
  waOpen:      T("Yaz", "Chat", "Написать"),
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
