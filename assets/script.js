// ======================================================
// PABWE P3 - JAVASCRIPT MINI PROJECT
// Expense Tracker + Bookmark Manager + Quiz App
// ======================================================

const STORAGE = {
  expenses: "pabwe_p3_expenses",
  bookmarks: "pabwe_p3_bookmarks",
  highScore: "pabwe_p3_high_score"
};

// ======================================================
// TAB NAVIGATION
// ======================================================

const VALID_TABS = ["expense", "bookmark", "quiz"];
const tabButtons = document.querySelectorAll("#mainTabs .nav-link");
const tabPanels = document.querySelectorAll(".tab-panel");

function getTabFromUrl() {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return VALID_TABS.includes(tab) ? tab : "expense";
}

function updateTabUrl(tabId, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tabId);

  if (replace) {
    history.replaceState({ tab: tabId }, "", url);
  } else {
    history.pushState({ tab: tabId }, "", url);
  }
}

function showTab(tabId, updateUrl = true) {
  const activeTab = VALID_TABS.includes(tabId) ? tabId : "expense";

  tabButtons.forEach(button => {
    const isActive = button.dataset.tab === activeTab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach(panel => {
    const isActive = panel.id === `${activeTab}Panel`;
    panel.classList.toggle("d-none", !isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  if (updateUrl && getTabFromUrl() !== activeTab) {
    updateTabUrl(activeTab);
  }
}

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    showTab(button.dataset.tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

window.addEventListener("popstate", () => {
  showTab(getTabFromUrl(), false);
});

showTab(getTabFromUrl(), false);

// ======================================================
// HELPER
// ======================================================

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

// ======================================================
// 1. EXPENSE TRACKER
// ======================================================

let expenses = JSON.parse(localStorage.getItem(STORAGE.expenses)) || [];

const expenseForm = document.querySelector("#expenseForm");
const expenseList = document.querySelector("#expenseList");
const expenseSearch = document.querySelector("#expenseSearch");
const expenseTypeFilter = document.querySelector("#expenseTypeFilter");
const expenseCategoryFilter = document.querySelector("#expenseCategoryFilter");
const expenseSort = document.querySelector("#expenseSort");

function saveExpenses() {
  localStorage.setItem(STORAGE.expenses, JSON.stringify(expenses));
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
  const income = expenses
    .filter(item => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expense = expenses
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  document.querySelector("#totalIncome").textContent = rupiah(income);
  document.querySelector("#totalExpense").textContent = rupiah(expense);
  document.querySelector("#balance").textContent = rupiah(income - expense);
}

function getFilteredExpenses() {
  const keyword = expenseSearch.value.trim().toLowerCase();
  const type = expenseTypeFilter.value;
  const category = expenseCategoryFilter.value;
  const sort = expenseSort.value;

  const filtered = expenses.filter(item => {
    const matchTitle = item.title.toLowerCase().includes(keyword);
    const matchType = type === "all" || item.type === type;
    const matchCategory = category === "all" || item.category === category;
    return matchTitle && matchType && matchCategory;
  });

  filtered.sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "largest") return b.amount - a.amount;
    if (sort === "smallest") return a.amount - b.amount;
    return 0;
  });

  return filtered;
}

function renderExpenses() {
  updateCategoryFilter();
  updateExpenseSummary();

  const data = getFilteredExpenses();
  expenseList.innerHTML = "";

  if (data.length === 0) {
    expenseList.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">Belum ada transaksi yang sesuai.</div>
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.date}</td>
      <td class="fw-semibold">${escapeHtml(item.title)}</td>
      <td><span class="badge text-bg-light">${escapeHtml(item.category)}</span></td>
      <td>
        <span class="badge ${item.type === "income" ? "text-bg-success" : "text-bg-danger"}">
          ${item.type === "income" ? "Pemasukan" : "Pengeluaran"}
        </span>
      </td>
      <td>${rupiah(item.amount)}</td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary" data-action="edit-expense" data-id="${item.id}">
            Ubah
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-expense" data-id="${item.id}">
            Hapus
          </button>
        </div>
      </td>
    `;

    expenseList.appendChild(row);
  });
}

function openExpenseModal(id = null) {
  const form = expenseForm;
  form.reset();
  document.querySelector("#expenseId").value = "";
  document.querySelector("#expenseDate").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#expenseModalTitle").textContent = "Tambah Transaksi";

  if (id) {
    const item = expenses.find(expense => expense.id === id);
    if (!item) return;

    document.querySelector("#expenseModalTitle").textContent = "Ubah Transaksi";
    document.querySelector("#expenseId").value = item.id;
    document.querySelector("#expenseTitle").value = item.title;
    document.querySelector("#expenseCategory").value = item.category;
    document.querySelector("#expenseAmount").value = item.amount;
    document.querySelector("#expenseType").value = item.type;
    document.querySelector("#expenseDate").value = item.date;
  }

  bootstrap.Modal.getOrCreateInstance(document.querySelector("#expenseModal")).show();
}

expenseForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.querySelector("#expenseTitle").value.trim();
  const category = document.querySelector("#expenseCategory").value.trim();
  const amount = Number(document.querySelector("#expenseAmount").value);
  const type = document.querySelector("#expenseType").value;
  const date = document.querySelector("#expenseDate").value;
  const id = document.querySelector("#expenseId").value;

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    event.target.reportValidity();
    return;
  }

  const data = { id: id || makeId(), title, category, amount, type, date };

  if (id) {
    expenses = expenses.map(item => item.id === id ? data : item);
  } else {
    expenses.push(data);
  }

  saveExpenses();
  renderExpenses();

  bootstrap.Modal.getOrCreateInstance(document.querySelector("#expenseModal")).hide();
  form.reset();
});

expenseList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;

  if (button.dataset.action === "edit-expense") {
    openExpenseModal(id);
  }

  if (button.dataset.action === "delete-expense") {
    const item = expenses.find(expense => expense.id === id);
    if (!item) return;

    openDeleteModal("expense", id, item.title);
  }
});

[expenseSearch, expenseTypeFilter, expenseCategoryFilter, expenseSort]
  .forEach(element => {
    element.addEventListener("input", renderExpenses);
    element.addEventListener("change", renderExpenses);
  });

renderExpenses();

// ======================================================
// 2. BOOKMARK MANAGER
// ======================================================

let bookmarks = JSON.parse(localStorage.getItem(STORAGE.bookmarks)) || [];

const bookmarkForm = document.querySelector("#bookmarkForm");
const bookmarkList = document.querySelector("#bookmarkList");
const bookmarkSearch = document.querySelector("#bookmarkSearch");
const bookmarkSort = document.querySelector("#bookmarkSort");

function saveBookmarks() {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFilteredBookmarks() {
  const keyword = bookmarkSearch.value.trim().toLowerCase();
  const sort = bookmarkSort.value;

  const data = bookmarks.filter(item =>
    item.title.toLowerCase().includes(keyword) ||
    item.url.toLowerCase().includes(keyword) ||
    item.category.toLowerCase().includes(keyword)
  );

  data.sort((a, b) => {
    if (sort === "az") return a.title.localeCompare(b.title);
    if (sort === "za") return b.title.localeCompare(a.title);
    return b.createdAt - a.createdAt;
  });

  return data;
}

function renderBookmarks() {
  bookmarkList.innerHTML = "";
  const data = getFilteredBookmarks();

  if (data.length === 0) {
    bookmarkList.innerHTML = `
      <div class="col-12">
        <div class="empty-state border rounded-3 bg-white">
          Belum ada bookmark yang sesuai.
        </div>
      </div>
    `;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "col-md-6";

    card.innerHTML = `
      <div class="card h-100 app-card">
        <div class="card-body">
          <div class="d-flex justify-content-between gap-2">
            <h3 class="h5 mb-2">${escapeHtml(item.title)}</h3>
            <span class="badge text-bg-light">${escapeHtml(item.category)}</span>
          </div>
          <a href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer" class="small d-block mb-2">
            ${escapeHtml(item.url)}
          </a>
          <p class="text-secondary small mb-3">
            ${escapeHtml(item.note || "Tidak ada catatan.")}
          </p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" data-action="edit-bookmark" data-id="${item.id}">
              Ubah
            </button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete-bookmark" data-id="${item.id}">
              Hapus
            </button>
          </div>
        </div>
      </div>
    `;

    bookmarkList.appendChild(card);
  });
}

function openBookmarkModal(id = null) {
  bookmarkForm.reset();
  document.querySelector("#bookmarkId").value = "";
  document.querySelector("#bookmarkModalTitle").textContent = "Tambah Bookmark";

  if (id) {
    const item = bookmarks.find(bookmark => bookmark.id === id);
    if (!item) return;

    document.querySelector("#bookmarkModalTitle").textContent = "Ubah Bookmark";
    document.querySelector("#bookmarkId").value = item.id;
    document.querySelector("#bookmarkTitle").value = item.title;
    document.querySelector("#bookmarkUrl").value = item.url;
    document.querySelector("#bookmarkCategory").value = item.category;
    document.querySelector("#bookmarkNote").value = item.note;
  }

  bootstrap.Modal.getOrCreateInstance(document.querySelector("#bookmarkModal")).show();
}

bookmarkForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.querySelector("#bookmarkTitle").value.trim();
  const url = document.querySelector("#bookmarkUrl").value.trim();
  const category = document.querySelector("#bookmarkCategory").value.trim();
  const note = document.querySelector("#bookmarkNote").value.trim();
  const id = document.querySelector("#bookmarkId").value;

  if (!title || !category || !validUrl(url)) {
    event.target.reportValidity();
    return;
  }

  const data = {
    id: id || makeId(),
    title,
    url,
    category,
    note,
    createdAt: id
      ? (bookmarks.find(item => item.id === id)?.createdAt || Date.now())
      : Date.now()
  };

  if (id) {
    bookmarks = bookmarks.map(item => item.id === id ? data : item);
  } else {
    bookmarks.push(data);
  }

  saveBookmarks();
  renderBookmarks();

  bootstrap.Modal.getOrCreateInstance(document.querySelector("#bookmarkModal")).hide();
  bookmarkForm.reset();
});

bookmarkList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;

  if (button.dataset.action === "edit-bookmark") {
    openBookmarkModal(id);
  }

  if (button.dataset.action === "delete-bookmark") {
    const item = bookmarks.find(bookmark => bookmark.id === id);
    if (!item) return;

    openDeleteModal("bookmark", id, item.title);
  }
});

[bookmarkSearch, bookmarkSort]
  .forEach(element => {
    element.addEventListener("input", renderBookmarks);
    element.addEventListener("change", renderBookmarks);
  });

renderBookmarks();

// ======================================================
// DELETE CONFIRMATION MODAL
// ======================================================

let pendingDelete = null;

const deleteModalElement = document.querySelector("#deleteModal");
const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalElement);
const confirmDeleteButton = document.querySelector("#confirmDelete");
const deleteModalBody = deleteModalElement.querySelector(".modal-body");

function openDeleteModal(type, id, title) {
  pendingDelete = { type, id };
  deleteModalBody.textContent = `Apakah kamu yakin ingin menghapus "${title}"?`;
  deleteModal.show();
}

confirmDeleteButton.addEventListener("click", () => {
  if (!pendingDelete) return;

  if (pendingDelete.type === "expense") {
    expenses = expenses.filter(item => item.id !== pendingDelete.id);
    saveExpenses();
    renderExpenses();
  } else if (pendingDelete.type === "bookmark") {
    bookmarks = bookmarks.filter(item => item.id !== pendingDelete.id);
    saveBookmarks();
    renderBookmarks();
  }

  pendingDelete = null;
  deleteModal.hide();
});

// ======================================================
// 3. QUIZ APP
// =======================================================


const questions = [
  {
    question: "Apa fungsi utama JavaScript pada halaman web?",
    options: [
      "Mengatur database server",
      "Membuat halaman menjadi interaktif",
      "Mengganti sistem operasi",
      "Mengatur kabel jaringan"
    ],
    answer: 1
  },
  {
    question: "Method DOM yang digunakan untuk memilih satu elemen berdasarkan selector adalah...",
    options: [
      "querySelector()",
      "push()",
      "filter()",
      "sort()"
    ],
    answer: 0
  },
  {
    question: "Format yang digunakan untuk menyimpan array/object ke localStorage adalah...",
    options: [
      "JSON.stringify()",
      "JSON.parseHTML()",
      "String.toObject()",
      "Object.local()"
    ],
    answer: 0
  },
  {
    question: "Method array untuk menambahkan data ke bagian akhir array adalah...",
    options: [
      "find()",
      "map()",
      "push()",
      "sort()"
    ],
    answer: 2
  },
  {
    question: "Atribut HTML untuk membuka link pada tab baru adalah...",
    options: [
      "target=\"_blank\"",
      "open=\"new\"",
      "tab=\"new\"",
      "window=\"blank\""
    ],
    answer: 0
  }
];

let quizIndex = 0;
let quizScore = 0;
let selectedAnswer = null;

const quizStart = document.querySelector("#quizStart");
const quizQuestion = document.querySelector("#quizQuestion");
const quizResult = document.querySelector("#quizResult");
const questionNumber = document.querySelector("#questionNumber");
const currentScore = document.querySelector("#currentScore");
const questionText = document.querySelector("#questionText");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");
const quizProgress = document.querySelector("#quizProgress");
const nextQuestion = document.querySelector("#nextQuestion");
const highScoreStart = document.querySelector("#highScoreStart");
const highScoreResult = document.querySelector("#highScoreResult");

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

  quizStart.classList.add("d-none");
  quizResult.classList.add("d-none");
  quizQuestion.classList.remove("d-none");

  renderQuestion();
}

function renderQuestion() {
  const item = questions[quizIndex];
  selectedAnswer = null;

  questionNumber.textContent = `Soal ${quizIndex + 1} dari ${questions.length}`;
  currentScore.textContent = `Skor: ${quizScore}`;
  questionText.textContent = item.question;
  quizProgress.style.width = `${((quizIndex + 1) / questions.length) * 100}%`;
  quizFeedback.textContent = "";
  nextQuestion.disabled = true;
  nextQuestion.textContent =
    quizIndex === questions.length - 1 ? "Selesai" : "Jawaban & Lanjut";

  quizOptions.innerHTML = "";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    button.addEventListener("click", () => {
      document.querySelectorAll(".quiz-option")
        .forEach(element => element.classList.remove("selected"));

      button.classList.add("selected");
      selectedAnswer = index;
      nextQuestion.disabled = false;
    });

    quizOptions.appendChild(button);
  });
}

function submitQuizAnswer() {
  if (selectedAnswer === null) return;

  const correct = questions[quizIndex].answer === selectedAnswer;

  if (correct) {
    quizScore++;
    quizFeedback.innerHTML = '<span class="text-success fw-semibold">Benar!</span>';
  } else {
    quizFeedback.innerHTML =
      `<span class="text-danger fw-semibold">Kurang tepat.</span> ` +
      `Jawaban benar: ${String.fromCharCode(65 + questions[quizIndex].answer)}.`;
  }

  currentScore.textContent = `Skor: ${quizScore}`;
  nextQuestion.disabled = true;

  setTimeout(() => {
    if (quizIndex < questions.length - 1) {
      quizIndex++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }, 700);
}

function finishQuiz() {
  const oldHighScore = getHighScore();

  if (quizScore > oldHighScore) {
    localStorage.setItem(STORAGE.highScore, quizScore);
  }

  quizQuestion.classList.add("d-none");
  quizResult.classList.remove("d-none");

  document.querySelector("#finalScore").textContent =
    `${quizScore} / ${questions.length}`;

  const highScore = getHighScore();
  highScoreResult.textContent = `${highScore} / ${questions.length}`;
  highScoreStart.textContent = `${highScore} / ${questions.length}`;
}

document.querySelector("#startQuiz").addEventListener("click", startQuiz);
nextQuestion.addEventListener("click", submitQuizAnswer);
document.querySelector("#restartQuiz").addEventListener("click", startQuiz);

updateHighScoreText();

