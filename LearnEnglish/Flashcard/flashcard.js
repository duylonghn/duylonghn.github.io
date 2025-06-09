const SHEET_ID = "1K-aaePqbch_VEEzu_3Mk4DO1xjr-TkGcZSejJmeUZRU";
let allRows = [];
let selectedWords = [];
let wordDataMap = {};
let currentIndex = 0;

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

function fetchWordData(word) {
  return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    .then(res => res.json())
    .then(data => {
      const phonetic = data[0]?.phonetics?.find(p => p.audio || p.text);
      return {
        ipa: phonetic?.text || '',
        audio: phonetic?.audio || ''
      };
    })
    .catch(() => ({ ipa: '', audio: '' }));
}

function preloadWordData(words) {
  const fetches = words.map(row => {
    const word = row[2];
    return fetchWordData(word).then(data => {
      wordDataMap[word] = data;
    });
  });
  return Promise.all(fetches);
}

function showCard(row) {
  const word = row[2];
  const ipa = row[3] || "";
  const mean = row[4];
  document.getElementById("word").textContent = word;
  document.getElementById("ipa").textContent = ipa;
  document.getElementById("mean").textContent = mean;
}

function speak(event) {
  event.stopPropagation();
  const word = document.getElementById("word").textContent;
  const audioUrl = wordDataMap[word]?.audio;
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
  } else {
    const utterance = new SpeechSynthesisUtterance(word);
    speechSynthesis.speak(utterance);
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
  wordDataMap = {};
  document.querySelector(".card-container").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  loadLoader().then(() => {
    fetchSheet("Vocabulary", renderTopicsAndTypes);

    document.getElementById("start").addEventListener("click", startSession);
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

    document.getElementById("flip-card").addEventListener("click", function () {
      this.classList.toggle("is-flipped");
    });

    document.addEventListener("keydown", (e) => {
      if (document.querySelector(".card-container").classList.contains("hidden")) return;

      switch (e.key) {
        case "ArrowLeft":
          if (currentIndex > 0) {
            currentIndex--;
            showCard(selectedWords[currentIndex]);
          }
          break;
        case "ArrowRight":
          if (currentIndex < selectedWords.length - 1) {
            currentIndex++;
            showCard(selectedWords[currentIndex]);
          }
          break;
      }
    });
  });
});
