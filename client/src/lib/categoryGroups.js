/**
 * Pengelompokan kategori untuk pemilih kategori di header.
 *
 * Tujuan: daftar 91 kategori tidak lagi berupa satu tumpukan panjang, dan
 * kategori baru (Kata Bergambar, Kata Kerja Harian, Angka 11-1000, Alat Dapur)
 * langsung terlihat di grup paling atas.
 *
 * Urutan grup di sini menentukan urutan di dropdown. Kategori yang belum
 * terdaftar otomatis masuk grup "Lainnya", jadi kategori baru tetap muncul
 * walau tidak sengaja lupa didaftarkan.
 */
const GROUPS = [
  {
    title: "Baru",
    ids: ["kata_bergambar", "kata_kerja_harian", "angka_besar", "alat_dapur"]
  },
  {
    title: "Dasar & Sapaan",
    ids: [
      "greetings",
      "basics",
      "personal_information",
      "polite_expressions",
      "question_words",
      "pronouns",
      "prepositions"
    ]
  },
  {
    title: "Percakapan",
    ids: [
      "daily_conversation",
      "classroom_phrases",
      "market_conversation",
      "restaurant",
      "shopping",
      "directions"
    ]
  },
  {
    title: "Tata Bahasa",
    ids: [
      "colors",
      "nouns",
      "adjectives",
      "verbs_common",
      "verbs_regular",
      "verbs_irregular",
      "verbs_irregular_full",
      "verbs_2000_examples",
      "phrasal_verbs"
    ]
  },
  {
    title: "Angka, Waktu & Tempat",
    ids: ["numbers", "weekdays", "time", "places", "transportation", "travel", "weather"]
  },
  {
    title: "Rumah, Tubuh & Aktivitas",
    ids: [
      "home_objects",
      "body_parts",
      "health",
      "clothing",
      "emotions",
      "daily_activities",
      "professions",
      "family",
      "classroom",
      "school_office",
      "worship",
      "technology",
      "sports",
      "music_arts",
      "nature_environment"
    ]
  },
  {
    title: "Makanan & Minuman",
    ids: [
      "food_drinks",
      "daily_foods",
      "fruits",
      "vegetables",
      "herbs_spices",
      "root_vegetables",
      "leafy_green_vegetables",
      "legumes_mushrooms",
      "citrus_fruits",
      "berries_grapes",
      "orchard_fruits",
      "tropical_fruits",
      "exotic_fruits"
    ]
  },
  {
    title: "Hewan & Burung",
    ids: [
      "animals",
      "farm_animals",
      "wild_animals",
      "birds",
      "reptiles_amphibians",
      "insects_small_animals",
      "small_mammals",
      "primates",
      "birds_of_prey",
      "pet_city_birds",
      "water_birds",
      "domestic_birds",
      "wetland_birds",
      "unique_birds",
      "giant_mammals",
      "big_cats",
      "hoofed_mammals",
      "marsupials",
      "unique_mammals",
      "crocodilians",
      "lizards",
      "snakes",
      "turtles_tortoises",
      "amphibians"
    ]
  },
  {
    title: "Hewan Laut",
    ids: [
      "sea_animals",
      "marine_mammals",
      "sharks_rays",
      "sea_fish",
      "cephalopods_jellyfish",
      "shellfish_seafloor"
    ]
  }
]

/**
 * @param {Array<{id: string, name: string}>} categories
 * @returns {Array<{title: string, items: Array}>}
 */
export function categoryGroups(categories) {
  const list = Array.isArray(categories) ? categories.filter(category => category && category.id) : []
  const byId = new Map(list.map(category => [category.id, category]))
  const used = new Set()
  const groups = []

  for (const group of GROUPS) {
    const items = []
    for (const id of group.ids) {
      const category = byId.get(id)
      if (category && !used.has(id)) {
        items.push(category)
        used.add(id)
      }
    }
    if (items.length) groups.push({ title: group.title, items })
  }

  const rest = list.filter(category => !used.has(category.id))
  if (rest.length) groups.push({ title: "Lainnya", items: rest })

  return groups
}
