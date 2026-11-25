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
      item("n11", "🔢", "Eleven", "أَحَدَ عَشَر", "Aḥada ʿashara", "Sebelas", { big: "11", numeral: 11 }),
      item("n12", "🔢", "Twelve", "اِثْنَا عَشَر", "Ithnā ʿashara", "Dua belas", { big: "12", numeral: 12 }),
      item("n13", "🔢", "Thirteen", "ثَلَاثَةَ عَشَر", "Thalāthata ʿashara", "Tiga belas", { big: "13", numeral: 13 }),
      item("n14", "🔢", "Fourteen", "أَرْبَعَةَ عَشَر", "Arbaʿata ʿashara", "Empat belas", { big: "14", numeral: 14 }),
      item("n15", "🔢", "Fifteen", "خَمْسَةَ عَشَر", "Khamsata ʿashara", "Lima belas", { big: "15", numeral: 15 }),
      item("n16", "🔢", "Sixteen", "سِتَّةَ عَشَر", "Sittata ʿashara", "Enam belas", { big: "16", numeral: 16 }),
      item("n17", "🔢", "Seventeen", "سَبْعَةَ عَشَر", "Sabʿata ʿashara", "Tujuh belas", { big: "17", numeral: 17 }),
      item("n18", "🔢", "Eighteen", "ثَمَانِيَةَ عَشَر", "Thamāniyata ʿashara", "Delapan belas", { big: "18", numeral: 18 }),
      item("n19", "🔢", "Nineteen", "تِسْعَةَ عَشَر", "Tiṣʿata ʿashara", "Sembilan belas", { big: "19", numeral: 19 }),
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
      item("turtle", "🐢", "Turtle", "سُلَحْفَاة", "Sulaḥfāh", "Kura-kura"),
      item("camel", "🐪", "Camel", "جَمَل", "Jamal", "Unta"),
      item("deer", "🦌", "Deer", "غَزَال", "Ghazāl", "Rusa"),
      item("fox", "🦊", "Fox", "ثَعْلَب", "Thaʿlab", "Rubah"),
      item("wolf", "🐺", "Wolf", "ذِئْب", "Dhiʾb", "Serigala"),
      item("tiger", "🐯", "Tiger", "نَمِر", "Namir", "Harimau"),
      item("panda", "🐼", "Panda", "بَانْدَا", "Bāndā", "Panda")
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
      item("pear", "🍐", "Pear", "كُمَّثْرَى", "Kummathrā", "Pir"),
      item("coconut", "🥥", "Coconut", "جَوْز هِنْد", "Jawz hind", "Kelapa"),
      item("avocado", "🥑", "Avocado", "أَفُوكَادُو", "Afūkādū", "Alpukat"),
      item("kiwi", "🥝", "Kiwi", "كِيوِي", "Kīwī", "Kiwi"),
      item("melon", "🍈", "Melon", "شَمَّام", "Shammām", "Melon"),
      item("blueberry", "🫐", "Blueberry", "عِنَب أَزْرَق", "ʿInab azraq", "Blueberry")
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
      item("aunt", "👩‍🦱", "Aunt", "خَالَة", "Khāla", "Bibi"),
      item("friend", "🧑‍🤝‍🧑", "Friend", "صَدِيق", "Ṣadīq", "Teman"),
      item("baby", "🍼", "Baby", "طِفْل", "Ṭifl", "Bayi"),
      item("husband", "🤵", "Husband", "زَوْج", "Zawj", "Suami"),
      item("wife", "👰", "Wife", "زَوْجَة", "Zawja", "Istri"),
      item("cousin", "🧑", "Cousin", "اِبْن عَمّ", "Ibn ʿamm", "Sepupu")
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
      item("heart", "❤️", "Heart", "قَلْب", "Qalb", "Jantung"),
      item("shoulder", "🧍", "Shoulder", "كَتِف", "Katf", "Bahu"),
      item("knee", "🦵", "Knee", "رُكْبَة", "Rukba", "Lutut"),
      item("finger", "☝️", "Finger", "إِصْبَع", "Iṣbaʿ", "Jari"),
      item("back", "🔙", "Back", "ظَهْر", "Ẓahr", "Punggung")
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
      item("alif", "🦁", "Alif", "أَلِف", "Alif", "Alif", { big: "ا", sample: "أَسَد", sampleTr: "Asad", sampleEn: "Lion", sampleId: "Singa" }),
      item("ba", "🦆", "Ba", "بَاء", "Bāʾ", "Ba", { big: "ب", sample: "بَطَّة", sampleTr: "Baṭṭa", sampleEn: "Duck", sampleId: "Bebek" }),
      item("ta", "🍎", "Ta", "تَاء", "Tāʾ", "Ta", { big: "ت", sample: "تُفَّاحَة", sampleTr: "Tuffāḥa", sampleEn: "Apple", sampleId: "Apel" }),
      item("tsa", "🦊", "Tsa", "ثَاء", "Thāʾ", "Tsa", { big: "ث", sample: "ثَعْلَب", sampleTr: "Thaʿlab", sampleEn: "Fox", sampleId: "Rubah" }),
      item("jim", "🐪", "Jim", "جِيم", "Jīm", "Jim", { big: "ج", sample: "جَمَل", sampleTr: "Jamal", sampleEn: "Camel", sampleId: "Unta" }),
      item("ha", "🐴", "Ha", "حَاء", "Ḥāʾ", "Ha", { big: "ح", sample: "حِصَان", sampleTr: "Ḥiṣān", sampleEn: "Horse", sampleId: "Kuda" }),
      item("kha", "🐑", "Kha", "خَاء", "Khāʾ", "Kha", { big: "خ", sample: "خَرُوف", sampleTr: "Kharūf", sampleEn: "Sheep", sampleId: "Domba" }),
      item("dal", "🐻", "Dal", "دَال", "Dāl", "Dal", { big: "د", sample: "دُبّ", sampleTr: "Dubb", sampleEn: "Bear", sampleId: "Beruang" }),
      item("dzal", "🐺", "Dzal", "ذَال", "Dhāl", "Dzal", { big: "ذ", sample: "ذِئْب", sampleTr: "Dhiʾb", sampleEn: "Wolf", sampleId: "Serigala" }),
      item("ra", "🦃", "Ra", "رَاء", "Rāʾ", "Ra", { big: "ر", sample: "دِيك رُومِيّ", sampleTr: "Dīk rūmī", sampleEn: "Turkey", sampleId: "Kalkun" }),
      item("zai", "🦒", "Zai", "زَاي", "Zāy", "Zai", { big: "ز", sample: "زَرَافَة", sampleTr: "Zarāfa", sampleEn: "Giraffe", sampleId: "Jerapah" }),
      item("sin", "🐟", "Sin", "سِين", "Sīn", "Sin", { big: "س", sample: "سَمَكَة", sampleTr: "Samaka", sampleEn: "Fish", sampleId: "Ikan" }),
      item("syin", "☀️", "Syin", "شِين", "Shīn", "Syin", { big: "ش", sample: "شَمْس", sampleTr: "Shams", sampleEn: "Sun", sampleId: "Matahari" }),
      item("shad", "🦅", "Shad", "صَاد", "Ṣād", "Shad", { big: "ص", sample: "صَقْر", sampleTr: "Ṣaqr", sampleEn: "Eagle", sampleId: "Elang" }),
      item("dhad", "🐸", "Dhad", "ضَاد", "Ḍād", "Dhad", { big: "ض", sample: "ضِفْدَع", sampleTr: "Ḍifdaʿ", sampleEn: "Frog", sampleId: "Katak" }),
      item("tha", "🐦", "Tha", "طَاء", "Ṭāʾ", "Tha", { big: "ط", sample: "طَائِر", sampleTr: "Ṭāʾir", sampleEn: "Bird", sampleId: "Burung" }),
      item("zha", "✉️", "Zha", "ظَاء", "Ẓāʾ", "Zha", { big: "ظ", sample: "ظَرْف", sampleTr: "Ẓarf", sampleEn: "Envelope", sampleId: "Amplop" }),
      item("ain", "👁️", "Ain", "عَيْن", "ʿAyn", "Ain", { big: "ع", sample: "عَيْن", sampleTr: "ʿAyn", sampleEn: "Eye", sampleId: "Mata" }),
      item("ghain", "🦌", "Ghain", "غَيْن", "Ghayn", "Ghain", { big: "غ", sample: "غَزَال", sampleTr: "Ghazāl", sampleEn: "Deer", sampleId: "Rusa" }),
      item("fa", "🐘", "Fa", "فَاء", "Fāʾ", "Fa", { big: "ف", sample: "فِيل", sampleTr: "Fīl", sampleEn: "Elephant", sampleId: "Gajah" }),
      item("qaf", "🌙", "Qaf", "قَاف", "Qāf", "Qaf", { big: "ق", sample: "قَمَر", sampleTr: "Qamar", sampleEn: "Moon", sampleId: "Bulan" }),
      item("kaf", "📚", "Kaf", "كَاف", "Kāf", "Kaf", { big: "ك", sample: "كِتَاب", sampleTr: "Kitāb", sampleEn: "Book", sampleId: "Buku" }),
      item("lam", "🍋", "Lam", "لَام", "Lām", "Lam", { big: "ل", sample: "لَيْمُون", sampleTr: "Laymūn", sampleEn: "Lemon", sampleId: "Lemon" }),
      item("mim", "🍌", "Mim", "مِيم", "Mīm", "Mim", { big: "م", sample: "مَوْز", sampleTr: "Mawz", sampleEn: "Banana", sampleId: "Pisang" }),
      item("nun", "⭐", "Nun", "نُون", "Nūn", "Nun", { big: "ن", sample: "نَجْمَة", sampleTr: "Najma", sampleEn: "Star", sampleId: "Bintang" }),
      item("wau", "🌹", "Wau", "وَاو", "Wāw", "Wau", { big: "و", sample: "وَرْدَة", sampleTr: "Warda", sampleEn: "Flower", sampleId: "Bunga" }),
      item("haa", "🌙", "Ha", "هَاء", "Hāʾ", "Ha besar", { big: "ه", sample: "هِلَال", sampleTr: "Hilāl", sampleEn: "Crescent", sampleId: "Bulan sabit" }),
      item("ya", "✋", "Ya", "يَاء", "Yāʾ", "Ya", { big: "ي", sample: "يَد", sampleTr: "Yad", sampleEn: "Hand", sampleId: "Tangan" })
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
      item("fd-tea", "🍵", "Tea", "شَاي", "Shāy", "Teh"),
      item("fd-noodles", "🍜", "Noodles", "نُودِلْز", "Nūdilz", "Mie"),
      item("fd-butter", "🧈", "Butter", "زُبْدَة", "Zubda", "Mentega"),
      item("fd-olive", "🫒", "Olive", "زَيْتُون", "Zaytūn", "Zaitun"),
      item("fd-salt", "🧂", "Salt", "مِلْح", "Milḥ", "Garam"),
      item("fd-sugar", "🍬", "Sugar", "سُكَّر", "Sukkar", "Gula")
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
      item("tr-rocket", "🚀", "Rocket", "صَارُوخ", "Ṣārūkh", "Roket"),
      item("tr-ship", "🚢", "Ship", "سَفِينَة", "Safīna", "Kapal"),
      item("tr-taxi", "🚕", "Taxi", "سَيَّارَة أُجْرَة", "Sayyārat ujra", "Taksi"),
      item("tr-ambulance", "🚑", "Ambulance", "إِسْعَاف", "Isʿāf", "Ambulans"),
      item("tr-tractor", "🚜", "Tractor", "جَرَّار", "Jarrār", "Traktor"),
      item("tr-subway", "🚇", "Subway", "مِتْرُو", "Mitrū", "Kereta bawah tanah")
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
      item("hm-soap", "🧼", "Soap", "صَابُون", "Ṣābūn", "Sabun"),
      item("hm-mirror", "🪞", "Mirror", "مِرْآة", "Mirʾāh", "Cermin"),
      item("hm-fan", "🌀", "Fan", "مِرْوَحَة", "Mirwaḥa", "Kipas"),
      item("hm-basket", "🧺", "Basket", "سَلَّة", "Salla", "Keranjang"),
      item("hm-toothbrush", "🪥", "Toothbrush", "فُرْشَاة أَسْنَان", "Furshāt asnān", "Sikat gigi")
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
      item("cl-umbrella", "☂️", "Umbrella", "مِظَلَّة", "Miẓalla", "Payung"),
      item("cl-sandals", "🩴", "Sandals", "صَنْدَل", "Ṣandal", "Sandal"),
      item("cl-scarf", "🧣", "Scarf", "وِشَاح", "Wishāḥ", "Syal"),
      item("cl-uniform", "🥋", "Uniform", "زِيّ رَسْمِيّ", "Ziyy rasmī", "Seragam"),
      item("cl-gloves", "🧤", "Gloves", "قُفَّازَات", "Quffāzāt", "Sarung tangan")
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
      item("fl-calm", "😌", "Calm", "هَادِئ", "Hādiʾ", "Tenang"),
      item("fl-surprised", "😲", "Surprised", "مُتَعَجِّب", "Mutaʿajjib", "Terkejut"),
      item("fl-shy", "😳", "Shy", "خَجُول", "Khajūl", "Malu"),
      item("fl-proud", "🥹", "Proud", "فَخُور", "Fakhūr", "Bangga"),
      item("fl-bored", "😐", "Bored", "مَلُول", "Malūl", "Bosan"),
      item("fl-sick", "🤒", "Sick", "مَرِيض", "Marīḍ", "Sakit")
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
  },
  {
    id: "school",
    label: "Sekolah",
    emoji: "🏫",
    color: "#60a5fa",
    blurb: "Benda di kelas",
    items: [
      item("sc-book", "📚", "Book", "كِتَاب", "Kitāb", "Buku"),
      item("sc-notebook", "📓", "Notebook", "دَفْتَر", "Daftar", "Buku tulis"),
      item("sc-pencil", "✏️", "Pencil", "قَلَم رَصَاص", "Qalam raṣāṣ", "Pensil"),
      item("sc-pen", "🖊️", "Pen", "قَلَم حِبْر", "Qalam ḥibr", "Pulpen"),
      item("sc-ruler", "📏", "Ruler", "مِسْطَرَة", "Misṭara", "Penggaris"),
      item("sc-scissors", "✂️", "Scissors", "مِقَصّ", "Miqaṣṣ", "Gunting"),
      item("sc-crayon", "🖍️", "Crayon", "قَلَم تَلْوِين", "Qalam talwīn", "Krayon"),
      item("sc-bag", "🎒", "Backpack", "حَقِيبَة", "Ḥaqība", "Tas ransel"),
      item("sc-teacher", "🧑‍🏫", "Teacher", "مُعَلِّم", "Muʿallim", "Guru"),
      item("sc-student", "🧑‍🎓", "Student", "طَالِب", "Ṭālib", "Murid"),
      item("sc-glue", "🧴", "Glue", "صَمْغ", "Ṣamgh", "Lem"),
      item("sc-globe", "🌍", "Globe", "كُرَة أَرْضِيَّة", "Kura arḍiyya", "Bola dunia")
    ]
  },
  {
    id: "kitchen",
    label: "Dapur",
    emoji: "🍳",
    color: "#f59e0b",
    blurb: "Alat masak dan makan",
    items: [
      item("kt-spoon", "🥄", "Spoon", "مِلْعَقَة", "Milʿaqa", "Sendok"),
      item("kt-fork", "🍴", "Fork", "شَوْكَة", "Shawka", "Garpu"),
      item("kt-knife", "🔪", "Knife", "سِكِّين", "Sikkīn", "Pisau"),
      item("kt-plate", "🍽️", "Plate", "صَحْن", "Ṣaḥn", "Piring"),
      item("kt-bowl", "🥣", "Bowl", "وِعَاء", "Wiʿāʾ", "Mangkuk"),
      item("kt-cup", "☕", "Cup", "كُوب", "Kūb", "Cangkir"),
      item("kt-pot", "🍲", "Pot", "قِدْر", "Qidr", "Panci"),
      item("kt-pan", "🍳", "Pan", "مِقْلَاة", "Miqlāh", "Wajan"),
      item("kt-kettle", "🫖", "Kettle", "إِبْرِيق", "Ibrīq", "Teko"),
      item("kt-fridge", "🧊", "Fridge", "ثَلَّاجَة", "Thallāja", "Kulkas"),
      item("kt-stove", "🔥", "Stove", "مَوْقِد", "Mawqid", "Kompor"),
      item("kt-towel", "🧻", "Towel", "مِنْشَفَة", "Minshafa", "Handuk")
    ]
  },
  {
    id: "time",
    label: "Waktu",
    emoji: "⏰",
    color: "#6366f1",
    blurb: "Pagi sampai malam",
    items: [
      item("tm-morning", "🌅", "Morning", "صَبَاح", "Ṣabāḥ", "Pagi"),
      item("tm-afternoon", "🌤️", "Afternoon", "بَعْد الظُّهْر", "Baʿd aẓ-ẓuhr", "Siang"),
      item("tm-evening", "🌆", "Evening", "مَسَاء", "Masāʾ", "Sore"),
      item("tm-night", "🌙", "Night", "لَيْل", "Layl", "Malam"),
      item("tm-today", "📅", "Today", "الْيَوْم", "Al-yawm", "Hari ini"),
      item("tm-tomorrow", "⏭️", "Tomorrow", "غَدًا", "Ghadan", "Besok"),
      item("tm-yesterday", "⏮️", "Yesterday", "أَمْس", "Ams", "Kemarin"),
      item("tm-hour", "⏰", "Hour", "سَاعَة", "Sāʿa", "Jam"),
      item("tm-minute", "⏱️", "Minute", "دَقِيقَة", "Daqīqa", "Menit"),
      item("tm-week", "🗓️", "Week", "أُسْبُوع", "Usbūʿ", "Minggu"),
      item("tm-month", "📆", "Month", "شَهْر", "Shahr", "Bulan"),
      item("tm-year", "🕰️", "Year", "سَنَة", "Sana", "Tahun")
    ]
  },
  {
    id: "jobs",
    label: "Pekerjaan",
    emoji: "🧑‍🔧",
    color: "#14b8a6",
    blurb: "Cita-cita dan profesi",
    items: [
      item("jb-doctor", "🧑‍⚕️", "Doctor", "طَبِيب", "Ṭabīb", "Dokter"),
      item("jb-nurse", "👩‍⚕️", "Nurse", "مُمَرِّضَة", "Mumarriḍa", "Perawat"),
      item("jb-police", "👮", "Police", "شُرْطِيّ", "Shurṭī", "Polisi"),
      item("jb-firefighter", "👨‍🚒", "Firefighter", "رَجُل إِطْفَاء", "Rajul iṭfāʾ", "Pemadam kebakaran"),
      item("jb-farmer", "👨‍🌾", "Farmer", "مُزَارِع", "Muzāriʿ", "Petani"),
      item("jb-driver", "🚗", "Driver", "سَائِق", "Sāʾiq", "Sopir"),
      item("jb-chef", "👨‍🍳", "Chef", "طَبَّاخ", "Ṭabbākh", "Koki"),
      item("jb-pilot", "👨‍✈️", "Pilot", "طَيَّار", "Ṭayyār", "Pilot"),
      item("jb-dentist", "🦷", "Dentist", "طَبِيب أَسْنَان", "Ṭabīb asnān", "Dokter gigi"),
      item("jb-engineer", "👷", "Engineer", "مُهَنْدِس", "Muhandis", "Insinyur"),
      item("jb-seller", "🛒", "Seller", "بَائِع", "Bāʾiʿ", "Penjual"),
      item("jb-tailor", "🧵", "Tailor", "خَيَّاط", "Khayyāṭ", "Penjahit")
    ]
  },
  {
    id: "sports",
    label: "Olahraga",
    emoji: "⚽",
    color: "#22c55e",
    blurb: "Bergerak dan sehat",
    items: [
      item("sp-football", "⚽", "Football", "كُرَة قَدَم", "Kurat qadam", "Sepak bola"),
      item("sp-swimming", "🏊", "Swimming", "سِبَاحَة", "Sibāḥa", "Berenang"),
      item("sp-running", "🏃", "Running", "جَرْي", "Jary", "Berlari"),
      item("sp-cycling", "🚴", "Cycling", "رُكُوب الدَّرَّاجَة", "Rukūb ad-darrāja", "Bersepeda"),
      item("sp-basketball", "🏀", "Basketball", "كُرَة سَلَّة", "Kurat salla", "Bola basket"),
      item("sp-badminton", "🏸", "Badminton", "تِنِس رِيشَة", "Tinis rīsha", "Bulu tangkis"),
      item("sp-tennis", "🎾", "Tennis", "تِنِس", "Tinis", "Tenis"),
      item("sp-volleyball", "🏐", "Volleyball", "كُرَة طَائِرَة", "Kurat ṭāʾira", "Bola voli"),
      item("sp-gymnastics", "🤸", "Gymnastics", "جُمْبَاز", "Jumbāz", "Senam"),
      item("sp-karate", "🥋", "Karate", "كَرَاتِيه", "Kārātīh", "Karate")
    ]
  },
  {
    id: "toys",
    label: "Mainan",
    emoji: "🧸",
    color: "#ec4899",
    blurb: "Mainan favorit",
    items: [
      item("ty-doll", "🪆", "Doll", "دُمْيَة", "Dumya", "Boneka"),
      item("ty-kite", "🪁", "Kite", "طَائِرَة وَرَقِيَّة", "Ṭāʾira waraqiyya", "Layang-layang"),
      item("ty-blocks", "🧱", "Blocks", "مُكَعَّبَات", "Mukaʿabāt", "Balok"),
      item("ty-train", "🚂", "Train", "قِطَار", "Qiṭār", "Kereta mainan"),
      item("ty-car", "🚙", "Car", "سَيَّارَة", "Sayyāra", "Mobil mainan"),
      item("ty-balloon", "🎈", "Balloon", "بَالُون", "Bālūn", "Balon"),
      item("ty-puzzle", "🧩", "Puzzle", "أُحْجِيَّة", "Uḥjiyya", "Puzzle"),
      item("ty-robot", "🤖", "Robot", "رُوبُوت", "Rūbūt", "Robot"),
      item("ty-teddy", "🧸", "Teddy bear", "دُبّ", "Dubb", "Beruang mainan"),
      item("ty-bubbles", "🫧", "Bubbles", "فَقَاعَات", "Faqāʿāt", "Gelembung"),
      item("ty-drum", "🥁", "Drum", "طَبْل", "Ṭabl", "Gendang")
    ]
  },
  {
    id: "vegetables",
    label: "Sayuran",
    emoji: "🥕",
    color: "#65a30d",
    blurb: "Sayur segar di kebun",
    items: [
      item("vg-carrot", "🥕", "Carrot", "جَزَر", "Jazar", "Wortel"),
      item("vg-tomato", "🍅", "Tomato", "طَمَاطِم", "Ṭamāṭim", "Tomat"),
      item("vg-potato", "🥔", "Potato", "بَطَاطِس", "Baṭāṭis", "Kentang"),
      item("vg-onion", "🧅", "Onion", "بَصَل", "Baṣal", "Bawang"),
      item("vg-garlic", "🧄", "Garlic", "ثَوْم", "Thawm", "Bawang putih"),
      item("vg-cucumber", "🥒", "Cucumber", "خِيَار", "Khiyār", "Mentimun"),
      item("vg-broccoli", "🥦", "Broccoli", "بْرُوكُلِي", "Brūkulī", "Brokoli"),
      item("vg-corn", "🌽", "Corn", "ذُرَة", "Dhura", "Jagung"),
      item("vg-pepper", "🫑", "Bell pepper", "فِلْفِل", "Filfil", "Paprika"),
      item("vg-eggplant", "🍆", "Eggplant", "بَاذِنْجَان", "Bādhinjān", "Terong"),
      item("vg-cabbage", "🥬", "Cabbage", "كُرُنْب", "Kurunb", "Kubis"),
      item("vg-pumpkin", "🎃", "Pumpkin", "قَرْع", "Qarʿ", "Labu"),
      item("vg-chili", "🌶️", "Chili", "فِلْفِل حَار", "Filfil ḥārr", "Cabai"),
      item("vg-mushroom", "🍄", "Mushroom", "فُطْر", "Fuṭr", "Jamur")
    ]
  },
  {
    id: "drinks",
    label: "Minuman",
    emoji: "🥤",
    color: "#06b6d4",
    blurb: "Minuman segar sehari-hari",
    items: [
      item("dr-water", "💧", "Water", "مَاء", "Māʾ", "Air"),
      item("dr-milk", "🥛", "Milk", "حَلِيب", "Ḥalīb", "Susu"),
      item("dr-juice", "🧃", "Juice", "عَصِير", "ʿAṣīr", "Jus"),
      item("dr-tea", "🍵", "Tea", "شَاي", "Shāy", "Teh"),
      item("dr-coffee", "☕", "Coffee", "قَهْوَة", "Qahwa", "Kopi"),
      item("dr-lemonade", "🍋", "Lemonade", "لَيْمُونَادَة", "Laymūnāda", "Limun"),
      item("dr-milkshake", "🥤", "Milkshake", "مِيلْك شِيك", "Mīlk shīk", "Milkshake"),
      item("dr-coconut", "🥥", "Coconut water", "مَاء جَوْز الْهِنْد", "Māʾ jawz al-hind", "Air kelapa"),
      item("dr-hotchoc", "🍫", "Hot chocolate", "شُوكُولَاتَة سَاخِنَة", "Shūkūlāta sākhina", "Cokelat panas"),
      item("dr-orange", "🍊", "Orange juice", "عَصِير بُرْتُقَال", "ʿAṣīr burtuqāl", "Jus jeruk"),
      item("dr-melon", "🍉", "Watermelon juice", "عَصِير بَطِّيخ", "ʿAṣīr baṭṭīkh", "Jus semangka"),
      item("dr-syrup", "🍯", "Syrup", "شَرَاب", "Sharāb", "Sirup")
    ]
  },
  {
    id: "bathroom",
    label: "Kamar Mandi",
    emoji: "🛁",
    color: "#0d9488",
    blurb: "Alat mandi dan kebersihan",
    items: [
      item("bt-toothbrush", "🪥", "Toothbrush", "فُرْشَاة أَسْنَان", "Furshāt asnān", "Sikat gigi"),
      item("bt-toothpaste", "🧴", "Toothpaste", "مَعْجُون أَسْنَان", "Maʿjūn asnān", "Pasta gigi"),
      item("bt-soap", "🧼", "Soap", "صَابُون", "Ṣābūn", "Sabun"),
      item("bt-shampoo", "🧴", "Shampoo", "شَامْبُو", "Shāmpū", "Sampo"),
      item("bt-towel", "🧻", "Towel", "مِنْشَفَة", "Minshafa", "Handuk"),
      item("bt-mirror", "🪞", "Mirror", "مِرْآة", "Mirʾāh", "Cermin"),
      item("bt-sink", "🚰", "Sink", "حَوْض", "Ḥawḍ", "Wastafel"),
      item("bt-bathtub", "🛁", "Bathtub", "حَوْض اسْتِحْمَام", "Ḥawḍ istiḥmām", "Bak mandi"),
      item("bt-shower", "🚿", "Shower", "دُشّ", "Dush", "Pancuran"),
      item("bt-toilet", "🚽", "Toilet", "مِرْحَاض", "Mirḥāḍ", "Toilet"),
      item("bt-bucket", "🪣", "Bucket", "دَلْو", "Dalw", "Ember"),
      item("bt-sponge", "🧽", "Sponge", "إِسْفَنْج", "Isfanj", "Spons")
    ]
  },
  {
    id: "music",
    label: "Alat Musik",
    emoji: "🎸",
    color: "#9333ea",
    blurb: "Bunyi-bunyian yang seru",
    items: [
      item("mu-guitar", "🎸", "Guitar", "جِيتَار", "Jītār", "Gitar"),
      item("mu-piano", "🎹", "Piano", "بِيَانُو", "Biyānū", "Piano"),
      item("mu-violin", "🎻", "Violin", "كَمَان", "Kamān", "Biola"),
      item("mu-drum", "🥁", "Drum", "طَبْل", "Ṭabl", "Gendang"),
      item("mu-trumpet", "🎺", "Trumpet", "بُوق", "Būq", "Terompet"),
      item("mu-microphone", "🎤", "Microphone", "مِيكْرُوفُون", "Mīkrūfūn", "Mikrofon"),
      item("mu-darbuka", "🪘", "Darbuka", "دَرْبُوكَة", "Darbūka", "Darbuka"),
      item("mu-saxophone", "🎷", "Saxophone", "سَاكْسُوفُون", "Sāksūfūn", "Saksofon"),
      item("mu-accordion", "🪗", "Accordion", "أَكُورْدِيُون", "Akūrdiyūn", "Akordeon"),
      item("mu-banjo", "🪕", "Banjo", "بَانْجُو", "Bānjū", "Banjo"),
      item("mu-bell", "🔔", "Bell", "جَرَس", "Jaras", "Lonceng"),
      item("mu-headphones", "🎧", "Headphones", "سَمَّاعَات", "Sammāʿāt", "Headphone")
    ]
  },
  {
    id: "insects",
    label: "Serangga",
    emoji: "🦋",
    color: "#eab308",
    blurb: "Teman kecil di taman",
    items: [
      item("in-butterfly", "🦋", "Butterfly", "فَرَاشَة", "Farāsha", "Kupu-kupu"),
      item("in-bee", "🐝", "Bee", "نَحْلَة", "Naḥla", "Lebah"),
      item("in-ant", "🐜", "Ant", "نَمْلَة", "Namla", "Semut"),
      item("in-ladybug", "🐞", "Ladybug", "دُعْسُوقَة", "Duʿsūqa", "Kepik"),
      item("in-spider", "🕷️", "Spider", "عَنْكَبُوت", "ʿAnkabūt", "Laba-laba"),
      item("in-snail", "🐌", "Snail", "حَلَزُون", "Ḥalazūn", "Siput"),
      item("in-worm", "🪱", "Worm", "دُودَة", "Dūda", "Cacing"),
      item("in-cricket", "🦗", "Cricket", "جُدْجُد", "Judjud", "Jangkrik"),
      item("in-mosquito", "🦟", "Mosquito", "بَعُوضَة", "Baʿūḍa", "Nyamuk"),
      item("in-beetle", "🪲", "Beetle", "خُنْفُسَاء", "Khunfusāʾ", "Kumbang")
    ]
  },
  {
    id: "space",
    label: "Antariksa",
    emoji: "🚀",
    color: "#4f46e5",
    blurb: "Menjelajah langit luas",
    items: [
      item("as-sun", "☀️", "Sun", "شَمْس", "Shams", "Matahari"),
      item("as-moon", "🌙", "Moon", "قَمَر", "Qamar", "Bulan"),
      item("as-star", "⭐", "Star", "نَجْمَة", "Najma", "Bintang"),
      item("as-earth", "🌍", "Earth", "الْأَرْض", "Al-arḍ", "Bumi"),
      item("as-rocket", "🚀", "Rocket", "صَارُوخ", "Ṣārūkh", "Roket"),
      item("as-astronaut", "🧑‍🚀", "Astronaut", "رَائِد فَضَاء", "Rāʾid faḍāʾ", "Astronaut"),
      item("as-planet", "🪐", "Planet", "كَوْكَب", "Kawkab", "Planet"),
      item("as-telescope", "🔭", "Telescope", "تِلِسْكُوب", "Tiliskūb", "Teleskop"),
      item("as-satellite", "🛰️", "Satellite", "قَمَر صِنَاعِيّ", "Qamar ṣināʿī", "Satelit"),
      item("as-galaxy", "🌌", "Galaxy", "مَجَرَّة", "Majarra", "Galaksi"),
      item("as-comet", "☄️", "Comet", "مُذَنَّب", "Mudhannab", "Komet")
    ]
  }
]

