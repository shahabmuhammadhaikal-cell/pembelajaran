/**
 * Versi ringan Pembelajar (ES5 murni) untuk perangkat lama seperti iPad iOS 10.
 * Tidak memakai React/Firebase/modul ES; data dibaca dari /data/*.json statis.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "pembelajar_lite_v1";
  var CATALOG_URL = "data/catalog.json";
  var ENTRY_DIR = "data/categories/";
  var SPECIAL_FILES = { animals: "data/animals.json", vegetables: "data/vegetables.json" };
  var QUIZ_LENGTH = 10;

  var state = {
    categories: [],
    entryFiles: {},
    cache: {},
    category: "",
    direction: "en",
    entries: [],
    index: 0,
    flipped: false,
    view: "cards",
    quiz: null
  };

  var store = loadStore();

  // ---------- util ----------

  function byId(id) {
    return document.getElementById(id);
  }

  function loadStore() {
    var fallback = { category: "", direction: "en", best: {} };
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      return {
        category: typeof parsed.category === "string" ? parsed.category : "",
        direction: parsed.direction === "ar" ? "ar" : "en",
        best: parsed.best && typeof parsed.best === "object" ? parsed.best : {}
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveStore() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      /* mode privat: abaikan */
    }
  }

  function setStatus(message) {
    byId("status").textContent = message || "";
  }

  function getJson(url, done) {
    // Build satu-file (lite-offline.html) menanamkan data sebagai window.LITE_DATA.
    if (window.LITE_DATA && Object.prototype.hasOwnProperty.call(window.LITE_DATA, url)) {
      done(null, window.LITE_DATA[url]);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      var ok = (xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText);
      if (!ok) {
        done("Gagal memuat " + url + " (" + xhr.status + ")");
        return;
      }
      var data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (error) {
        done("Data tidak valid: " + url);
        return;
      }
      done(null, data);
    };
    xhr.onerror = function () {
      done("Koneksi gagal saat memuat " + url);
    };
    xhr.send();
  }

  function shuffleArr(list) {
    var copy = list.slice(0);
    var i;
    for (i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function toEntries(data) {
    var raw = null;
    if (Object.prototype.toString.call(data) === "[object Array]") raw = data;
    else if (data && Object.prototype.toString.call(data.entries) === "[object Array]") raw = data.entries;
    if (!raw) return [];
    var out = [];
    var i;
    for (i = 0; i < raw.length; i++) {
      var item = raw[i];
      if (!item || !item.en || !item.ar) continue;
      out.push({
        en: String(item.en),
        ar: String(item.ar),
        tr: item.tr ? String(item.tr) : "",
        id: item.id ? String(item.id) : ""
      });
    }
    return out;
  }

  function entryUrl(categoryId) {
    if (SPECIAL_FILES[categoryId]) return SPECIAL_FILES[categoryId];
    // catalog.json menyimpan path sumber (mis. "assets/data/categories/warna.json");
    // di web hanya bagian setelah folder categories yang dipakai.
    var file = state.entryFiles[categoryId];
    if (file) {
      var match = /categories\/([^/]+)$/.exec(file);
      if (match) return ENTRY_DIR + match[1];
    }
    return ENTRY_DIR + encodeURIComponent(categoryId) + ".json";
  }

  // ---------- pemuatan data ----------

  function loadCatalog() {
    setStatus("Memuat daftar kategori…");
    getJson(CATALOG_URL, function (error, data) {
      if (error) {
        setStatus(error + ". Pastikan halaman dibuka lewat server (http), bukan file://.");
        return;
      }
      var list = (data && data.categories) || [];
      var cats = [];
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i] && list[i].id) {
          cats.push({ id: String(list[i].id), name: String(list[i].name || list[i].id) });
        }
      }
      state.categories = cats;
      state.entryFiles = (data && data.entry_files) || {};
      fillCategorySelect();

      var initial = store.category;
      if (!initial || !hasCategory(initial)) initial = cats.length ? cats[0].id : "";
      state.direction = store.direction === "ar" ? "ar" : "en";
      updateDirectionButtons();
      if (initial) selectCategory(initial);
    });
  }

  function hasCategory(id) {
    var i;
    for (i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === id) return true;
    }
    return false;
  }

  function fillCategorySelect() {
    var select = byId("category");
    select.options.length = 0;
    var i;
    for (i = 0; i < state.categories.length; i++) {
      var option = document.createElement("option");
      option.value = state.categories[i].id;
      option.text = state.categories[i].name;
      select.appendChild(option);
    }
  }

  function selectCategory(id) {
    state.category = id;
    store.category = id;
    saveStore();
    byId("category").value = id;
    resetQuiz();
    if (state.cache[id]) {
      applyEntries(state.cache[id]);
      return;
    }
    setStatus("Memuat kata…");
    getJson(entryUrl(id), function (error, data) {
      if (error) {
        setStatus(error);
        applyEntries([]);
        return;
      }
      var entries = toEntries(data);
      state.cache[id] = entries;
      if (state.category === id) applyEntries(entries);
    });
  }

  function applyEntries(entries) {
    state.entries = entries;
    state.index = 0;
    state.flipped = false;
    renderCard();
    renderQuizBest();
    if (!entries.length) {
      setStatus("Kategori ini tidak punya data kata.");
    } else {
      setStatus("");
    }
  }

  // ---------- kartu ----------

  function isArabicDirection() {
    return state.direction === "ar";
  }

  function renderCard() {
    var card = byId("card");
    var total = state.entries.length;
    if (!total) {
      byId("card-side").textContent = "";
      byId("card-main").textContent = "Belum ada kata";
      byId("card-main").removeAttribute("dir");
      byId("card-sub").textContent = "";
      byId("card-hint").textContent = "";
      byId("counter").textContent = "0 / 0";
      byId("prev").disabled = true;
      byId("next").disabled = true;
      return;
    }
    if (state.index >= total) state.index = 0;
    if (state.index < 0) state.index = total - 1;

    var item = state.entries[state.index];
    var arabicFirst = isArabicDirection();
    var front = arabicFirst ? item.ar : item.en;
    var back = arabicFirst ? item.en : item.ar;

    byId("card-side").textContent = arabicFirst ? "Arab" : "Inggris";
    var main = byId("card-main");
    main.textContent = state.flipped ? back : front;
    // Arab butuh arah kanan-ke-kiri, latin kiri-ke-kanan.
    var mainIsArabic = state.flipped ? !arabicFirst : arabicFirst;
    if (mainIsArabic) main.setAttribute("dir", "rtl");
    else main.setAttribute("dir", "ltr");

    var sub = "";
    if (state.flipped) {
      sub = item.tr || "";
      if (item.id) sub = sub ? sub + " · " + item.id : item.id;
    } else {
      sub = arabicFirst ? "Ketuk untuk arti Inggris" : "Ketuk untuk arti Arab";
    }
    byId("card-sub").textContent = sub;
    byId("card-hint").textContent = state.flipped
      ? "Ketuk kartu untuk kembali"
      : "Ketuk kartu untuk melihat arti";

    byId("counter").textContent = state.index + 1 + " / " + total;
    byId("prev").disabled = total < 2;
    byId("next").disabled = total < 2;
  }

  function stepCard(step) {
    if (!state.entries.length) return;
    state.index += step;
    state.flipped = false;
    renderCard();
  }

  function flipCard() {
    if (!state.entries.length) return;
    state.flipped = !state.flipped;
    renderCard();
  }

  // ---------- kuis ----------

  function resetQuiz() {
    state.quiz = null;
    byId("quiz-start").hidden = false;
    byId("quiz-play").hidden = true;
    byId("quiz-result").hidden = true;
    byId("quiz-feedback").textContent = "";
    byId("quiz-options").innerHTML = "";
  }

  function renderQuizBest() {
    var best = store.best[bestKey()];
    var node = byId("quiz-best");
    if (!state.entries.length) {
      node.textContent = "";
      return;
    }
    node.textContent = best ? "Skor terbaik: " + best + " / " + QUIZ_LENGTH : "Belum ada skor tersimpan.";
  }

  function bestKey() {
    return state.category + "|" + state.direction;
  }

  function buildOptions(entry, pool, targetKey) {
    var correct = String(entry[targetKey] || "");
    var used = {};
    used[correct] = true;
    var options = [{ text: correct, correct: true }];
    var candidates = shuffleArr(pool);
    var i;
    for (i = 0; i < candidates.length && options.length < 4; i++) {
      var value = String(candidates[i][targetKey] || "");
      if (!value || used[value]) continue;
      used[value] = true;
      options.push({ text: value, correct: false });
    }
    return shuffleArr(options);
  }

  function startQuiz() {
    if (!state.entries.length) return;
    var count = Math.min(QUIZ_LENGTH, state.entries.length);
    var picked = shuffleArr(state.entries).slice(0, count);
    var targetKey = isArabicDirection() ? "en" : "ar";
    var questions = [];
    var i;
    for (i = 0; i < picked.length; i++) {
      questions.push({ entry: picked[i], options: buildOptions(picked[i], state.entries, targetKey) });
    }
    state.quiz = { questions: questions, index: 0, score: 0, answered: false };
    byId("quiz-start").hidden = true;
    byId("quiz-result").hidden = true;
    byId("quiz-play").hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    var quiz = state.quiz;
    if (!quiz) return;
    var question = quiz.questions[quiz.index];
    var entry = question.entry;
    var arabicFirst = isArabicDirection();

    byId("quiz-progress").textContent = "Soal " + (quiz.index + 1) + " / " + quiz.questions.length;
    var questionNode = byId("quiz-question");
    questionNode.textContent = arabicFirst ? entry.ar : entry.en;
    questionNode.setAttribute("dir", arabicFirst ? "rtl" : "ltr");
    byId("quiz-feedback").textContent = "";
    byId("quiz-next").hidden = true;
    byId("quiz-next").textContent =
      quiz.index + 1 >= quiz.questions.length ? "Lihat hasil" : "Lanjut";

    var box = byId("quiz-options");
    box.innerHTML = "";
    var i;
    for (i = 0; i < question.options.length; i++) {
      var option = question.options[i];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = option.text;
      btn.setAttribute("data-correct", option.correct ? "1" : "0");
      btn.onclick = onAnswerClick;
      box.appendChild(btn);
    }
    quiz.answered = false;
  }

  function onAnswerClick(event) {
    var quiz = state.quiz;
    if (!quiz || quiz.answered) return;
    quiz.answered = true;

    var button = event.currentTarget;
    var isCorrect = button.getAttribute("data-correct") === "1";
    var question = quiz.questions[quiz.index];
    var nodes = byId("quiz-options").getElementsByTagName("button");
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-correct") === "1") nodes[i].className = "option is-correct";
    }
    if (!isCorrect) button.className = "option is-wrong";
    else quiz.score += 1;

    var entry = question.entry;
    byId("quiz-feedback").textContent = isCorrect
      ? "Benar!"
      : "Belum tepat. Jawaban: " + (isArabicDirection() ? entry.en : entry.ar);
    byId("quiz-next").hidden = false;
  }

  function nextQuestion() {
    var quiz = state.quiz;
    if (!quiz) return;
    quiz.index += 1;
    if (quiz.index >= quiz.questions.length) {
      finishQuiz();
      return;
    }
    renderQuestion();
  }

  function finishQuiz() {
    var quiz = state.quiz;
    if (!quiz) return;
    var score = quiz.score;
    var total = quiz.questions.length;
    byId("quiz-play").hidden = true;
    byId("quiz-result").hidden = false;
    byId("result-score").textContent = score + " / " + total;

    var text = "Terus berlatih, kamu pasti bisa!";
    if (score === total) text = "Sempurna! Semua jawaban benar.";
    else if (score >= Math.ceil(total * 0.8)) text = "Bagus sekali, hampir sempurna.";
    else if (score >= Math.ceil(total * 0.5)) text = "Lumayan, tingkatkan lagi ya.";
    byId("result-text").textContent = text;

    var key = bestKey();
    var previous = store.best[key] || 0;
    if (score > previous) {
      store.best[key] = score;
      saveStore();
    }
    renderQuizBest();
  }

  // ---------- navigasi tampilan ----------

  function updateDirectionButtons() {
    var buttons = byId("direction").getElementsByTagName("button");
    var i;
    for (i = 0; i < buttons.length; i++) {
      buttons[i].className =
        buttons[i].getAttribute("data-dir") === state.direction ? "dir-btn is-active" : "dir-btn";
    }
  }

  function setDirection(direction) {
    state.direction = direction === "ar" ? "ar" : "en";
    store.direction = state.direction;
    saveStore();
    updateDirectionButtons();
    state.flipped = false;
    renderCard();
    resetQuiz();
    renderQuizBest();
  }

  function setView(view) {
    state.view = view === "quiz" ? "quiz" : "cards";
    var tabs = byId("tabs").getElementsByTagName("button");
    var i;
    for (i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].getAttribute("data-view") === state.view ? "tab is-active" : "tab";
    }
    byId("view-cards").hidden = state.view !== "cards";
    byId("view-quiz").hidden = state.view !== "quiz";
    if (state.view === "cards") renderCard();
    else renderQuizBest();
  }

  // ---------- pasang event ----------

  function bindEvents() {
    byId("category").onchange = function (event) {
      selectCategory(event.target.value);
    };

    byId("direction").onclick = function (event) {
      var target = event.target;
      var dir = target && target.getAttribute ? target.getAttribute("data-dir") : null;
      if (dir) setDirection(dir);
    };

    byId("tabs").onclick = function (event) {
      var target = event.target;
      var view = target && target.getAttribute ? target.getAttribute("data-view") : null;
      if (view) setView(view);
    };

    byId("card").onclick = flipCard;
    byId("card").onkeydown = function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        flipCard();
        return false;
      }
      return true;
    };
    byId("prev").onclick = function () {
      stepCard(-1);
    };
    byId("next").onclick = function () {
      stepCard(1);
    };
    byId("shuffle").onclick = function () {
      state.entries = shuffleArr(state.entries);
      state.index = 0;
      state.flipped = false;
      renderCard();
    };

    byId("quiz-begin").onclick = startQuiz;
    byId("quiz-again").onclick = startQuiz;
    byId("quiz-next").onclick = nextQuestion;
  }

  function init() {
    bindEvents();
    setView("cards");
    loadCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
