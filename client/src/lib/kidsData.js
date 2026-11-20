/**
 * Kurikulum "Mode Anak": kosakata bergambar (emoji/bentuk) + audio 3 bahasa.
 * Setiap item:
 *   key      - id unik
 *   emoji    - ilustrasi besar
 *   en/ar/id - kata dalam tiga bahasa
 *   tr       - transliterasi latin untuk kata Arab
 *   big      - huruf/angka besar yang ditampilkan (opsional)
 *   hex      - warna (topik Warna)
 *   shape    - bentuk CSS (topik Bentuk)
 *   sample   - contoh kata huruf Arab (opsional)
 */

import { KID_STORIES } from "./kidsStories.js"

const item = (key, emoji, en, ar, tr, id, extra = {}) => ({ key, emoji, en, ar, tr, id, ...extra })

export const KID_TOPICS = [
  {
    id: "alphabet",
    label: "ABC",
    emoji: "🔤",
    color: "#ff7aa2",
    blurb: "Huruf A sampai Z",
    items: [
      item("a", "🍎", "Apple", "تُفَّاحَة", "Tuffāḥa", "Apel", { big: "A" }),
      item("b", "⚽", "Ball", "كُرَة", "Kura", "Bola", { big: "B" }),
      item("c", "🐱", "Cat", "قِطّ", "Qiṭṭ", "Kucing", { big: "C" }),
      item("d", "🐶", "Dog", "كَلْب", "Kalb", "Anjing", { big: "D" }),
      item("e", "🥚", "Egg", "بَيْضَة", "Bayḍa", "Telur", { big: "E" }),
      item("f", "🐟", "Fish", "سَمَكَة", "Samaka", "Ikan", { big: "F" }),
      item("g", "🍇", "Grapes", "عِنَب", "ʿInab", "Anggur", { big: "G" }),
      item("h", "👒", "Hat", "قُبَّعَة", "Qubbaʿa", "Topi", { big: "H" }),
      item("i", "🍦", "Ice cream", "آيْس كِرِيم", "Āys krīm", "Es krim", { big: "I" }),
      item("j", "🧃", "Juice", "عَصِير", "ʿAṣīr", "Jus", { big: "J" }),
      item("k", "🪁", "Kite", "طَائِرَة وَرَقِيَّة", "Ṭāʾira waraqiyya", "Layang-layang", { big: "K" }),
      item("l", "🦁", "Lion", "أَسَد", "Asad", "Singa", { big: "L" }),
      item("m", "🌙", "Moon", "قَمَر", "Qamar", "Bulan", { big: "M" }),
      item("n", "🪺", "Nest", "عُشّ", "ʿUshsh", "Sarang", { big: "N" }),
      item("o", "🍊", "Orange", "بُرْتُقَال", "Burtuqāl", "Jeruk", { big: "O" }),
      item("p", "🐼", "Panda", "بَانْدَا", "Bāndā", "Panda", { big: "P" }),
      item("q", "👑", "Queen", "مَلِكَة", "Malika", "Ratu", { big: "Q" }),
      item("r", "🌈", "Rainbow", "قَوْس قُزَح", "Qaws quzaḥ", "Pelangi", { big: "R" }),
      item("s", "☀️", "Sun", "شَمْس", "Shams", "Matahari", { big: "S" }),
      item("t", "🌳", "Tree", "شَجَرَة", "Shajara", "Pohon", { big: "T" }),
      item("u", "☂️", "Umbrella", "مِظَلَّة", "Miẓalla", "Payung", { big: "U" }),
      item("v", "🎻", "Violin", "كَمَان", "Kamān", "Biola", { big: "V" }),
      item("w", "💧", "Water", "مَاء", "Māʾ", "Air", { big: "W" }),
      item("x", "🎼", "Xylophone", "زَايْلُوفُون", "Zāylūfūn", "Xilofon", { big: "X" }),
      item("y", "🪀", "Yo-yo", "يُويُو", "Yūyū", "Yo-yo", { big: "Y" }),
      item("z", "🦓", "Zebra", "حِمَار وَحْشِيّ", "Ḥimār waḥshī", "Zebra", { big: "Z" })
    ]
  },
  {
    id: "numbers",
    label: "Angka",
    emoji: "🔢",
    color: "#ffab3d",
    blurb: "Hitung 1 sampai 20",
    items: [
      item("n1", "🔢", "One", "وَاحِد", "Wāḥid", "Satu", { big: "1", numeral: 1 }),
      item("n2", "🔢", "Two", "اِثْنَان", "Ithnān", "Dua", { big: "2", numeral: 2 }),
      item("n3", "🔢", "Three", "ثَلَاثَة", "Thalātha", "Tiga", { big: "3", numeral: 3 }),
      item("n4", "🔢", "Four", "أَرْبَعَة", "Arbaʿa", "Empat", { big: "4", numeral: 4 }),
      item("n5", "🔢", "Five", "خَمْسَة", "Khamsa", "Lima", { big: "5", numeral: 5 }),
      item("n6", "🔢", "Six", "سِتَّة", "Sitta", "Enam", { big: "6", numeral: 6 }),
      item("n7", "🔢", "Seven", "سَبْعَة", "Sabʿa", "Tujuh", { big: "7", numeral: 7 }),
      item("n8", "🔢", "Eight", "ثَمَانِيَة", "Thamāniya", "Delapan", { big: "8", numeral: 8 }),
      item("n9", "🔢", "Nine", "تِسْعَة", "Tisʿa", "Sembilan", { big: "9", numeral: 9 }),
      item("n10", "🔢", "Ten", "عَشَرَة", "ʿAshara", "Sepuluh", { big: "10", numeral: 10 }),
      item("n11", "🔢", "Eleven", "أَحَدَ عَشَر", "Aḥada ʿashar", "Sebelas", { big: "11", numeral: 11 }),
      item("n12", "🔢", "Twelve", "اِثْنَا عَشَر", "Ithnā ʿashar", "Dua belas", { big: "12", numeral: 12 }),
      item("n13", "🔢", "Thirteen", "ثَلَاثَةَ عَشَر", "Thalāthata ʿashar", "Tiga belas", { big: "13", numeral: 13 }),
      item("n14", "🔢", "Fourteen", "أَرْبَعَةَ عَشَر", "Arbaʿata ʿashar", "Empat belas", { big: "14", numeral: 14 }),
      item("n15", "🔢", "Fifteen", "خَمْسَةَ عَشَر", "Khamsata ʿashar", "Lima belas", { big: "15", numeral: 15 }),
      item("n16", "🔢", "Sixteen", "سِتَّةَ عَشَر", "Sittata ʿashar", "Enam belas", { big: "16", numeral: 16 }),
      item("n17", "🔢", "Seventeen", "سَبْعَةَ عَشَر", "Sabʿata ʿashar", "Tujuh belas", { big: "17", numeral: 17 }),
      item("n18", "🔢", "Eighteen", "ثَمَانِيَةَ عَشَر", "Thamāniyata ʿashar", "Delapan belas", { big: "18", numeral: 18 }),
      item("n19", "🔢", "Nineteen", "تِسْعَةَ عَشَر", "Tisʿata ʿashar", "Sembilan belas", { big: "19", numeral: 19 }),
      item("n20", "🔢", "Twenty", "عِشْرُون", "ʿIshrūn", "Dua puluh", { big: "20", numeral: 20 })
    ]
  },
  {
    id: "colors",
    label: "Warna",
    emoji: "🎨",
    color: "#a06bff",
    blurb: "Kenali warna-warni",
    items: [
      item("red", "🔴", "Red", "أَحْمَر", "Aḥmar", "Merah", { hex: "#ef4444" }),
      item("blue", "🔵", "Blue", "أَزْرَق", "Azraq", "Biru", { hex: "#3b82f6" }),
      item("green", "🟢", "Green", "أَخْضَر", "Akhḍar", "Hijau", { hex: "#22c55e" }),
      item("yellow", "🟡", "Yellow", "أَصْفَر", "Aṣfar", "Kuning", { hex: "#facc15" }),
      item("orange", "🟠", "Orange", "بُرْتُقَالِيّ", "Burtuqālī", "Jingga", { hex: "#f97316" }),
      item("purple", "🟣", "Purple", "بَنَفْسَجِيّ", "Banafsajī", "Ungu", { hex: "#a855f7" }),
      item("pink", "🩷", "Pink", "وَرْدِيّ", "Wardī", "Merah muda", { hex: "#ec4899" }),
      item("brown", "🟤", "Brown", "بُنِّيّ", "Bunnī", "Cokelat", { hex: "#a16207" }),
      item("black", "⚫", "Black", "أَسْوَد", "Aswad", "Hitam", { hex: "#1f2937" }),
      item("white", "⚪", "White", "أَبْيَض", "Abyaḍ", "Putih", { hex: "#ffffff" })
    ]
  },
  {
    id: "animals",
    label: "Hewan",
    emoji: "🦁",
    color: "#39c98c",
    blurb: "Sahabat binatang",
    items: [
      item("cat", "🐱", "Cat", "قِطّ", "Qiṭṭ", "Kucing"),
      item("dog", "🐶", "Dog", "كَلْب", "Kalb", "Anjing"),
      item("lion", "🦁", "Lion", "أَسَد", "Asad", "Singa"),
      item("elephant", "🐘", "Elephant", "فِيل", "Fīl", "Gajah"),
      item("monkey", "🐵", "Monkey", "قِرْد", "Qird", "Monyet"),
      item("cow", "🐮", "Cow", "بَقَرَة", "Baqara", "Sapi"),
      item("sheep", "🐑", "Sheep", "خَرُوف", "Kharūf", "Domba"),
      item("horse", "🐴", "Horse", "حِصَان", "Ḥiṣān", "Kuda"),
      item("chicken", "🐔", "Chicken", "دَجَاجَة", "Dajāja", "Ayam"),
      item("fish", "🐟", "Fish", "سَمَكَة", "Samaka", "Ikan"),
      item("rabbit", "🐰", "Rabbit", "أَرْنَب", "Arnab", "Kelinci"),
      item("duck", "🦆", "Duck", "بَطَّة", "Baṭṭa", "Bebek"),
      item("mouse", "🐭", "Mouse", "فَأْر", "Faʾr", "Tikus"),
      item("bear", "🐻", "Bear", "دُبّ", "Dubb", "Beruang"),
      item("giraffe", "🦒", "Giraffe", "زَرَافَة", "Zarāfa", "Jerapah"),
      item("turtle", "🐢", "Turtle", "سُلَحْفَاة", "Sulaḥfāh", "Kura-kura")
    ]
  },
  {
    id: "fruits",
    label: "Buah",
    emoji: "🍎",
    color: "#ff6b6b",
    blurb: "Buah segar manis",
    items: [
      item("apple", "🍎", "Apple", "تُفَّاحَة", "Tuffāḥa", "Apel"),
      item("banana", "🍌", "Banana", "مَوْز", "Mawz", "Pisang"),
      item("orange-f", "🍊", "Orange", "بُرْتُقَال", "Burtuqāl", "Jeruk"),
      item("grapes", "🍇", "Grapes", "عِنَب", "ʿInab", "Anggur"),
      item("strawberry", "🍓", "Strawberry", "فَرَاوِلَة", "Farāwila", "Stroberi"),
      item("watermelon", "🍉", "Watermelon", "بَطِّيخ", "Baṭṭīkh", "Semangka"),
      item("pineapple", "🍍", "Pineapple", "أَنَانَاس", "Anānās", "Nanas"),
      item("mango", "🥭", "Mango", "مَانْجُو", "Mānjū", "Mangga"),
      item("cherry", "🍒", "Cherry", "كَرَز", "Karaz", "Ceri"),
      item("lemon", "🍋", "Lemon", "لَيْمُون", "Laymūn", "Lemon"),
      item("peach", "🍑", "Peach", "خَوْخ", "Khawkh", "Persik"),
      item("pear", "🍐", "Pear", "كُمَّثْرَى", "Kummathrā", "Pir")
    ]
  },
  {
    id: "family",
    label: "Keluarga",
    emoji: "👨‍👩‍👧",
    color: "#4f8cff",
    blurb: "Orang-orang tersayang",
    items: [
      item("mother", "👩", "Mother", "أُمّ", "Umm", "Ibu"),
      item("father", "👨", "Father", "أَب", "Ab", "Ayah"),
      item("sister", "👧", "Sister", "أُخْت", "Ukht", "Kakak perempuan"),
      item("brother", "👦", "Brother", "أَخ", "Akh", "Kakak laki-laki"),
      item("grandfather", "👴", "Grandfather", "جَدّ", "Jadd", "Kakek"),
      item("grandmother", "👵", "Grandmother", "جَدَّة", "Jadda", "Nenek"),
      item("son", "🧒", "Son", "اِبْن", "Ibn", "Anak laki-laki"),
      item("daughter", "👶", "Daughter", "بِنْت", "Bint", "Anak perempuan"),
      item("uncle", "🧔", "Uncle", "عَمّ", "ʿAmm", "Paman"),
      item("aunt", "👩‍🦱", "Aunt", "خَالَة", "Khāla", "Bibi")
    ]
  },
  {
    id: "body",
    label: "Tubuhku",
    emoji: "🧒",
    color: "#2dd4bf",
    blurb: "Kenali anggota tubuh",
    items: [
      item("head", "🙂", "Head", "رَأْس", "Raʾs", "Kepala"),
      item("eye", "👁️", "Eye", "عَيْن", "ʿAyn", "Mata"),
      item("nose", "👃", "Nose", "أَنْف", "Anf", "Hidung"),
      item("mouth", "👄", "Mouth", "فَم", "Fam", "Mulut"),
      item("ear", "👂", "Ear", "أُذُن", "Udhun", "Telinga"),
      item("hand", "✋", "Hand", "يَد", "Yad", "Tangan"),
      item("foot", "🦶", "Foot", "قَدَم", "Qadam", "Kaki"),
      item("hair", "💇", "Hair", "شَعْر", "Shaʿr", "Rambut"),
      item("tooth", "🦷", "Tooth", "سِنّ", "Sinn", "Gigi"),
      item("tongue", "👅", "Tongue", "لِسَان", "Lisān", "Lidah"),
      item("belly", "🫃", "Belly", "بَطْن", "Baṭn", "Perut"),
      item("heart", "❤️", "Heart", "قَلْب", "Qalb", "Jantung")
    ]
  },
  {
    id: "shapes",
    label: "Bentuk",
    emoji: "🔷",
    color: "#ffd43b",
    blurb: "Bentuk di sekitar kita",
    items: [
      item("circle", "⭕", "Circle", "دَائِرَة", "Dāʾira", "Lingkaran", { shape: "circle" }),
      item("square", "🟦", "Square", "مُرَبَّع", "Murabbaʿ", "Persegi", { shape: "square" }),
      item("triangle", "🔺", "Triangle", "مُثَلَّث", "Muthallath", "Segitiga", { shape: "triangle" }),
      item("rectangle", "▭", "Rectangle", "مُسْتَطِيل", "Mustaṭīl", "Persegi panjang", { shape: "rectangle" }),
      item("star", "⭐", "Star", "نَجْمَة", "Najma", "Bintang", { shape: "star" }),
      item("heart-s", "❤️", "Heart", "قَلْب", "Qalb", "Hati", { shape: "heart" }),
      item("diamond", "🔶", "Diamond", "مُعَيَّن", "Muʿayyan", "Belah ketupat", { shape: "diamond" }),
      item("crescent", "🌙", "Crescent", "هِلَال", "Hilāl", "Bulan sabit", { shape: "crescent" })
    ]
  },
  {
    id: "hijaiyah",
    label: "Huruf Arab",
    emoji: "🕌",
    color: "#8b5cf6",
    blurb: "Huruf hijaiyah 28",
    items: [
      item("alif", "🦁", "Alif", "أَلِف", "Alif", "Alif", { big: "ا", sample: "أَسَد", sampleId: "Singa" }),
      item("ba", "🦆", "Ba", "بَاء", "Bāʾ", "Ba", { big: "ب", sample: "بَطَّة", sampleId: "Bebek" }),
      item("ta", "🍎", "Ta", "تَاء", "Tāʾ", "Ta", { big: "ت", sample: "تُفَّاحَة", sampleId: "Apel" }),
      item("tsa", "🦊", "Tsa", "ثَاء", "Thāʾ", "Tsa", { big: "ث", sample: "ثَعْلَب", sampleId: "Rubah" }),
      item("jim", "🐪", "Jim", "جِيم", "Jīm", "Jim", { big: "ج", sample: "جَمَل", sampleId: "Unta" }),
      item("ha", "🐴", "Ha", "حَاء", "Ḥāʾ", "Ha", { big: "ح", sample: "حِصَان", sampleId: "Kuda" }),
      item("kha", "🐑", "Kha", "خَاء", "Khāʾ", "Kha", { big: "خ", sample: "خَرُوف", sampleId: "Domba" }),
      item("dal", "🐻", "Dal", "دَال", "Dāl", "Dal", { big: "د", sample: "دُبّ", sampleId: "Beruang" }),
      item("dzal", "🐺", "Dzal", "ذَال", "Dhāl", "Dzal", { big: "ذ", sample: "ذِئْب", sampleId: "Serigala" }),
      item("ra", "🦃", "Ra", "رَاء", "Rāʾ", "Ra", { big: "ر", sample: "رُومِيّ", sampleId: "Kalkun" }),
      item("zai", "🦒", "Zai", "زَاي", "Zāy", "Zai", { big: "ز", sample: "زَرَافَة", sampleId: "Jerapah" }),
      item("sin", "🐟", "Sin", "سِين", "Sīn", "Sin", { big: "س", sample: "سَمَكَة", sampleId: "Ikan" }),
      item("syin", "☀️", "Syin", "شِين", "Shīn", "Syin", { big: "ش", sample: "شَمْس", sampleId: "Matahari" }),
      item("shad", "🦅", "Shad", "صَاد", "Ṣād", "Shad", { big: "ص", sample: "صَقْر", sampleId: "Elang" }),
      item("dhad", "🐸", "Dhad", "ضَاد", "Ḍād", "Dhad", { big: "ض", sample: "ضِفْدَع", sampleId: "Katak" }),
      item("tha", "🐦", "Tha", "طَاء", "Ṭāʾ", "Tha", { big: "ط", sample: "طَائِر", sampleId: "Burung" }),
      item("zha", "✉️", "Zha", "ظَاء", "Ẓāʾ", "Zha", { big: "ظ", sample: "ظَرْف", sampleId: "Amplop" }),
      item("ain", "👁️", "Ain", "عَيْن", "ʿAyn", "Ain", { big: "ع", sample: "عَيْن", sampleId: "Mata" }),
      item("ghain", "🦌", "Ghain", "غَيْن", "Ghayn", "Ghain", { big: "غ", sample: "غَزَال", sampleId: "Rusa" }),
      item("fa", "🐘", "Fa", "فَاء", "Fāʾ", "Fa", { big: "ف", sample: "فِيل", sampleId: "Gajah" }),
      item("qaf", "🌙", "Qaf", "قَاف", "Qāf", "Qaf", { big: "ق", sample: "قَمَر", sampleId: "Bulan" }),
      item("kaf", "📚", "Kaf", "كَاف", "Kāf", "Kaf", { big: "ك", sample: "كِتَاب", sampleId: "Buku" }),
      item("lam", "🍋", "Lam", "لَام", "Lām", "Lam", { big: "ل", sample: "لَيْمُون", sampleId: "Lemon" }),
      item("mim", "🍌", "Mim", "مِيم", "Mīm", "Mim", { big: "م", sample: "مَوْز", sampleId: "Pisang" }),
      item("nun", "⭐", "Nun", "نُون", "Nūn", "Nun", { big: "ن", sample: "نَجْمَة", sampleId: "Bintang" }),
      item("wau", "🌹", "Wau", "وَاو", "Wāw", "Wau", { big: "و", sample: "وَرْدَة", sampleId: "Bunga" }),
      item("haa", "🌙", "Ha", "هَاء", "Hāʾ", "Ha besar", { big: "ه", sample: "هِلَال", sampleId: "Bulan sabit" }),
      item("ya", "✋", "Ya", "يَاء", "Yāʾ", "Ya", { big: "ي", sample: "يَد", sampleId: "Tangan" })
    ]
  },
  {
    id: "greetings",
    label: "Sapaan",
    emoji: "👋",
    color: "#22b8a6",
    blurb: "Frasa ramah tiap hari",
    items: [
      item("hello", "👋", "Hello", "مَرْحَبًا", "Marḥaban", "Halo"),
      item("goodmorning", "🌅", "Good morning", "صَبَاح الْخَيْر", "Ṣabāḥ al-khayr", "Selamat pagi"),
      item("goodevening", "🌆", "Good evening", "مَسَاء الْخَيْر", "Masāʾ al-khayr", "Selamat malam"),
      item("howareyou", "🙂", "How are you?", "كَيْفَ حَالُكَ؟", "Kayfa ḥāluk?", "Apa kabar?"),
      item("imfine", "😊", "I am fine", "أَنَا بِخَيْر", "Anā bikhayr", "Saya baik"),
      item("thankyou", "🙏", "Thank you", "شُكْرًا", "Shukran", "Terima kasih"),
      item("please", "🥺", "Please", "مِنْ فَضْلِكَ", "Min faḍlik", "Tolong"),
      item("yes", "✅", "Yes", "نَعَم", "Naʿam", "Ya"),
      item("no", "❌", "No", "لَا", "Lā", "Tidak"),
      item("goodbye", "🚪", "Goodbye", "وَدَاعًا", "Wadāʿan", "Selamat tinggal"),
      item("myname", "🏷️", "My name is…", "اِسْمِي…", "Ismī…", "Nama saya…"),
      item("iloveyou", "💖", "I love you", "أُحِبُّكَ", "Uḥibbuka", "Aku sayang kamu")
    ]
  },
  {
    id: "verbs",
    label: "Kata Kerja",
    emoji: "🏃",
    color: "#f97316",
    blurb: "Kegiatan sehari-hari",
    items: [
      item("v-run", "🏃", "Run", "يَجْرِي", "Yajrī", "Berlari"),
      item("v-jump", "🦘", "Jump", "يَقْفِز", "Yaqfiz", "Melompat"),
      item("v-eat", "🥣", "Eat", "يَأْكُل", "Yaʾkul", "Makan"),
      item("v-drink", "🥤", "Drink", "يَشْرَب", "Yashrab", "Minum"),
      item("v-sleep", "😴", "Sleep", "يَنَام", "Yanām", "Tidur"),
      item("v-read", "📖", "Read", "يَقْرَأ", "Yaqraʾ", "Membaca"),
      item("v-write", "✍️", "Write", "يَكْتُب", "Yaktub", "Menulis"),
      item("v-play", "🎮", "Play", "يَلْعَب", "Yalʿab", "Bermain"),
      item("v-sing", "🎤", "Sing", "يُغَنِّي", "Yughannī", "Bernyanyi"),
      item("v-swim", "🏊", "Swim", "يَسْبَح", "Yasbaḥ", "Berenang"),
      item("v-draw", "🎨", "Draw", "يَرْسُم", "Yarsum", "Menggambar"),
      item("v-smile", "😊", "Smile", "يَبْتَسِم", "Yabtasim", "Tersenyum")
    ]
  },
  {
    id: "food",
    label: "Makanan",
    emoji: "🍚",
    color: "#d97706",
    blurb: "Di meja makan",
    items: [
      item("fd-rice", "🍚", "Rice", "أَرُزّ", "Aruzz", "Nasi"),
      item("fd-bread", "🍞", "Bread", "خُبْز", "Khubz", "Roti"),
      item("fd-milk", "🥛", "Milk", "حَلِيب", "Ḥalīb", "Susu"),
      item("fd-water", "💧", "Water", "مَاء", "Māʾ", "Air"),
      item("fd-egg", "🥚", "Egg", "بَيْضَة", "Bayḍa", "Telur"),
      item("fd-chicken", "🍗", "Chicken", "دَجَاج", "Dajāj", "Ayam"),
      item("fd-fish", "🐟", "Fish", "سَمَك", "Samak", "Ikan"),
      item("fd-cheese", "🧀", "Cheese", "جُبْن", "Jubn", "Keju"),
      item("fd-cake", "🍰", "Cake", "كَعْك", "Kaʿk", "Kue"),
      item("fd-honey", "🍯", "Honey", "عَسَل", "ʿAsal", "Madu"),
      item("fd-soup", "🍲", "Soup", "شُورْبَا", "Shūrbā", "Sup"),
      item("fd-tea", "🍵", "Tea", "شَاي", "Shāy", "Teh")
    ]
  },
  {
    id: "transport",
    label: "Kendaraan",
    emoji: "🚗",
    color: "#0ea5e9",
    blurb: "Cara kita bepergian",
    items: [
      item("tr-car", "🚗", "Car", "سَيَّارَة", "Sayyāra", "Mobil"),
      item("tr-bus", "🚌", "Bus", "حَافِلَة", "Ḥāfila", "Bus"),
      item("tr-bicycle", "🚲", "Bicycle", "دَرَّاجَة", "Darrāja", "Sepeda"),
      item("tr-train", "🚂", "Train", "قِطَار", "Qiṭār", "Kereta"),
      item("tr-plane", "✈️", "Airplane", "طَائِرَة", "Ṭāʾira", "Pesawat"),
      item("tr-boat", "⛵", "Boat", "قَارِب", "Qārib", "Perahu"),
      item("tr-motorcycle", "🏍️", "Motorcycle", "دَرَّاجَة نَارِيَّة", "Darrāja nāriyya", "Motor"),
      item("tr-truck", "🚚", "Truck", "شَاحِنَة", "Shāḥina", "Truk"),
      item("tr-helicopter", "🚁", "Helicopter", "مِرْوَحِيَّة", "Mirwaḥiyya", "Helikopter"),
      item("tr-rocket", "🚀", "Rocket", "صَارُوخ", "Ṣārūkh", "Roket")
    ]
  },
  {
    id: "nature",
    label: "Alam",
    emoji: "🌳",
    color: "#16a34a",
    blurb: "Keindahan sekitar kita",
    items: [
      item("nt-sun", "☀️", "Sun", "شَمْس", "Shams", "Matahari"),
      item("nt-moon", "🌙", "Moon", "قَمَر", "Qamar", "Bulan"),
      item("nt-star", "⭐", "Star", "نَجْمَة", "Najma", "Bintang"),
      item("nt-tree", "🌳", "Tree", "شَجَرَة", "Shajara", "Pohon"),
      item("nt-flower", "🌸", "Flower", "زَهْرَة", "Zahra", "Bunga"),
      item("nt-mountain", "⛰️", "Mountain", "جَبَل", "Jabal", "Gunung"),
      item("nt-river", "🏞️", "River", "نَهْر", "Nahr", "Sungai"),
      item("nt-sea", "🌊", "Sea", "بَحْر", "Baḥr", "Laut"),
      item("nt-cloud", "☁️", "Cloud", "سَحَابَة", "Saḥāba", "Awan"),
      item("nt-rain", "🌧️", "Rain", "مَطَر", "Maṭar", "Hujan")
    ]
  },
  {
    id: "home",
    label: "Rumah",
    emoji: "🏠",
    color: "#db2777",
    blurb: "Benda di dalam rumah",
    items: [
      item("hm-house", "🏠", "House", "بَيْت", "Bayt", "Rumah"),
      item("hm-door", "🚪", "Door", "بَاب", "Bāb", "Pintu"),
      item("hm-window", "🪟", "Window", "نَافِذَة", "Nāfidha", "Jendela"),
      item("hm-bed", "🛏️", "Bed", "سَرِير", "Sarīr", "Tempat tidur"),
      item("hm-chair", "🪑", "Chair", "كُرْسِيّ", "Kursī", "Kursi"),
      item("hm-lamp", "💡", "Lamp", "مِصْبَاح", "Miṣbāḥ", "Lampu"),
      item("hm-key", "🔑", "Key", "مِفْتَاح", "Miftāḥ", "Kunci"),
      item("hm-clock", "⏰", "Clock", "سَاعَة", "Sāʿa", "Jam"),
      item("hm-spoon", "🥄", "Spoon", "مِلْعَقَة", "Milʿaqa", "Sendok"),
      item("hm-soap", "🧼", "Soap", "صَابُون", "Ṣābūn", "Sabun")
    ]
  },
  {
    id: "clothes",
    label: "Pakaian",
    emoji: "👕",
    color: "#7c3aed",
    blurb: "Yang kita pakai",
    items: [
      item("cl-shirt", "👕", "Shirt", "قَمِيص", "Qamīṣ", "Kemeja"),
      item("cl-pants", "👖", "Pants", "بَنْطَلُون", "Banṭalūn", "Celana"),
      item("cl-shoes", "👟", "Shoes", "حِذَاء", "Ḥidhāʾ", "Sepatu"),
      item("cl-hat", "🎩", "Hat", "قُبَّعَة", "Qubbaʿa", "Topi"),
      item("cl-dress", "👗", "Dress", "فُسْتَان", "Fustān", "Gaun"),
      item("cl-socks", "🧦", "Socks", "جَوْرَب", "Jawrab", "Kaus kaki"),
      item("cl-jacket", "🧥", "Jacket", "سُتْرَة", "Sutra", "Jaket"),
      item("cl-glasses", "👓", "Glasses", "نَظَّارَة", "Naẓẓāra", "Kacamata"),
      item("cl-bag", "🎒", "Bag", "حَقِيبَة", "Ḥaqība", "Tas"),
      item("cl-umbrella", "☂️", "Umbrella", "مِظَلَّة", "Miẓalla", "Payung")
    ]
  },
  {
    id: "feelings",
    label: "Perasaan",
    emoji: "😊",
    color: "#0891b2",
    blurb: "Kenali rasa di hati",
    items: [
      item("fl-happy", "😄", "Happy", "سَعِيد", "Saʿīd", "Senang"),
      item("fl-sad", "😢", "Sad", "حَزِين", "Ḥazīn", "Sedih"),
      item("fl-angry", "😠", "Angry", "غَاضِب", "Ghāḍib", "Marah"),
      item("fl-tired", "😫", "Tired", "مُتْعَب", "Mutʿab", "Lelah"),
      item("fl-hungry", "🤤", "Hungry", "جَائِع", "Jāʾiʿ", "Lapar"),
      item("fl-thirsty", "🚰", "Thirsty", "عَطْشَان", "ʿAṭshān", "Haus"),
      item("fl-scared", "😨", "Scared", "خَائِف", "Khāʾif", "Takut"),
      item("fl-sleepy", "🥱", "Sleepy", "نَاعِس", "Nāʿis", "Mengantuk"),
      item("fl-excited", "🤩", "Excited", "مُتَحَمِّس", "Mutaḥammis", "Bersemangat"),
      item("fl-calm", "😌", "Calm", "هَادِئ", "Hādiʾ", "Tenang")
    ]
  },
  {
    id: "weather",
    label: "Cuaca",
    emoji: "🌦️",
    color: "#e11d48",
    blurb: "Langit hari ini",
    items: [
      item("wc-sunny", "☀️", "Sunny", "مُشْمِس", "Mushmis", "Cerah"),
      item("wc-rainy", "🌧️", "Rainy", "مُمْطِر", "Mumṭir", "Hujan"),
      item("wc-cloudy", "☁️", "Cloudy", "غَائِم", "Ghāʾim", "Berawan"),
      item("wc-windy", "🌬️", "Windy", "عَاصِف", "ʿĀṣif", "Berangin"),
      item("wc-hot", "🔥", "Hot", "حَار", "Ḥārr", "Panas"),
      item("wc-cold", "❄️", "Cold", "بَارِد", "Bārid", "Dingin"),
      item("wc-snow", "🌨️", "Snow", "ثَلْج", "Thalj", "Salju"),
      item("wc-rainbow", "🌈", "Rainbow", "قَوْس قُزَح", "Qaws quzaḥ", "Pelangi"),
      item("wc-storm", "⛈️", "Storm", "عَاصِفَة", "ʿĀṣifa", "Badai"),
      item("wc-fog", "🌫️", "Fog", "ضَبَاب", "Ḍabāb", "Kabut")
    ]
  }
]

