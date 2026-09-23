// PABWE P3 - JavaScript Mini Project
// Expense Tracker + Bookmark Manager + Quiz App

const STORAGE = {
  expenses: "pabwe_p3_expenses",
  bookmarks: "pabwe_p3_bookmarks",
  highScore: "pabwe_p3_high_score"
};

const VALID_TABS = ["expense", "bookmark", "quiz"];
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function makeId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function loadArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveArray(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && /^https?:\/\/\S+$/i.test(value);
  } catch {
    return false;
  }
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && !dialog.open) dialog.showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

$$('[data-close-dialog]').forEach(button => {
  button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
});

// ======================================================
// TAB NAVIGATION - state disimpan pada URL query string
// ======================================================

const tabButtons = $$("#mainTabs [role='tab']");
const tabPanels = $$(".tab-panel");

function readTabFromUrl() {
  const value = new URLSearchParams(window.location.search).get("tab");
  return VALID_TABS.includes(value) ? value : "expense";
}

function setTab(tab, updateUrl = true) {
  const activeTab = VALID_TABS.includes(tab) ? tab : "expense";

  tabButtons.forEach(button => {
    const active = button.dataset.tab === activeTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });

  tabPanels.forEach(panel => {
    const active = panel.id === `${activeTab}Panel`;
    panel.hidden = !active;
  });

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url);
  }
}

tabButtons.forEach(button => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
});

window.addEventListener("popstate", () => setTab(readTabFromUrl(), false));
setTab(readTabFromUrl(), true);

// ======================================================
// 1. EXPENSE TRACKER
// ======================================================

let expenses = loadArray(STORAGE.expenses);
const expenseForm = $("#expenseForm");
const expenseList = $("#expenseList");
const expenseSearch = $("#expenseSearch");
const expenseTypeFilter = $("#expenseTypeFilter");
const expenseCategoryFilter = $("#expenseCategoryFilter");
const expenseSort = $("#expenseSort");

function saveExpenses() {
  saveArray(STORAGE.expenses, expenses);
}

function updateCategoryFilter() {
  const current = expenseCategoryFilter.value;
  const categories = [...new Set(expenses.map(item => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  expenseCategoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expenseCategoryFilter.appendChild(option);
  });
  expenseCategoryFilter.value = categories.includes(current) ? current : "all";
}

function updateExpenseSummary() {
  const income = expenses.filter(item => item.type === "income")
    .reduce((total, item) => total + Number(item.amount), 0);
  const expense = expenses.filter(item => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  $("#totalIncome").textContent = rupiah(income);
  $("#totalExpense").textContent = rupiah(expense);
  $("#balance").textContent = rupiah(income - expense);
}

function getFilteredExpenses() {
  const keyword = expenseSearch.value.trim().toLowerCase();
  const type = expenseTypeFilter.value;
  const category = expenseCategoryFilter.value;
  const sort = expenseSort.value;

  const filtered = expenses.filter(item => {
    const matchTitle = String(item.title).toLowerCase().includes(keyword);
    const matchType = type === "all" || item.type === type;
    const matchCategory = category === "all" || item.category === category;
    return matchTitle && matchType && matchCategory;
  });

  filtered.sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "largest") return Number(b.amount) - Number(a.amount);
    if (sort === "smallest") return Number(a.amount) - Number(b.amount);
    return 0;
  });
  return filtered;
}