export const TOPIC_MAP = Object.fromEntries(KID_TOPICS.map(topic => [topic.id, topic]))

/** Pengelompokan topik di beranda supaya daftar topik tidak menumpuk panjang. */
export const KID_TOPIC_GROUPS = [
  { id: "dasar", emoji: "🔤", title: "Dasar & Huruf", ids: ["alphabet", "hijaiyah", "numbers", "colors", "shapes", "greetings"] },
  { id: "makhluk", emoji: "🐾", title: "Hewan, Alam & Angkasa", ids: ["animals", "insects", "nature", "weather", "fruits", "space"] },
  { id: "makanan", emoji: "🍽️", title: "Makanan & Dapur", ids: ["food", "vegetables", "drinks", "kitchen"] },
  { id: "rumah", emoji: "🏠", title: "Rumah & Tubuh", ids: ["home", "bathroom", "body", "clothes", "family", "feelings"] },
  { id: "kegiatan", emoji: "🎒", title: "Sekolah, Waktu & Jalan", ids: ["school", "time", "transport", "toys"] },
  { id: "profesi", emoji: "⚽", title: "Kegiatan & Profesi", ids: ["verbs", "jobs", "sports", "music"] }
]

/** Panjang permainan: jumlah soal/pasangan menyesuaikan usia dan waktu anak. */
export const KID_ROUND_OPTIONS = [
  { id: "short", label: "Pendek", emoji: "🐣", hint: "3–6 soal" },
  { id: "normal", label: "Sedang", emoji: "🦊", hint: "5–10 soal" },
  { id: "long", label: "Panjang", emoji: "🦅", hint: "8–14 soal" }
]

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
  { id: "game-letter", emoji: "🅰️", name: "Jago Huruf Awal", hint: "Skor 6+ di Huruf Awal" },
  { id: "game-sentence", emoji: "🧱", name: "Perangkai Kalimat", hint: "Selesaikan Susun Kalimat dengan benar" },
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