export const TOPIC_MAP = Object.fromEntries(KID_TOPICS.map(topic => [topic.id, topic]))

export const KID_STAR_MILESTONES = [
  { stars: 1, id: "star-1" },
  { stars: 15, id: "star-15" },
  { stars: 40, id: "star-40" },
  { stars: 80, id: "star-80" },
  { stars: 150, id: "star-150" }
]

export const KID_STICKERS = [
  { id: "star-1", emoji: "🌟", name: "Bintang Pertama", hint: "Kumpulkan 1 bintang" },
  { id: "star-15", emoji: "🍭", name: "Pemula Manis", hint: "Kumpulkan 15 bintang" },
  { id: "star-40", emoji: "🚀", name: "Roket Cerdas", hint: "Kumpulkan 40 bintang" },
  { id: "star-80", emoji: "🏆", name: "Juara Kelas", hint: "Kumpulkan 80 bintang" },
  { id: "star-150", emoji: "👑", name: "Raja Kata", hint: "Kumpulkan 150 bintang" },
  ...KID_TOPICS.map(topic => ({
    id: `topic-${topic.id}`,
    emoji: topic.emoji,
    name: `Selesai ${topic.label}`,
    hint: `Tuntaskan topik ${topic.label}`
  })),
  ...KID_STORIES.map(story => ({
    id: `story-${story.id}`,
    emoji: "📖",
    name: `Cerita ${story.title}`,
    hint: `Selesaikan cerita ${story.title}`
  })),
  { id: "game-listen", emoji: "🎧", name: "Telinga Emas", hint: "Skor 8+ di Dengar & Pilih" },
  { id: "game-guess", emoji: "🔍", name: "Detektif Kata", hint: "Skor 6+ di Tebak Kata" },
  { id: "game-spell", emoji: "✏️", name: "Jago Menyusun", hint: "Skor 4+ di Susun Kata" },
  { id: "game-match", emoji: "🧩", name: "Jago Mencocokkan", hint: "Selesaikan Cocokkan Kartu" },
  { id: "game-count", emoji: "🔢", name: "Sahabat Angka", hint: "Selesaikan Hitung Yuk" }
]