function renderExpenses() {
  updateCategoryFilter();
  updateExpenseSummary();
  const data = getFilteredExpenses();
  expenseList.innerHTML = "";

  if (!data.length) {
    expenseList.innerHTML = '<tr><td colspan="6"><div class="empty-state">Belum ada transaksi yang sesuai.</div></td></tr>';
    return;
  }

  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td><strong>${escapeHtml(item.title)}</strong></td>
      <td><span class="badge">${escapeHtml(item.category)}</span></td>
      <td><span class="badge ${item.type === "income" ? "badge-success" : "badge-danger"}">${item.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></td>
      <td>${rupiah(Number(item.amount))}</td>
      <td><div class="actions"><button class="btn btn-outline-primary" type="button" data-action="edit-expense" data-id="${escapeAttribute(item.id)}">Ubah</button><button class="btn btn-outline-danger" type="button" data-action="delete-expense" data-id="${escapeAttribute(item.id)}">Hapus</button></div></td>`;
    expenseList.appendChild(row);
  });
}

function openExpenseModal(id = null) {
  expenseForm.reset();
  $("#expenseId").value = "";
  $("#expenseDate").value = new Date().toISOString().slice(0, 10);
  $("#expenseModalTitle").textContent = "Tambah Transaksi";

  if (id) {
    const item = expenses.find(expense => expense.id === id);
    if (!item) return;
    $("#expenseModalTitle").textContent = "Ubah Transaksi";
    $("#expenseId").value = item.id;
    $("#expenseTitle").value = item.title;
    $("#expenseCategory").value = item.category;
    $("#expenseAmount").value = item.amount;
    $("#expenseType").value = item.type;
    $("#expenseDate").value = item.date;
  }
  openDialog("expenseModal");
}

$("[data-open-expense]").addEventListener("click", () => openExpenseModal());

expenseForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#expenseTitle").value.trim();
  const category = $("#expenseCategory").value.trim();
  const amount = Number($("#expenseAmount").value);
  const type = $("#expenseType").value;
  const date = $("#expenseDate").value;
  const id = $("#expenseId").value;

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    alert("Semua field wajib diisi dan jumlah harus lebih dari 0.");
    return;
  }

  const data = { id: id || makeId(), title, category, amount, type, date };
  expenses = id ? expenses.map(item => item.id === id ? data : item) : [...expenses, data];
  saveExpenses();
  renderExpenses();
  closeDialog("expenseModal");
});

expenseList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit-expense") openExpenseModal(id);
  if (button.dataset.action === "delete-expense") requestDelete("expense", id);
});

[expenseSearch, expenseTypeFilter, expenseCategoryFilter, expenseSort].forEach(element => {
  element.addEventListener("input", renderExpenses);
  element.addEventListener("change", renderExpenses);
});

// ======================================================
// 2. BOOKMARK MANAGER
// ======================================================

let bookmarks = loadArray(STORAGE.bookmarks);
const bookmarkForm = $("#bookmarkForm");
const bookmarkList = $("#bookmarkList");
const bookmarkSearch = $("#bookmarkSearch");
const bookmarkSort = $("#bookmarkSort");

function saveBookmarks() {
  saveArray(STORAGE.bookmarks, bookmarks);
}

function getFilteredBookmarks() {
  const keyword = bookmarkSearch.value.trim().toLowerCase();
  const data = bookmarks.filter(item =>
    String(item.title).toLowerCase().includes(keyword) ||
    String(item.url).toLowerCase().includes(keyword) ||
    String(item.category).toLowerCase().includes(keyword)
  );
  data.sort((a, b) => {
    if (bookmarkSort.value === "az") return a.title.localeCompare(b.title);
    if (bookmarkSort.value === "za") return b.title.localeCompare(a.title);
    return Number(b.createdAt) - Number(a.createdAt);
  });
  return data;
}

function renderBookmarks() {
  bookmarkList.innerHTML = "";
  const data = getFilteredBookmarks();
  if (!data.length) {
    bookmarkList.innerHTML = '<div class="empty-state">Belum ada bookmark yang sesuai.</div>';
    return;
  }

  data.forEach(item => {
    const card = document.createElement("article");
    card.className = "bookmark-card";
    card.innerHTML = `
      <div class="bookmark-title"><h3>${escapeHtml(item.title)}</h3><span class="badge">${escapeHtml(item.category)}</span></div>
      <a class="bookmark-url" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a>
      <p class="bookmark-note">${escapeHtml(item.note || "Tidak ada catatan.")}</p>
      <div class="actions"><button class="btn btn-outline-primary" type="button" data-action="edit-bookmark" data-id="${escapeAttribute(item.id)}">Ubah</button><button class="btn btn-outline-danger" type="button" data-action="delete-bookmark" data-id="${escapeAttribute(item.id)}">Hapus</button></div>`;
    bookmarkList.appendChild(card);
  });
}

function openBookmarkModal(id = null) {
  bookmarkForm.reset();
  $("#bookmarkId").value = "";
  $("#bookmarkModalTitle").textContent = "Tambah Bookmark";
  if (id) {
    const item = bookmarks.find(bookmark => bookmark.id === id);
    if (!item) return;
    $("#bookmarkModalTitle").textContent = "Ubah Bookmark";
    $("#bookmarkId").value = item.id;
    $("#bookmarkTitle").value = item.title;
    $("#bookmarkUrl").value = item.url;
    $("#bookmarkCategory").value = item.category;
    $("#bookmarkNote").value = item.note || "";
  }
  openDialog("bookmarkModal");
}

$("[data-open-bookmark]").addEventListener("click", () => openBookmarkModal());

bookmarkForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#bookmarkTitle").value.trim();
  const url = $("#bookmarkUrl").value.trim();
  const category = $("#bookmarkCategory").value.trim();
  const note = $("#bookmarkNote").value.trim();
  const id = $("#bookmarkId").value;

  if (!title || !category || !validUrl(url)) {
    alert("Nama dan kategori wajib diisi. URL harus diawali http:// atau https://.");
    return;
  }

  const oldItem = bookmarks.find(item => item.id === id);
  const data = { id: id || makeId(), title, url, category, note, createdAt: oldItem?.createdAt || Date.now() };
  bookmarks = id ? bookmarks.map(item => item.id === id ? data : item) : [...bookmarks, data];
  saveBookmarks();
  renderBookmarks();
  closeDialog("bookmarkModal");
});

bookmarkList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit-bookmark") openBookmarkModal(id);
  if (button.dataset.action === "delete-bookmark") requestDelete("bookmark", id);
});

[bookmarkSearch, bookmarkSort].forEach(element => {
  element.addEventListener("input", renderBookmarks);
  element.addEventListener("change", renderBookmarks);
});

// ======================================================
// DELETE CONFIRMATION MODAL
// ======================================================

let pendingDelete = null;

function requestDelete(type, id) {
  const item = type === "expense"
    ? expenses.find(entry => entry.id === id)
    : bookmarks.find(entry => entry.id === id);
  if (!item) return;
  pendingDelete = { type, id };
  $("#deleteMessage").textContent = `Hapus ${type === "expense" ? "transaksi" : "bookmark"} "${item.title}"?`;
  openDialog("deleteModal");
}

$("#confirmDelete").addEventListener("click", () => {
  if (!pendingDelete) return;
  if (pendingDelete.type === "expense") {
    expenses = expenses.filter(item => item.id !== pendingDelete.id);
    saveExpenses();
    renderExpenses();
  } else {
    bookmarks = bookmarks.filter(item => item.id !== pendingDelete.id);
    saveBookmarks();
    renderBookmarks();
  }
  pendingDelete = null;
  closeDialog("deleteModal");
});

// ======================================================
// 3. QUIZ APP
// ======================================================

const questions = [
  { question: "Apa fungsi utama JavaScript pada halaman web?", options: ["Mengatur database server", "Membuat halaman menjadi interaktif", "Mengganti sistem operasi", "Mengatur kabel jaringan"], answer: 1 },
  { question: "Method DOM yang digunakan untuk memilih satu elemen berdasarkan selector adalah...", options: ["querySelector()", "push()", "filter()", "sort()"], answer: 0 },
  { question: "Format yang digunakan untuk menyimpan array/object ke localStorage adalah...", options: ["JSON.stringify()", "JSON.parseHTML()", "String.toObject()", "Object.local()"], answer: 0 },
  { question: "Method array untuk menambahkan data ke bagian akhir array adalah...", options: ["find()", "map()", "push()", "sort()"], answer: 2 },
  { question: "Atribut HTML untuk membuka link pada tab baru adalah...", options: ['target="_blank"', 'open="new"', 'tab="new"', 'window="blank"'], answer: 0 }
];

let quizIndex = 0;
let quizScore = 0;
let selectedAnswer = null;
let answerLocked = false;

const quizStart = $("#quizStart");
const quizQuestion = $("#quizQuestion");
const quizResult = $("#quizResult");
const questionNumber = $("#questionNumber");
const currentScore = $("#currentScore");
const questionText = $("#questionText");
const quizOptions = $("#quizOptions");
const quizFeedback = $("#quizFeedback");
const quizProgress = $("#quizProgress");
const nextQuestion = $("#nextQuestion");
const highScoreStart = $("#highScoreStart");
const highScoreResult = $("#highScoreResult");

function getHighScore() {
  return Number(localStorage.getItem(STORAGE.highScore)) || 0;
}

function updateHighScoreText() {
  const score = getHighScore();
  highScoreStart.textContent = `${score} / ${questions.length}`;
}

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  selectedAnswer = null;
  answerLocked = false;
  quizStart.classList.remove("hidden");
  quizStart.classList.add("hidden");
  quizResult.classList.add("hidden");
  quizQuestion.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const item = questions[quizIndex];
  selectedAnswer = null;
  answerLocked = false;
  questionNumber.textContent = `Soal ${quizIndex + 1} dari ${questions.length}`;
  currentScore.textContent = `Skor: ${quizScore}`;
  questionText.textContent = item.question;
  quizProgress.style.width = `${((quizIndex + 1) / questions.length) * 100}%`;
  quizFeedback.textContent = "";
  nextQuestion.disabled = true;
  nextQuestion.textContent = quizIndex === questions.length - 1 ? "Selesai" : "Jawaban & Lanjut";
  quizOptions.innerHTML = "";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    button.addEventListener("click", () => {
      if (answerLocked) return;
      $$(".quiz-option").forEach(element => element.classList.remove("selected"));
      button.classList.add("selected");
      selectedAnswer = index;
      nextQuestion.disabled = false;
    });
    quizOptions.appendChild(button);
  });
}

function submitQuizAnswer() {
  if (selectedAnswer === null || answerLocked) return;
  answerLocked = true;
  const correct = questions[quizIndex].answer === selectedAnswer;
  if (correct) {
    quizScore++;
    quizFeedback.innerHTML = '<span class="success"><strong>Benar!</strong></span>';
  } else {
    quizFeedback.innerHTML = `<span class="danger"><strong>Kurang tepat.</strong></span> Jawaban benar: ${String.fromCharCode(65 + questions[quizIndex].answer)}.`;
  }
  currentScore.textContent = `Skor: ${quizScore}`;
  nextQuestion.disabled = true;
  window.setTimeout(() => {
    if (quizIndex < questions.length - 1) {
      quizIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 650);
}

function finishQuiz() {
  const oldHighScore = getHighScore();
  if (quizScore > oldHighScore) localStorage.setItem(STORAGE.highScore, quizScore);
  quizQuestion.classList.add("hidden");
  quizResult.classList.remove("hidden");
  $("#finalScore").textContent = `${quizScore} / ${questions.length}`;
  const highScore = getHighScore();
  highScoreResult.textContent = `${highScore} / ${questions.length}`;
  highScoreStart.textContent = `${highScore} / ${questions.length}`;
}

$("#startQuiz").addEventListener("click", startQuiz);
nextQuestion.addEventListener("click", submitQuizAnswer);
$("#restartQuiz").addEventListener("click", startQuiz);

// Initial render
renderExpenses();
renderBookmarks();
updateHighScoreText();
