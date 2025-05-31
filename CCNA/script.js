const SHEET_ID = "1-3EDNYlLFvrCsqEaChY6J2R5Uux-jH0V4iOQfGwyTK4";

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

// Hàm fetch dữ liệu từ Google Sheets
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
    });;
}

// Hiển thị bảng command với xử lý gộp ý nghĩa + danh sách
function renderCommands(rows) {
  const tbody = document.querySelector("#command-table tbody");
  if (!tbody) return;

  let lastMeaning = "";

  rows.forEach(row => {
    const tr = document.createElement("tr");

    for (let i = 0; i < 4; i++) {
      const td = document.createElement("td");

      if (i === 3) {
        const meaning = row[i] || lastMeaning;
        lastMeaning = meaning;

        const lines = meaning.split(/[\n\r]+|•|- /).filter(l => l.trim() !== "");
        if (lines.length > 1) {
          const ul = document.createElement("ul");
          lines.forEach(line => {
            const li = document.createElement("li");
            li.textContent = line.trim();
            ul.appendChild(li);
          });
          td.appendChild(ul);
        } else {
          td.textContent = meaning;
        }
      } else {
        td.textContent = row[i] || "";
      }

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function renderTemplates(rows) {
  const tbody = document.querySelector("#template-table tbody");
  if (!tbody) return;

  rows.forEach(row => {
    const tr = document.createElement("tr");

    // Cột Tên (index 0) giữ nguyên dùng textContent
    const tdName = document.createElement("td");
    tdName.textContent = row[0] || "";
    tr.appendChild(tdName);

    // Cột Mẫu (index 1) xử lý xuống dòng
    const tdTemplate = document.createElement("td");
    if (row[1]) {
      // Thay các ký tự xuống dòng trong chuỗi thành thẻ <br>
      const htmlContent = row[1].replace(/\n/g, "<br>");
      tdTemplate.innerHTML = htmlContent;
    } else {
      tdTemplate.textContent = "";
    }
    tr.appendChild(tdTemplate);

    tbody.appendChild(tr);
  });
}

// Thêm ô tìm kiếm theo từ khóa
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

// Chạy khi trang được tải
document.addEventListener("DOMContentLoaded", () => {
  loadLoader()
  .then(() => {
    // Gọi các thao tác sau khi loader.js đã được tải xong
    if (document.querySelector("#command-table")) {
      fetchSheet("Commands", renderCommands);
      addSearchFilter("search-code", "command-table");
    }

    if (document.querySelector("#template-table")) {
      fetchSheet("Template", renderTemplates);
      addSearchFilter("search-temp", "template-table");
    }

    setupSidebarSelection();
  })
  .catch(err => console.error("Lỗi khi tải loader:", err));
});

// Xử lý chọn mục trong sidebar
function setupSidebarSelection() {
  const commandLi = document.querySelector("#command-category li");
  const templateLi = document.querySelector("#template-category li");

  if (commandLi && window.location.pathname.includes("index")) {
    commandLi.classList.add("selected");
  }

  if (templateLi && window.location.pathname.includes("template")) {
    templateLi.classList.add("selected");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarSelection();
});