export const STICKER_MAP = Object.fromEntries(KID_STICKERS.map(sticker => [sticker.id, sticker]))

/**
 * Semua item bergambar — bahan permainan.
 * Huruf hijaiyah tidak dipakai karena gambarnya hanya contoh kata, bukan arti.
 */
export const KID_PLAY_ITEMS = KID_TOPICS.filter(topic => topic.id !== "hijaiyah").flatMap(topic =>
  topic.items
    .filter(entry => entry.emoji && entry.emoji !== "🔢")
    .map(entry => ({ ...entry, topic: topic.id, topicLabel: topic.label }))
)

/* ---------- level, XP, dan bahan permainan tambahan ---------- */

/** Tingkatan anak ditentukan dari jumlah bintang yang sudah dikumpulkan. */
export const KID_LEVELS = [
  { level: 1, min: 0, avatar: "🐣", title: "Pemula" },
  { level: 2, min: 15, avatar: "🦉", title: "Penjelajah" },
  { level: 3, min: 40, avatar: "🐧", title: "Pembelajar" },
  { level: 4, min: 80, avatar: "🦅", title: "Bintang" },
  { level: 5, min: 130, avatar: "🦄", title: "Juara" },
  { level: 6, min: 200, avatar: "👑", title: "Legenda" }
]

