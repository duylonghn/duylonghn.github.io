const SHEET_ID = "1K-aaePqbch_VEEzu_3Mk4DO1xjr-TkGcZSejJmeUZRU";
let allRows = [];
let selectedWords = [];
let currentIndex = 0;
window.userAnswerArr = [];

function loadLoader() {
  return fetch(PATHS.LOADER)
    .then(res => res.text())
    .then(html => {
      document.getElementById('loader').innerHTML = html;
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = PATHS.LOADER_JS;
        script.onload = resolve;
        document.body.appendChild(script);
      });
    });
}

function fetchSheet(sheetName, callback) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  showLoading();
  fetch(url)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      const rows = json.table.rows.map(row =>
        row.c.map(cell => (cell ? cell.v : ""))
      );
      callback(rows.slice(1));
    })
    .catch(err => console.error("Lỗi khi tải sheet:", err))
    .finally(() => {
      hideLoading();
    });
}

function renderTopicsAndTypes(rows) {
  allRows = rows;
  const topics = new Set();
  const types = new Set();

  rows.forEach(row => {
    topics.add(row[0] || "None");
    types.add(row[1] || "None");
  });

  const topicDiv = document.querySelector(".topic");
  const topicSection = topicDiv.children[0];
  const typeSection = topicDiv.children[1];

  topicSection.innerHTML = '<strong>Topic:</strong><br>';
  topics.forEach(topic => {
    topicSection.innerHTML += `<label><input type="checkbox" name="topic" value="${topic}"> ${topic}</label><br>`;
  });

  typeSection.innerHTML = '<strong>Type:</strong><br>';
  types.forEach(type => {
    typeSection.innerHTML += `<label><input type="checkbox" name="type" value="${type}"> ${type}</label><br>`;
  });
}

function pickWords(rows) {
  const selectedTopics = Array.from(document.querySelectorAll("input[name='topic']:checked")).map(el => el.value);
  const selectedTypes = Array.from(document.querySelectorAll("input[name='type']:checked")).map(el => el.value);
  const isRandom = document.getElementById("shuffle").checked;
  const quantity = parseInt(document.getElementById("quantity").value) || 0;

  let filtered = rows;

  if (selectedTopics.length > 0) {
    filtered = filtered.filter(row => selectedTopics.includes(row[0] || "None"));
  } else if (selectedTypes.length > 0) {
    filtered = filtered.filter(row => selectedTypes.includes(row[1] || "None"));
  }

  if (isRandom || (!selectedTopics.length && !selectedTypes.length)) {
    filtered = filtered.sort(() => Math.random() - 0.5);
  }

  return filtered.slice(0, quantity);
}

function showCard(row) {
  const english = (row[2] || "").toLowerCase();
  const vietnamese = row[4] || "";

  document.getElementById("word").textContent = vietnamese;

  const displayAnswer = document.getElementById("display-answer");
  displayAnswer.innerHTML = "";

  for (let i = 0; i < english.length; i++) {
    const span = document.createElement("span");
    span.classList.add("letter");
    span.textContent = "_";
    displayAnswer.appendChild(span);
  }

  window.userAnswerArr = new Array(english.length).fill("_");

  const cardEl = document.querySelector(".card");
  cardEl.classList.remove("correct", "incorrect");

  document.getElementById("answer").textContent = "";

  focusHiddenInput();
}

function checkAnswer() {
  const cardEl = document.querySelector(".card");
  const userAnswer = window.userAnswerArr.join("");
  const correctAnswer = (selectedWords[currentIndex][2] || "").toLowerCase();

  if (!userAnswer || userAnswer.includes("_")) return;

  if (correctAnswer === userAnswer) {
    cardEl.classList.add("correct");
    cardEl.classList.remove("incorrect");
  } else {
    cardEl.classList.add("incorrect");
    cardEl.classList.remove("correct");
  }
}

function startSession() {
  selectedWords = pickWords(allRows);
  if (selectedWords.length === 0) return;

  showLoading();
  currentIndex = 0;
  document.querySelector(".card-container").classList.remove("hidden");
  showCard(selectedWords[currentIndex]);
  hideLoading();
}

function stopSession() {
  selectedWords = [];
  window.userAnswerArr = [];
  document.querySelector(".card-container").classList.add("hidden");
}

function showAnswer() {
  const correctAnswer = (selectedWords[currentIndex][2] || "").toLowerCase();
  const answerEl = document.getElementById("answer");
  answerEl.textContent = correctAnswer;

  const cardEl = document.querySelector(".card");
  cardEl.classList.remove("correct", "incorrect");

  focusHiddenInput();
}

function handleTyping(e) {
  if (document.querySelector(".card-container").classList.contains("hidden")) return;
  if (e.repeat) return;

  const displayAnswer = document.getElementById("display-answer");
  const letters = displayAnswer.querySelectorAll(".letter");
  const cardEl = document.querySelector(".card");

  if (e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
    const pos = window.userAnswerArr.findIndex(ch => ch === "_");
    if (pos !== -1) {
      window.userAnswerArr[pos] = e.key.toLowerCase();
      letters[pos].textContent = e.key.toLowerCase();
    }
    e.preventDefault();
  } else if (e.key === "Backspace") {
    for (let i = window.userAnswerArr.length - 1; i >= 0; i--) {
      if (window.userAnswerArr[i] !== "_") {
        window.userAnswerArr[i] = "_";
        letters[i].textContent = "_";
        break;
      }
    }
    e.preventDefault();
  } else if (e.key === "Enter") {
    checkAnswer();
    e.preventDefault();
  } else if (e.key === "ArrowRight") {
    if (currentIndex < selectedWords.length - 1) {
      currentIndex++;
      showCard(selectedWords[currentIndex]);
    }
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    if (currentIndex > 0) {
      currentIndex--;
      showCard(selectedWords[currentIndex]);
    }
    e.preventDefault();
  }

  cardEl.classList.remove("correct", "incorrect");
}

function handleMobileInput(e) {
  const value = e.target.value.toLowerCase().trim();
  if (!value) return;

  const displayAnswer = document.getElementById("display-answer");
  const letters = displayAnswer.querySelectorAll(".letter");

  const pos = window.userAnswerArr.findIndex(ch => ch === "_");
  if (pos !== -1 && /^[a-z]$/.test(value)) {
    window.userAnswerArr[pos] = value;
    letters[pos].textContent = value;
  }

  e.target.value = "";
}

function focusHiddenInput() {
  const input = document.getElementById("answer-input");
  if (input) input.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  loadLoader().then(() => {
    fetchSheet("Vocabulary", renderTopicsAndTypes);

    document.getElementById("start").addEventListener("click", () => {
      startSession();
    });
    document.getElementById("stop").addEventListener("click", stopSession);

    document.getElementById("next").addEventListener("click", () => {
      if (currentIndex < selectedWords.length - 1) {
        currentIndex++;
        showCard(selectedWords[currentIndex]);
      }
    });

    document.getElementById("prev").addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        showCard(selectedWords[currentIndex]);
      }
    });

    document.getElementById("check-answer").addEventListener("click", () => {
      checkAnswer();
    });

    document.getElementById("show-answer").addEventListener("click", () => {
      showAnswer();
    });

    document.addEventListener("keydown", handleTyping);

    const input = document.getElementById("answer-input");
    if (input) {
      input.addEventListener("input", handleMobileInput);
    }
  });
});
