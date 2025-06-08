const SHEET_ID = "1K-aaePqbch_VEEzu_3Mk4DO1xjr-TkGcZSejJmeUZRU";
const SHEET_NAME = "Vocabulary";
const ADD_ENDPOINT = `https://script.google.com/macros/s/AKfycby5smI0mYT9_UMP8qJy1PwtbvNMw3r4pjtMXytZCo8ke-iFpiw4seQKOIYI55IeNSKZ/exec`;

let entries = [];

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

document.addEventListener("DOMContentLoaded", () => {
  loadLoader().then(() => {
    const topicInput = document.getElementById("topic");
    const typeInput = document.getElementById("type");
    const engInput = document.getElementById("english");
    const vieInput = document.getElementById("vietnamese");
    const addBtn = document.getElementById("add-word");
    const saveBtn = document.getElementById("save");
    const tbody = document.querySelector("#vocab-table tbody");

    function addRow() {
      const topic = topicInput.value.trim();
      const type = typeInput.value.trim();
      const english = engInput.value.trim();
      const vietnamese = vieInput.value.trim();

      if (!english || !vietnamese) {
        alert("Vui lòng nhập đầy đủ English và Vietnamese.");
        return;
      }

      const newRow = document.createElement("tr");
      [topic, type, english, vietnamese].forEach(val => {
        const td = document.createElement("td");
        td.textContent = val;
        newRow.appendChild(td);
      });
      tbody.appendChild(newRow);

      entries.push([topic, type, english, vietnamese]);

      topicInput.value = "";
      typeInput.value = "";
      engInput.value = "";
      vieInput.value = "";

      engInput.focus();
    }

    addBtn.addEventListener("click", addRow);

    [topicInput, typeInput, engInput, vieInput].forEach(input => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          addRow();
        }
      });
    });

    saveBtn.addEventListener("click", () => {
      if (entries.length === 0) {
        alert("Không có dữ liệu để lưu.");
        return;
      }

      // Gọi showLoading() từ file loader.js
      showLoading();

      fetch(ADD_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          sheet: SHEET_NAME,
          data: entries
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          alert("Đã lưu thành công!");
          entries = [];
          document.querySelector("#vocab-table tbody").innerHTML = "";
        } else {
          throw new Error("Lỗi từ server");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Đã xảy ra lỗi khi lưu.");
      })
      .finally(() => {
        // Ẩn loader
        hideLoading();
      });
    });
  })
  .catch(err => {
    console.error("Lỗi khi load loader:", err);
  });
});
