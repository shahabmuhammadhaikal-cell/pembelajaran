/**
 * Cerita bergambar untuk mode anak.
 * Satu cerita = beberapa kalimat (ID/EN/AR + transliterasi) + dua pertanyaan pemahaman.
 * Transliterasi (`tr`) dipakai membacakan kalimat Arab bila perangkat tidak punya suara Arab.
 */

const sentence = (emoji, id, en, ar, tr) => ({ emoji, id, en, ar, tr })

export const KID_STORIES = [
  {
    id: "milo",
    title: "Kucing Kecil",
    titleEn: "The Little Cat",
    titleAr: "القط الصغير",
    emoji: "🐱",
    cover: ["🐱", "🥛", "🛋️"],
    color: "#ff7aa2",
    level: "Mudah",
    sentences: [
      sentence("🐱", "Ini kucing kecil.", "This is a little cat.", "هَذَا قِطٌّ صَغِير.", "Hādhā qiṭṭun ṣaghīr"),
      sentence("😺", "Namanya Milo.", "His name is Milo.", "اِسْمُهُ مِيلُو.", "Ismuhu Mīlū"),
      sentence("🥛", "Milo suka susu.", "Milo likes milk.", "مِيلُو يُحِبُّ الْحَلِيب.", "Mīlū yuḥibbu al-ḥalīb"),
      sentence("⚽", "Milo juga suka bermain bola.", "Milo also likes to play with a ball.", "مِيلُو يُحِبُّ أَيْضًا اللَّعِبَ بِالْكُرَة.", "Mīlū yuḥibbu aydan al-laʿiba bil-kura"),
      sentence("🛋️", "Milo tidur di sofa.", "Milo sleeps on the sofa.", "مِيلُو يَنَامُ عَلَى الْأَرِيكَة.", "Mīlū yanāmu ʿalā al-arīka"),
      sentence("😸", "Milo senang sekali.", "Milo is very happy.", "مِيلُو سَعِيدٌ جِدًّا.", "Mīlū saʿīdun jiddan")
    ],
    questions: [
      { q: "Siapa nama kucing itu?", options: ["Milo", "Tomi", "Bobi"], answer: 0 },
      { q: "Milo suka minum apa?", options: ["Susu", "Jus", "Teh"], answer: 0 }
    ]
  },
  {
    id: "pasar",
    title: "Pergi ke Pasar",
    titleEn: "Going to the Market",
    titleAr: "الذهاب إلى السوق",
    emoji: "🛒",
    cover: ["🛒", "🍎", "🍌"],
    color: "#ffab3d",
    level: "Mudah",
    sentences: [
      sentence("👩‍👦", "Ibu dan Ali pergi ke pasar.", "Mother and Ali go to the market.", "ذَهَبَتْ أُمِّي وَعَلِيٌّ إِلَى السُّوق.", "Dhahabat ummī wa-ʿAliyyun ilā as-sūq"),
      sentence("🏪", "Pasar itu ramai sekali.", "The market is very busy.", "السُّوقُ مُزْدَحِمٌ جِدًّا.", "As-sūqu muzdaḥimun jiddan"),
      sentence("🍎", "Mereka membeli apel merah.", "They buy red apples.", "اِشْتَرَيَا تُفَّاحًا أَحْمَر.", "Ishtarayā tuffāḥan aḥmar"),
      sentence("🍌", "Ali membeli pisang.", "Ali buys bananas.", "عَلِيٌّ اِشْتَرَى مَوْزًا.", "ʿAliyyun ishtarā mawzan"),
      sentence("🥬", "Ibu membeli sayur hijau.", "Mother buys green vegetables.", "أُمِّي اِشْتَرَتْ خُضَارًا خَضْرَاء.", "Ummī ishtarat khuḍāran khaḍrāʾ"),
      sentence("😄", "Mereka pulang dengan gembira.", "They go home happily.", "عَادَا فَرِحَيْن.", "ʿĀdā fariḥayn")
    ],
    questions: [
      { q: "Ke mana Ibu dan Ali pergi?", options: ["Pasar", "Sekolah", "Pantai"], answer: 0 },
      { q: "Ali membeli apa di pasar?", options: ["Pisang", "Apel", "Sayur"], answer: 0 }
    ]
  },
  {
    id: "keluarga",
    title: "Keluargaku",
    titleEn: "My Family",
    titleAr: "عائلتي",
    emoji: "👨‍👩‍👧",
    cover: ["👨‍👩‍👧", "🍚", "❤️"],
    color: "#4f8cff",
    level: "Mudah",
    sentences: [
      sentence("👨‍👩‍👧", "Ini keluargaku.", "This is my family.", "هَذِهِ عَائِلَتِي.", "Hādhihi ʿāʾilatī"),
      sentence("👨", "Ayahku tinggi.", "My father is tall.", "أَبِي طَوِيل.", "Abī ṭawīl"),
      sentence("👩", "Ibuku baik hati.", "My mother is kind.", "أُمِّي طَيِّبَةُ الْقَلْب.", "Ummī ṭayyibatu al-qalb"),
      sentence("👧", "Aku punya satu kakak perempuan.", "I have one sister.", "لِي أُخْتٌ وَاحِدَة.", "Lī ukhtun wāḥida"),
      sentence("🍚", "Kami suka makan bersama.", "We like to eat together.", "نَحْنُ نُحِبُّ الْأَكْلَ مَعًا.", "Naḥnu nuḥibbu al-akla maʿan"),
      sentence("❤️", "Kami saling menyayangi.", "We love each other.", "نَحْنُ نَتَحَابُّ.", "Naḥnu nataḥābbu")
    ],
    questions: [
      { q: "Siapa yang tinggi?", options: ["Ayah", "Ibu", "Kakak"], answer: 0 },
      { q: "Apa yang mereka suka lakukan bersama?", options: ["Makan bersama", "Berenang", "Menonton"], answer: 0 }
    ]
  },
  {
    id: "kebun-binatang",
    title: "Di Kebun Binatang",
    titleEn: "At the Zoo",
    titleAr: "في حديقة الحيوان",
    emoji: "🦁",
    cover: ["🦁", "🦒", "🐵"],
    color: "#39c98c",
    level: "Sedang",
    sentences: [
      sentence("🎒", "Hari ini aku pergi ke kebun binatang.", "Today I go to the zoo.", "الْيَوْمَ ذَهَبْتُ إِلَى حَدِيقَةِ الْحَيَوَان.", "Al-yawma dhahabtu ilā ḥadīqati al-ḥayawān"),
      sentence("🦁", "Aku melihat singa besar.", "I see a big lion.", "رَأَيْتُ أَسَدًا كَبِيرًا.", "Raʾaytu asadan kabīran"),
      sentence("🌳", "Singa itu tidur di bawah pohon.", "The lion sleeps under a tree.", "الْأَسَدُ نَائِمٌ تَحْتَ الشَّجَرَة.", "Al-asadu nāʾimun taḥta ash-shajara"),
      sentence("🦒", "Aku juga melihat jerapah.", "I also see a giraffe.", "رَأَيْتُ أَيْضًا زَرَافَة.", "Raʾaytu aydan zarāfa"),
      sentence("📏", "Leher jerapah sangat panjang.", "The giraffe's neck is very long.", "رَقَبَةُ الزَّرَافَةِ طَوِيلَةٌ جِدًّا.", "Raqabatu az-zarāfati ṭawīlatun jiddan"),
      sentence("🐵", "Ada monyet yang lucu.", "There is a funny monkey.", "هُنَاكَ قِرْدٌ مُضْحِك.", "Hunāka qirdun muḍḥik"),
      sentence("🍌", "Monyet suka pisang.", "The monkey likes bananas.", "الْقِرْدُ يُحِبُّ الْمَوْز.", "Al-qirdu yuḥibbu al-mawz"),
      sentence("😊", "Aku pulang dengan senang.", "I go home happy.", "عُدْتُ مَسْرُورًا.", "ʿUdtu masrūran")
    ],
    questions: [
      { q: "Di mana singa tidur?", options: ["Di bawah pohon", "Di dalam kandang", "Di atas batu"], answer: 0 },
      { q: "Monyet suka buah apa?", options: ["Pisang", "Apel", "Anggur"], answer: 0 }
    ]
  },
  {
    id: "bintang",
    title: "Bintang di Langit",
    titleEn: "Stars in the Sky",
    titleAr: "النجوم في السماء",
    emoji: "⭐",
    cover: ["🌙", "⭐", "🛏️"],
    color: "#a06bff",
    level: "Sedang",
    sentences: [
      sentence("🌌", "Malam ini langit cerah.", "Tonight the sky is clear.", "اللَّيْلَةَ السَّمَاءُ صَافِيَة.", "Al-laylata as-samāʾu ṣāfiya"),
      sentence("✨", "Ada banyak bintang.", "There are many stars.", "هُنَاكَ نُجُومٌ كَثِيرَة.", "Hunāka nujūmun kathīra"),
      sentence("💡", "Bintang berkelip seperti lampu kecil.", "The stars twinkle like little lamps.", "النُّجُومُ تَلْمَعُ كَمِصْبَاحٍ صَغِير.", "An-nujūmu talmaʿu kamiṣbāḥin ṣaghīr"),
      sentence("🌕", "Bulan juga bersinar terang.", "The moon also shines brightly.", "الْقَمَرُ أَيْضًا يُضِيءُ بُقُوَّة.", "Al-qamaru aydan yuḍīʾu bi-quwwa"),
      sentence("🔢", "Aku menghitung bintang.", "I count the stars.", "عَدَدْتُ النُّجُوم.", "ʿAdadtu an-nujūm"),
      sentence("😴", "Lalu aku tidur dengan nyenyak.", "Then I sleep peacefully.", "ثُمَّ نِمْتُ بِهُدُوء.", "Thumma nimtu bi-hudūʾ")
    ],
    questions: [
      { q: "Kapan cerita ini terjadi?", options: ["Malam hari", "Pagi hari", "Siang hari"], answer: 0 },
      { q: "Bintang berkelip seperti apa?", options: ["Lampu kecil", "Bola besar", "Matahari"], answer: 0 }
    ]
  },
  {
    id: "sekolah",
    title: "Hari Pertama Sekolah",
    titleEn: "The First Day of School",
    titleAr: "أول يوم في المدرسة",
    emoji: "🎒",
    cover: ["🎒", "🏫", "📚"],
    color: "#ff7aa2",
    level: "Mudah",
    sentences: [
      sentence("🎒", "Hari ini hari pertama sekolah.", "Today is the first day of school.", "الْيَوْمَ أَوَّلُ يَوْمٍ فِي الْمَدْرَسَة.", "Al-yawma awwalu yawmin fī al-madrasa"),
      sentence("🏫", "Aku pergi ke sekolah bersama ayah.", "I go to school with my father.", "ذَهَبْتُ إِلَى الْمَدْرَسَةِ مَعَ أَبِي.", "Dhahabtu ilā al-madrasati maʿa abī"),
      sentence("👩‍🏫", "Guru menyambut kami dengan senyum.", "The teacher welcomes us with a smile.", "الْمُعَلِّمَةُ تَسْتَقْبِلُنَا بِابْتِسَامَة.", "Al-muʿallimatu tastaqbilunā bi-ibtisāma"),
      sentence("📚", "Aku mendapat buku baru.", "I get a new book.", "حَصَلْتُ عَلَى كِتَابٍ جَدِيد.", "Ḥaṣaltu ʿalā kitābin jadīd"),
      sentence("🧑‍🤝‍🧑", "Aku duduk di samping teman baru.", "I sit next to a new friend.", "جَلَسْتُ بِجَانِبِ صَدِيقٍ جَدِيد.", "Jalastu bi-jānibi ṣadīqin jadīd"),
      sentence("🔔", "Bel berbunyi, kami pulang.", "The bell rings and we go home.", "رَنَّ الْجَرَسُ وَعُدْنَا إِلَى الْبَيْت.", "Ranna al-jarasu wa-ʿudnā ilā al-bayt")
    ],
    questions: [
      { q: "Apa yang diterima di sekolah?", options: ["Buku baru", "Sepatu baru", "Topi baru"], answer: 0 },
      { q: "Aku duduk di samping siapa?", options: ["Teman baru", "Guru", "Ayah"], answer: 0 }
    ]
  },
  {
    id: "pantai",
    title: "Pergi ke Pantai",
    titleEn: "Going to the Beach",
    titleAr: "الذهاب إلى الشاطئ",
    emoji: "🏖️",
    cover: ["🏖️", "🌊", "🐚"],
    color: "#ffab3d",
    level: "Mudah",
    sentences: [
      sentence("🏖️", "Pada hari libur, kami pergi ke pantai.", "On the holiday, we go to the beach.", "فِي يَوْمِ الْعُطْلَةِ ذَهَبْنَا إِلَى الشَّاطِئ.", "Fī yawmi al-ʿuṭlati dhahabnā ilā ash-shāṭiʾ"),
      sentence("🌊", "Ombaknya biru dan indah.", "The waves are blue and beautiful.", "الْأَمْوَاجُ زَرْقَاءُ وَجَمِيلَة.", "Al-amwāju zarqāʾu wa-jamīla"),
      sentence("🏰", "Aku membuat istana pasir.", "I build a sandcastle.", "بَنَيْتُ قَصْرًا مِنَ الرَّمْل.", "Banaytu qaṣran mina ar-raml"),
      sentence("🐚", "Adik mengumpulkan kerang.", "My little sister collects shells.", "أُخْتِي الصَّغِيرَةُ تَجْمَعُ الْأَصْدَاف.", "Ukhtī aṣ-ṣaghīratu tajmaʿu al-aṣdāf"),
      sentence("🍉", "Kami makan semangka bersama.", "We eat watermelon together.", "أَكَلْنَا الْبَطِّيخَ مَعًا.", "Akalanā al-baṭṭīkha maʿan"),
      sentence("🌅", "Kami pulang saat matahari terbenam.", "We go home at sunset.", "عُدْنَا عِنْدَ غُرُوبِ الشَّمْس.", "ʿUdnā ʿinda ghurūbi ash-shams")
    ],
    questions: [
      { q: "Apa yang dibuat di pantai?", options: ["Istana pasir", "Perahu", "Layang-layang"], answer: 0 },
      { q: "Apa yang dikumpulkan adik?", options: ["Kerang", "Batu", "Daun"], answer: 0 }
    ]
  },
  {
    id: "hujan",
    title: "Hujan di Sore Hari",
    titleEn: "Rain in the Afternoon",
    titleAr: "المطر في العصر",
    emoji: "🌧️",
    cover: ["🌧️", "☂️", "🌈"],
    color: "#4f8cff",
    level: "Sedang",
    sentences: [
      sentence("☁️", "Sore itu langit gelap.", "That afternoon the sky is dark.", "فِي ذَلِكَ الْعَصْرِ كَانَتِ السَّمَاءُ مُظْلِمَة.", "Fī dhālika al-ʿaṣri kānati as-samāʾu muẓlima"),
      sentence("🌧️", "Lalu hujan turun.", "Then the rain falls.", "ثُمَّ نَزَلَ الْمَطَر.", "Thumma nazala al-maṭar"),
      sentence("🧥", "Aku memakai jaket.", "I put on a jacket.", "لَبِسْتُ سُتْرَة.", "Labistu sutra"),
      sentence("☂️", "Ibu membuka payung.", "Mother opens an umbrella.", "فَتَحَتْ أُمِّي الْمِظَلَّة.", "Fataḥat ummī al-miẓalla"),
      sentence("🐸", "Katak bernyanyi di kolam.", "Frogs sing in the pond.", "الضَّفَادِعُ تُغَنِّي فِي الْبِرْكَة.", "Aḍ-ḍafādiʿu tughannī fī al-birka"),
      sentence("🌈", "Setelah hujan, ada pelangi.", "After the rain, there is a rainbow.", "بَعْدَ الْمَطَرِ ظَهَرَ قَوْسُ قُزَح.", "Baʿda al-maṭari ẓahara qawsu quzaḥ")
    ],
    questions: [
      { q: "Apa yang dipakai saat hujan?", options: ["Jaket", "Topi", "Sandal"], answer: 0 },
      { q: "Apa yang muncul setelah hujan?", options: ["Pelangi", "Bulan", "Bintang"], answer: 0 }
    ]
  },
  {
    id: "baju-baru",
    title: "Baju Baru",
    titleEn: "New Clothes",
    titleAr: "ثوب جديد",
    emoji: "👗",
    cover: ["👗", "👞", "🎉"],
    color: "#a06bff",
    level: "Sedang",
    sentences: [
      sentence("🎉", "Besok ada hari raya.", "Tomorrow is the holiday.", "غَدًا الْعِيد.", "Ghadan al-ʿīd"),
      sentence("👗", "Ibu membelikan baju baru.", "Mother buys a new dress.", "اِشْتَرَتْ لِي أُمِّي ثَوْبًا جَدِيدًا.", "Ishtarat lī ummī thawban jadīdan"),
      sentence("👞", "Aku juga punya sepatu baru.", "I also have new shoes.", "لَدَيَّ أَيْضًا حِذَاءٌ جَدِيد.", "Ladayya aydan ḥidhāʾun jadīd"),
      sentence("🧼", "Aku mandi dan memakai wangi-wangian.", "I bathe and put on perfume.", "اِسْتَحْمَمْتُ وَتَعَطَّرْتُ.", "Istaḥmamtu wa-taʿaṭṭartu"),
      sentence("🕌", "Kami pergi salat bersama.", "We go to pray together.", "ذَهَبْنَا إِلَى الصَّلَاةِ مَعًا.", "Dhahabnā ilā aṣ-ṣalāti maʿan"),
      sentence("🤝", "Aku bersalaman dengan tetangga.", "I shake hands with the neighbours.", "صَافَحْتُ الْجِيرَان.", "Ṣāfaḥtu al-jīrān")
    ],
    questions: [
      { q: "Apa yang dibeli Ibu?", options: ["Baju baru", "Buku baru", "Tas baru"], answer: 0 },
      { q: "Dengan siapa aku bersalaman?", options: ["Tetangga", "Guru", "Dokter"], answer: 0 }
    ]
  },
  {
    id: "pagi",
    title: "Pagi yang Sibuk",
    titleEn: "A Busy Morning",
    titleAr: "صباح مزدحم",
    emoji: "🌅",
    cover: ["🌅", "🪥", "🥣"],
    color: "#ffab3d",
    level: "Mudah",
    sentences: [
      sentence("🌅", "Matahari terbit di pagi hari.", "The sun rises in the morning.", "تَشْرُقُ الشَّمْسُ فِي الصَّبَاح.", "Tashruqu ash-shamsu fī aṣ-ṣabāḥ"),
      sentence("⏰", "Aku bangun saat alarm berbunyi.", "I wake up when the alarm rings.", "أَسْتَيْقِظُ عِنْدَمَا يَرِنُّ الْمُنَبِّه.", "Astayqiẓu ʿindamā yarinnu al-munabbih"),
      sentence("🛏️", "Aku merapikan tempat tidur.", "I make my bed.", "أُرَتِّبُ سَرِيرِي.", "Urattibu sarīrī"),
      sentence("🪥", "Aku menyikat gigi.", "I brush my teeth.", "أُنَظِّفُ أَسْنَانِي.", "Unaẓẓifu asnānī"),
      sentence("🚿", "Lalu aku mandi.", "Then I take a bath.", "ثُمَّ أَسْتَحِمُّ.", "Thumma astaḥimmu"),
      sentence("🥣", "Aku sarapan bubur.", "I eat porridge for breakfast.", "أَتَنَاوَلُ الْعَصِيدَةَ فِي الْفُطُور.", "Atanāwalu al-ʿaṣīdata fī al-fuṭūr"),
      sentence("🎒", "Setelah itu aku siap ke sekolah.", "After that I get ready for school.", "بَعْدَ ذَلِكَ أَسْتَعِدُّ لِلْمَدْرَسَة.", "Baʿda dhālika astaʿiddu lil-madrasa")
    ],
    questions: [
      { q: "Apa yang dilakukan setelah bangun?", options: ["Merapikan tempat tidur", "Menonton TV", "Bermain bola"], answer: 0 },
      { q: "Apa sarapan pagi itu?", options: ["Bubur", "Roti", "Nasi goreng"], answer: 0 }
    ]
  },
  {
    id: "taman",
    title: "Bermain di Taman",
    titleEn: "Playing in the Park",
    titleAr: "اللعب في الحديقة",
    emoji: "🌳",
    cover: ["🌳", "⚽", "🦆"],
    color: "#39c98c",
    level: "Sedang",
    sentences: [
      sentence("🌳", "Sore hari aku pergi ke taman.", "In the afternoon I go to the park.", "فِي الْعَصْرِ ذَهَبْتُ إِلَى الْحَدِيقَة.", "Fī al-ʿaṣri dhahabtu ilā al-ḥadīqa"),
      sentence("⚽", "Aku bermain bola dengan teman.", "I play ball with my friend.", "أَلْعَبُ بِالْكُرَةِ مَعَ صَدِيقِي.", "Alʿabu bil-kurati maʿa ṣadīqī"),
      sentence("🦆", "Ada bebek berenang di kolam.", "There are ducks swimming in the pond.", "هُنَاكَ بَطٌّ يَسْبَحُ فِي الْبِرْكَة.", "Hunāka baṭṭun yasbaḥu fī al-birka"),
      sentence("🍦", "Kami membeli es krim.", "We buy ice cream.", "اِشْتَرَيْنَا آيْس كِرِيم.", "Ishtaraynā āys kirīm"),
      sentence("🌇", "Matahari mulai terbenam.", "The sun begins to set.", "بَدَأَتِ الشَّمْسُ تَغْرُب.", "Badaʾati ash-shamsu taghrub"),
      sentence("😊", "Aku berjanji main lagi besok.", "I promise to play again tomorrow.", "وَعَدْتُ نَفْسِي بِاللَّعِبِ غَدًا.", "Waʿadtu nafsī bil-laʿibi ghadan")
    ],
    questions: [
      { q: "Dengan siapa bermain bola?", options: ["Teman", "Guru", "Adik"], answer: 0 },
      { q: "Apa yang dibeli di taman?", options: ["Es krim", "Jus", "Kue"], answer: 0 }
    ]
  },
  {
    id: "dokter-gigi",
    title: "Ke Dokter Gigi",
    titleEn: "Going to the Dentist",
    titleAr: "عند طبيب الأسنان",
    emoji: "🦷",
    cover: ["🦷", "🪥", "😁"],
    color: "#4f8cff",
    level: "Sedang",
    sentences: [
      sentence("🦷", "Gigiku sakit sejak kemarin.", "My tooth has hurt since yesterday.", "سِنِّي يُؤْلِمُنِي مُنْذُ أَمْس.", "Sinnī yuʾlimunī mundhu ams"),
      sentence("🏥", "Ibu membawaku ke dokter gigi.", "Mother takes me to the dentist.", "أَخَذَتْنِي أُمِّي إِلَى طَبِيبِ الْأَسْنَان.", "Akhadhatnī ummī ilā ṭabībi al-asnān"),
      sentence("🪑", "Aku duduk di kursi besar.", "I sit on a big chair.", "جَلَسْتُ عَلَى كُرْسِيٍّ كَبِير.", "Jalastu ʿalā kursiyyin kabīr"),
      sentence("🔦", "Dokter memeriksa gigiku.", "The doctor checks my tooth.", "فَحَصَ الطَّبِيبُ سِنِّي.", "Faḥaṣa aṭ-ṭabību sinnī"),
      sentence("😬", "Sedikit sakit, tapi aku berani.", "It hurts a little, but I am brave.", "يُؤْلِمُ قَلِيلًا لَكِنَّنِي شُجَاع.", "Yuʾlimu qalīlan lākinnanī shujāʿ"),
      sentence("😁", "Sekarang gigiku sehat lagi.", "Now my tooth is healthy again.", "الْآنَ سِنِّي صَحِيحَةٌ مُجَدَّدًا.", "Al-āna sinnī ṣaḥīḥatun mujaddadan")
    ],
    questions: [
      { q: "Siapa yang membawa ke dokter gigi?", options: ["Ibu", "Ayah", "Kakak"], answer: 0 },
      { q: "Bagaimana perasaan anak itu?", options: ["Berani", "Takut", "Sedih"], answer: 0 }
    ]
  }
]

export const STORY_MAP = Object.fromEntries(KID_STORIES.map(story => [story.id, story]))
