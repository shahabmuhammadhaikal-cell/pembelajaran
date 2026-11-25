/**
 * Frasa sederhana untuk permainan "Susun Kalimat".
 * `en` dipecah menjadi kata-kata yang harus disusun ulang oleh anak.
 * `id` dan `ar` + `tr` dipakai sebagai petunjuk dan audio tiga bahasa.
 */

const phrase = (key, emoji, id, en, ar, tr) => ({ key, emoji, id, en, ar, tr })

export const KID_SENTENCES = [
  phrase("sen-apple", "🍎", "Aku suka apel.", "I like apples", "أُحِبُّ التُّفَّاح", "Uḥibbu at-tuffāḥ"),
  phrase("sen-cat-milk", "🐱", "Kucing minum susu.", "The cat drinks milk", "الْقِطُّ يَشْرَبُ الْحَلِيب", "Al-qiṭṭu yashrabu al-ḥalīb"),
  phrase("sen-father-book", "📖", "Ayah membaca buku.", "Father reads a book", "الْأَبُ يَقْرَأُ كِتَابًا", "Al-abu yaqraʾu kitāban"),
  phrase("sen-mother-rice", "🍚", "Ibu memasak nasi.", "Mother cooks rice", "الْأُمُّ تَطْبُخُ الْأَرُزّ", "Al-ummu taṭbukhu al-aruzz"),
  phrase("sen-school", "🏫", "Aku pergi ke sekolah.", "I go to school", "أَذْهَبُ إِلَى الْمَدْرَسَة", "Adhhabu ilā al-madrasa"),
  phrase("sen-football", "⚽", "Kami bermain bola.", "We play football", "نَلْعَبُ بِالْكُرَة", "Nalʿabu bil-kura"),
  phrase("sen-water", "💧", "Dia minum air.", "He drinks water", "هُوَ يَشْرَبُ الْمَاء", "Huwa yashrabu al-māʾ"),
  phrase("sen-sun", "☀️", "Matahari bersinar terang.", "The sun shines brightly", "الشَّمْسُ تُشْرِقُ سَاطِعَة", "Ash-shamsu tushriqu sāṭiʿa"),
  phrase("sen-flower", "🌸", "Bunga itu indah.", "The flower is beautiful", "الزَّهْرَةُ جَمِيلَة", "Az-zahratu jamīla"),
  phrase("sen-sleep", "😴", "Adikku tidur nyenyak.", "My little sister sleeps well", "أُخْتِي الصَّغِيرَةُ تَنَامُ جَيِّدًا", "Ukhtī aṣ-ṣaghīratu tanāmu jayyidan"),
  phrase("sen-family", "❤️", "Aku cinta keluargaku.", "I love my family", "أُحِبُّ عَائِلَتِي", "Uḥibbu ʿāʾilatī"),
  phrase("sen-bird", "🐦", "Burung itu terbang tinggi.", "The bird flies high", "الطَّائِرُ يَطِيرُ عَالِيًا", "Aṭ-ṭāʾiru yaṭīru ʿāliyan"),
  phrase("sen-dinner", "🍽️", "Kami makan malam bersama.", "We eat dinner together", "نَأْكُلُ الْعَشَاءَ مَعًا", "Naʾkulu al-ʿashāʾa maʿan"),
  phrase("sen-doctor", "🧑‍⚕️", "Dokter memeriksa pasien.", "The doctor checks the patient", "الطَّبِيبُ يَفْحَصُ الْمَرِيض", "Aṭ-ṭabību yafḥaṣu al-marīḍ"),
  phrase("sen-rain", "🌧️", "Hujan turun deras.", "The rain falls heavily", "الْمَطَرُ يَنْزِلُ بِغَزَارَة", "Al-maṭaru yanzilu bighazāra"),
  phrase("sen-hands", "✋", "Aku mencuci tangan.", "I wash my hands", "أَغْسِلُ يَدَيَّ", "Aghsilu yadayya"),
  phrase("sen-guitar", "🎸", "Kakak bermain gitar.", "My brother plays the guitar", "أَخِي يَعْزِفُ عَلَى الْجِيتَار", "Akhī yaʿzifu ʿalā al-jītār"),
  phrase("sen-sofa", "🛋️", "Kucing itu tidur di sofa.", "The cat sleeps on the sofa", "الْقِطُّ يَنَامُ عَلَى الْأَرِيكَة", "Al-qiṭṭu yanāmu ʿalā al-arīka"),
  phrase("sen-juice", "🧃", "Aku ingin minum jus.", "I want to drink juice", "أُرِيدُ أَنْ أَشْرَبَ الْعَصِير", "Urīdu an ashraba al-ʿaṣīr"),
  phrase("sen-beach", "🏖️", "Kami pergi ke pantai.", "We go to the beach", "نَذْهَبُ إِلَى الشَّاطِئ", "Nadhhabu ilā ash-shāṭiʾ"),
  phrase("sen-pencil", "✏️", "Ini pensil biru.", "This is a blue pencil", "هَذَا قَلَمٌ أَزْرَق", "Hādhā qalamun azraq"),
  phrase("sen-happy", "😊", "Aku senang hari ini.", "I am happy today", "أَنَا سَعِيدٌ الْيَوْم", "Anā saʿīdun al-yawm")
]
