const SHEET_ID = "1K-aaePqbch_VEEzu_3Mk4DO1xjr-TkGcZSejJmeUZRU";

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

function renderVocabulary(rows) {
  const tbody = document.querySelector("#vocab-table tbody");
  if (!tbody) return;

  rows.forEach(row => {
    const tr = document.createElement("tr");

    for (let i = 0; i < 5; i++) {
      const td = document.createElement("td");
      td.textContent = row[i] || "";
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function addSearchFilter(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;

  input.addEventListener("input", () => {
    const keyword = input.value.toLowerCase();
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(keyword) ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLoader()
    .then(() => {
      fetchSheet("Vocabulary", renderVocabulary);
      addSearchFilter("search", "vocab-table");
    })
    .catch(err => console.error("Lỗi khi tải loader:", err));
});