/* Siluets: every price below is copied from siluetssalons.lv (LV and RU pages, read 4 Nov 2026).
   Durations and opening hours are samples until the salon confirms them.
   Plain data, so Node can render the static price list into index.html for visitors without JavaScript. */
(function (g) {
  // [lv, ru]
  const GROUPS = [
    {
      id: 'lpg', zone: ['kermenis'], lv: 'LPG lipomasāža', ru: 'Липомассаж LPG',
      note: ['Cellu M6 Alliance (Francija)', 'Cellu M6 Alliance (Франция)'],
      items: [
        ['Masāža 20 min', 'Массаж 20 мин', '25.00', 20],
        ['Masāža 45 min', 'Массаж 45 мин', '35.00', 45],
        ['Kostīms procedūrai', 'Костюм для массажа', '22.00'],
        ['Abonements 10 × 20 min', 'Абонемент 10 × 20 мин', '200.00'],
        ['Abonements 10 × 45 min', 'Абонемент 10 × 45 мин', '300.00'],
      ],
    },
    {
      id: 'lift', zone: ['seja', 'kakls'], lv: 'Lift LPG masāža sejai', ru: 'Лифтмассаж LPG',
      note: ['Mobilift M6 (Francija)', 'Mobilift M6 (Франция)'],
      items: [
        ['Seja + kakls, 45 min', 'Лицо + шея, 45 мин', '25.00', 45],
        ['Abonements 10 reizes (seja + kakls)', 'Абонемент 10 раз (лицо + шея)', '220.00'],
      ],
    },
    {
      id: 'zabaki', zone: ['kajas'], lv: 'Weyergans gaisa zābaki', ru: 'Воздушные сапоги Weyergans',
      note: ['Limfodrenāža (Vācija)', 'Лимфодренаж (Германия)'],
      items: [
        ['Gaisa zābaki', 'Воздушные сапоги', '10.00', 30],
        ['Abonements 10 reizes', 'Абонемент 10 раз', '60.00'],
        ['Gaisa zābaki + ietīšana kājām', 'Сапоги + обёртывание ног', '15.00', 45],
        ['Sothys Silhouette (pīlings, ietīšana) + gaisa zābaki', 'Sothys Silhouette (пилинг, обёртывание) + сапоги', '22.00', 60],
      ],
    },
    {
      id: 'fotoepil', zone: ['seja', 'kakls', 'kermenis', 'kajas'], lv: 'Fotoepilācija', ru: 'Фотоэпиляция',
      note: ['Plasmalite FPL (Zviedrija)', 'Plasmalite FPL (Швеция)'],
      items: [
        ['Viens impulss', 'Один импульс', '3.50'],
        ['Zods', 'Подбородок', '28.00–40.00', 30, 'seja'],
        ['Virslūpa', 'Верхняя губа', '25.00–30.00', 30, 'seja'],
        ['Kakls', 'Шея', '40.00–50.00', 30, 'kakls'],
        ['Bikini zona', 'Зона бикини', '70.00–85.00', 45, 'kermenis'],
        ['Intīmzona', 'Интимная зона', '40.00–60.00', 45, 'kermenis'],
        ['Bikini + intīmzona, paduses par brīvu', 'Бикини + интимная зона, подмышки бесплатно', '110.00–135.00', 60, 'kermenis'],
        ['Kāju apakšstilbi', 'Голени', '170.00–200.00', 60, 'kajas'],
        ['Kāju augšstilbi', 'Бёдра', '170.00–200.00', 60, 'kajas'],
        ['Kājas visā garumā', 'Ноги полностью', '280.00–350.00', 90, 'kajas'],
      ],
    },
    {
      id: 'fotoatj', zone: ['seja', 'kakls'], lv: 'Fotoatjaunošana', ru: 'Фотоомоложение',
      note: ['Plasmalite FPL (Zviedrija)', 'Plasmalite FPL (Швеция)'],
      items: [
        ['Seja', 'Лицо', '90.00–100.00', 60, 'seja'],
        ['Kakls', 'Шея', '70.00', 45, 'kakls'],
        ['Seja + kakls', 'Лицо + шея', '130.00–140.00', 75, 'seja'],
        ['Dekoltē', 'Декольте', '120.00', 45, 'kakls'],
        ['Seja + kakls + dekoltē', 'Лицо + шея + декольте', '170.00', 90, 'kakls'],
      ],
    },
    {
      id: 'sothys', zone: ['seja', 'kakls'], lv: 'Sothys sejas procedūras', ru: 'Процедуры Sothys',
      note: ['Franču profesionālā kosmētika', 'Французская профессиональная косметика'],
      items: [
        ['Collagène-Hyaluronique, atjaunojoša', 'Collagène-Hyaluronique, восстанавливающая', '38.00', 60, 'seja'],
        ['Collagène-Hyaluronique + dekoltē', 'Collagène-Hyaluronique + декольте', '45.00', 75, 'kakls'],
        ['Hydra 3Ha, ļoti mitrinoša, seja + dekoltē', 'Hydra 3Ha, глубокое увлажнение, лицо + декольте', '45.00', 75, 'kakls'],
        ['Sothys bāzes procedūra', 'Базовая процедура Sothys', '30.00', 60, 'seja'],
        ['Bāzes procedūra + dekoltē', 'Базовая + декольте', '35.00', 75, 'kakls'],
        ['Sothys eye contour, ap acīm', 'Sothys eye contour, вокруг глаз', '20.00', 30, 'seja'],
        ['Eye contour kopā ar sejas procedūru', 'Eye contour вместе с процедурой для лица', '15.00'],
      ],
    },
    {
      id: 'annalotan', zone: ['seja', 'kakls'], lv: 'Anna Lotan sejas procedūras', ru: 'Процедуры Anna Lotan',
      items: [
        ['Zelta zīds, barojoša un mitrinoša', 'Золотой шёлк, питательная и увлажняющая', '22.00–26.00', 60, 'seja'],
        ['New Age 30+, liftinga procedūra', 'New Age 30+, лифтинг', '22.00–26.00', 60, 'seja'],
        ['Pērļu skaistums, atjaunojoša', 'Жемчужная красота, восстанавливающая', '22.00–26.00', 60, 'seja'],
        ['Anna Lotan procedūra + ultraskaņa', 'Процедура Anna Lotan + ультразвук', '36.00', 75, 'seja'],
        ['Sanoderm sejas tīrīšana', 'Чистка лица Sanoderm', '22.00–28.00', 60, 'seja'],
        ['Klasiskā masāža sejai', 'Классический массаж лица', '10.00', 20, 'seja'],
        ['Klasiskā masāža sejai un dekoltē', 'Массаж лица и декольте', '20.00', 30, 'kakls'],
      ],
    },
    {
      id: 'mesoestetic', zone: ['seja', 'kakls', 'rokas'], lv: 'Mesoestetic pīlingi', ru: 'Пилинги Mesoestetic',
      items: [
        ['Ķīmiskais pīlings sejai', 'Химический пилинг лица', '30.00', 45, 'seja'],
        ['Ķīmiskais pīlings + sejas maska', 'Пилинг + маска', '45.00', 60, 'seja'],
        ['Ķīmiskais pīlings, seja + dekoltē', 'Пилинг лицо + декольте', '45.00', 60, 'kakls'],
        ['Seja + dekoltē + maska', 'Лицо + декольте + маска', '60.00', 75, 'kakls'],
        ['Pīlings rokām, kopā ar sejas pīlingu', 'Пилинг рук вместе с пилингом лица', '5.00', 0, 'rokas'],
      ],
    },
    {
      id: 'mezo', zone: ['seja', 'kermenis'], lv: 'Mezoterapija Weyergans (bez injekcijām)', ru: 'Мезотерапия Weyergans (без инъекций)',
      items: [
        ['Seja', 'Лицо', '17.00', 30, 'seja'],
        ['Seja + maska', 'Лицо + маска', '22.00', 45, 'seja'],
        ['Acis', 'Глаза', '12.00', 20, 'seja'],
        ['Acis + seja', 'Глаза + лицо', '17.00', 30, 'seja'],
        ['Ķermenis, problemātiskās zonas', 'Тело, проблемные зоны', '17.00', 30, 'kermenis'],
      ],
    },
    {
      id: 'rosedemer', zone: ['seja'], lv: 'Pīlingi Rose de Mer', ru: 'Пилинги Rose de Mer',
      items: [
        ['Koraļļu dabīgais pīlings', 'Натуральный коралловый пилинг', '35.00', 45],
        ['Ķīmiskais pīlings', 'Химический пилинг', '35.00', 45],
        ['Kombinētais pīlings', 'Комбинированный пилинг', '50.00', 60],
      ],
    },
    {
      id: 'depil', zone: ['rokas', 'kajas', 'seja', 'kermenis'], lv: 'Depilācija', ru: 'Депиляция',
      items: [
        ['Kājas līdz ceļiem', 'Ноги до колен', '8.00–10.00', 30, 'kajas'],
        ['Kājas visā garumā', 'Ноги полностью', '15.00–18.00', 45, 'kajas'],
        ['Rokas', 'Руки', '6.00–12.00', 30, 'rokas'],
        ['Paduses', 'Подмышки', '5.00–8.00', 15, 'rokas'],
        ['Virslūpa', 'Верхняя губа', '5.00', 15, 'seja'],
        ['Bikini zona', 'Зона бикини', '15.00–20.00', 30, 'kermenis'],
        ['Parafīna vanniņa', 'Парафиновая ванночка', '8.00', 20, 'rokas'],
      ],
    },
    {
      id: 'ausis', zone: ['seja'], lv: 'Ausu caurduršana', ru: 'Прокол ушей',
      items: [['Ausu caurduršana ar auskariem', 'Прокол ушей с серёжками', '15.00', 15]],
    },
    {
      id: 'manikirs', zone: ['rokas'], lv: 'Manikīrs', ru: 'Маникюр', closed: true,
      items: [
        ['Manikīrs klasiskais', 'Классический маникюр', '8.00', 45],
        ['Manikīrs ar gelish', 'Маникюр с gelish', '15.00', 75],
        ['Lakošana ar gelish', 'Покрытие gelish', '10.00', 45],
      ],
    },
    {
      id: 'pedikirs', zone: ['kajas'], lv: 'Pedikīrs', ru: 'Педикюр', closed: true,
      items: [
        ['Pedikīrs', 'Педикюр', '20.00', 60],
        ['Pedikīrs ar gelish', 'Педикюр с gelish', '25.00', 75],
        ['Kāju pirkstu apstrāde + gelish', 'Обработка пальцев + gelish', '18.00', 45],
      ],
    },
  ];

  const ZONES = {
    seja: { lv: 'Seja', ru: 'Лицо', blurb: ['Kopšana, pīlingi, liftings un ādas atjaunošana.', 'Уход, пилинги, лифтинг и омоложение кожи.'] },
    kakls: { lv: 'Kakls un dekoltē', ru: 'Шея и декольте', blurb: ['Zona, kas vecumu parāda pirmā, un ko visbiežāk aizmirst.', 'Зона, которая первой выдаёт возраст и о которой чаще всего забывают.'] },
    rokas: { lv: 'Rokas', ru: 'Руки', blurb: ['Depilācija, parafīns un manikīrs.', 'Депиляция, парафин и маникюр.'] },
    kermenis: { lv: 'Ķermenis', ru: 'Тело', blurb: ['Siluets: LPG masāža, apjoma samazināšana un gluda āda.', 'Силуэт: массаж LPG, уменьшение объёмов и гладкая кожа.'] },
    kajas: { lv: 'Kājas', ru: 'Ноги', blurb: ['Vieglas kājas, gluda āda un pedikīrs.', 'Лёгкие ноги, гладкая кожа и педикюр.'] },
  };

  // course savings: [group id, single-session item index, course item index, sessions]
  const COURSES = [
    ['lpg', 0, 3, 10],
    ['lpg', 1, 4, 10],
    ['lift', 0, 1, 10],
    ['zabaki', 0, 1, 10],
  ];

  // Tue–Fri are real (closed Mon, Sat, Sun per their site); the times are a sample
  const OPEN = [null, null, [10, 19], [10, 19], [10, 19], [10, 19], null];

  g.SILUETS = { GROUPS, ZONES, COURSES, OPEN, PHONE: '+37120220533', PHONE_TEXT: '20 220 533' };
})(typeof window !== 'undefined' ? window : globalThis);