export function levelFromStars(stars = 0) {
  let current = KID_LEVELS[0]
  for (const entry of KID_LEVELS) {
    if (stars >= entry.min) current = entry
  }
  return current
}

export function nextLevelFromStars(stars = 0) {
  return KID_LEVELS.find(entry => entry.min > stars) || null
}

export function levelProgress(stars = 0) {
  const current = levelFromStars(stars)
  const next = nextLevelFromStars(stars)
  if (!next) return { current, next: null, percent: 100 }
  const span = Math.max(1, next.min - current.min)
  const percent = Math.round(((stars - current.min) / span) * 100)
  return { current, next, percent: Math.max(0, Math.min(100, percent)) }
}

/** Kata pendek berhuruf latin untuk permainan "Susun Kata". */
export const KID_SPELL_ITEMS = (() => {
  const seen = new Set()
  const list = []
  for (const topic of KID_TOPICS) {
    if (topic.id === "hijaiyah" || topic.id === "greetings" || topic.id === "numbers") continue
    for (const item of topic.items) {
      const word = String(item.en || "").replace(/[^A-Za-z]/g, "")
      if (word.length < 3 || word.length > 7) continue
      if (seen.has(word.toLowerCase())) continue
      seen.add(word.toLowerCase())
      list.push({ ...item, topic: topic.id })
    }
  }
  return list
})()
