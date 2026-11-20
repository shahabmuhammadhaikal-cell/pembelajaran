/**
 * Cerita bergambar untuk mode anak.
 * Satu cerita = beberapa kalimat (ID/EN/AR) + dua pertanyaan pemahaman.
 */

const sentence = (emoji, id, en, ar) => ({ emoji, id, en, ar })

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
      sentence("🐱", "Ini kucing kecil.", "This is a little cat.", "هَذَا قِطٌّ صَغِير."),
      sentence("😺", "Namanya Milo.", "His name is Milo.", "اِسْمُهُ مِيلُو."),
      sentence("🥛", "Milo suka susu.", "Milo likes milk.", "مِيلُو يُحِبُّ الْحَلِيب."),
      sentence("⚽", "Milo juga suka bermain bola.", "Milo also likes to play with a ball.", "مِيلُو يُحِبُّ أَيْضًا اللَّعِبَ بِالْكُرَة."),
      sentence("🛋️", "Milo tidur di sofa.", "Milo sleeps on the sofa.", "مِيلُو يَنَامُ عَلَى الْأَرِيكَة."),
      sentence("😸", "Milo senang sekali.", "Milo is very happy.", "مِيلُو سَعِيدٌ جِدًّا.")
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
      sentence("👩‍👦", "Ibu dan Ali pergi ke pasar.", "Mother and Ali go to the market.", "ذَهَبَتْ أُمِّي وَعَلِيٌّ إِلَى السُّوق."),
      sentence("🏪", "Pasar itu ramai sekali.", "The market is very busy.", "السُّوقُ مُزْدَحِمٌ جِدًّا."),
      sentence("🍎", "Mereka membeli apel merah.", "They buy red apples.", "اِشْتَرَيَا تُفَّاحًا أَحْمَر."),
      sentence("🍌", "Ali membeli pisang.", "Ali buys bananas.", "عَلِيٌّ اِشْتَرَى مَوْزًا."),
      sentence("🥬", "Ibu membeli sayur hijau.", "Mother buys green vegetables.", "أُمِّي اِشْتَرَتْ خُضَارًا خَضْرَاء."),
      sentence("😄", "Mereka pulang dengan gembira.", "They go home happily.", "عَادَا فَرِحَيْن.")
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
      sentence("👨‍👩‍👧", "Ini keluargaku.", "This is my family.", "هَذِهِ عَائِلَتِي."),
      sentence("👨", "Ayahku tinggi.", "My father is tall.", "أَبِي طَوِيل."),
      sentence("👩", "Ibuku baik hati.", "My mother is kind.", "أُمِّي طَيِّبَةُ الْقَلْب."),
      sentence("👧", "Aku punya satu kakak perempuan.", "I have one sister.", "لِي أُخْتٌ وَاحِدَة."),
      sentence("🍚", "Kami suka makan bersama.", "We like to eat together.", "نَحْنُ نُحِبُّ الْأَكْلَ مَعًا."),
      sentence("❤️", "Kami saling menyayangi.", "We love each other.", "نَحْنُ نَتَحَابُّ.")
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
      sentence("🎒", "Hari ini aku pergi ke kebun binatang.", "Today I go to the zoo.", "الْيَوْمَ ذَهَبْتُ إِلَى حَدِيقَةِ الْحَيَوَان."),
      sentence("🦁", "Aku melihat singa besar.", "I see a big lion.", "رَأَيْتُ أَسَدًا كَبِيرًا."),
      sentence("🌳", "Singa itu tidur di bawah pohon.", "The lion sleeps under a tree.", "الْأَسَدُ نَائِمٌ تَحْتَ الشَّجَرَة."),
      sentence("🦒", "Aku juga melihat jerapah.", "I also see a giraffe.", "رَأَيْتُ أَيْضًا زَرَافَة."),
      sentence("📏", "Leher jerapah sangat panjang.", "The giraffe's neck is very long.", "رَقَبَةُ الزَّرَافَةِ طَوِيلَةٌ جِدًّا."),
      sentence("🐵", "Ada monyet yang lucu.", "There is a funny monkey.", "هُنَاكَ قِرْدٌ مُضْحِك."),
      sentence("🍌", "Monyet suka pisang.", "The monkey likes bananas.", "الْقِرْدُ يُحِبُّ الْمَوْز."),
      sentence("😊", "Aku pulang dengan senang.", "I go home happy.", "عُدْتُ مَسْرُورًا.")
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
      sentence("🌌", "Malam ini langit cerah.", "Tonight the sky is clear.", "اللَّيْلَةَ السَّمَاءُ صَافِيَة."),
      sentence("✨", "Ada banyak bintang.", "There are many stars.", "هُنَاكَ نُجُومٌ كَثِيرَة."),
      sentence("💡", "Bintang berkelip seperti lampu kecil.", "The stars twinkle like little lamps.", "النُّجُومُ تَلْمَعُ كَمِصْبَاحٍ صَغِير."),
      sentence("🌕", "Bulan juga bersinar terang.", "The moon also shines brightly.", "الْقَمَرُ أَيْضًا يُضِيءُ بُقُوَّة."),
      sentence("🔢", "Aku menghitung bintang.", "I count the stars.", "عَدَدْتُ النُّجُوم."),
      sentence("😴", "Lalu aku tidur dengan nyenyak.", "Then I sleep peacefully.", "ثُمَّ نِمْتُ بِهُدُوء.")
    ],
    questions: [
      { q: "Kapan cerita ini terjadi?", options: ["Malam hari", "Pagi hari", "Siang hari"], answer: 0 },
      { q: "Bintang berkelip seperti apa?", options: ["Lampu kecil", "Bola besar", "Matahari"], answer: 0 }
    ]
  }
]

export const STORY_MAP = Object.fromEntries(KID_STORIES.map(story => [story.id, story]))
