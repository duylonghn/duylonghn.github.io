function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function renderCategories(commands, onCategorySelected) {
  const categories = ["All", ...new Set(commands.map(cmd => cmd.category))];
  const catList = document.getElementById('category-list');
  catList.innerHTML = '';

  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat;

    li.onclick = () => {
      const allItems = catList.querySelectorAll('li');
      allItems.forEach(item => item.classList.remove('selected'));

      li.classList.add('selected');

      const filtered = cat === "All"
        ? commands
        : commands.filter(cmd => cmd.category === cat);

      renderCommandList(filtered);

      const detail = document.getElementById('command-detail');
      if (detail) detail.classList.add('hidden');

      if (onCategorySelected) {
        onCategorySelected(cat);
      }
    };

    catList.appendChild(li);
  });

  // Tự động chọn "Tất cả" khi load
  const allLi = catList.querySelector('li');
  if (allLi) allLi.click();
}

function renderCommandList(commands) {
  const container = document.getElementById('command-list');
  container.innerHTML = '';
  container.classList.remove('hidden');

  commands.forEach(cmd => {
    const div = document.createElement('div');
    div.className = 'command-item';
    div.textContent = `${cmd.command}`;
    div.onclick = () => {
      window.location.href = `detail.html?cmd=${cmd.command}`;
    };
    container.appendChild(div);
  });
}

function renderCommandDetail(cmd) {
  const detail = document.getElementById("command-detail");

  if (!cmd) {
    detail.innerHTML = `<p>Không tìm thấy lệnh!</p>`;
    return;
  }

  detail.className = 'command-detail';
  detail.innerHTML = `
    <h2>${cmd.command}</h2>
    <p><strong>Description:</strong> ${cmd.description || "None"}</p>
    ${cmd.syntax ? `<p><strong>Syntax:</strong></p>
      <ul>${(Array.isArray(cmd.syntax) ? cmd.syntax : [cmd.syntax]).map(s => `<li><code>${s}</code></li>`).join('')}</ul>` : ''}

    ${cmd.purpose ? `<p><strong>Purpose:</strong></p>
      <ul>${cmd.purpose.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}

    ${cmd.parameters ? `<p><strong>Parameters:</strong></p>
      <ul>${Object.entries(cmd.parameters).map(([k, v]) => `<li><code>${k}</code>: ${v}</li>`).join('')}</ul>` : ''}

    ${cmd.options ? `<p><strong>Options:</strong></p>
      <ul>${cmd.options.map(o => `<li><code>${o.option}</code>: ${o.description}</li>`).join('')}</ul>` : ''}

    ${cmd.return_value ? `<p><strong>Return value:</strong> ${cmd.return_value}</p>` : ''}

    ${cmd.examples ? `<p><strong>Exemple:</strong></p>
      <ul>${cmd.examples.map(e => `<li><code>${e}</code></li>`).join('')}</ul>` : ''}

    ${cmd.notes ? `<p><strong>Note:</strong></p>
      <ul>${cmd.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
  `;
}


// === Trang index.html ===
if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
  window.onload = async () => {
    const res = await fetch("commands.json");
    const allCommands = await res.json();

    let currentCategory = "Tất cả";

    renderCategories(allCommands, (selectedCat) => {
      currentCategory = selectedCat;
    });

    const search = document.getElementById('search');
    const detail = document.getElementById('command-detail');

    search.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();

      if (keyword === '') {
        // Nếu không có từ khóa, hiển thị lại theo nhóm đã chọn
        const filtered = currentCategory === "Tất cả"
          ? allCommands
          : allCommands.filter(cmd => cmd.category === currentCategory);
        renderCommandList(filtered);
        if (detail) detail.classList.add('hidden');
        return;
      }

      // Nếu có từ khóa, lọc toàn bộ
      const filtered = allCommands.filter(cmd =>
        cmd.command.toLowerCase().includes(keyword)
      );

      renderCommandList(filtered);
      if (detail) detail.classList.add('hidden');
    });
  };
}

// === Trang detail.html ===
if (window.location.pathname.endsWith("detail.html")) {
  window.onload = async () => {
    const cmdName = getQueryParam("cmd");
    const res = await fetch("commands.json");
    const commands = await res.json();
    const cmd = commands.find(c => c.command === cmdName);
    renderCommandDetail(cmd);
  };
}
