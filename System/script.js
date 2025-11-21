let currentData = {};
let toolIds = [];

async function loadData() {
  try {
    const res = await fetch('data.json', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Không tìm thấy data.json');
    const data = await res.json();

    currentData = data;
    toolIds = Object.keys(data).filter(key => data[key]?.name && Array.isArray(data[key].steps));

    if (toolIds.length === 0) {
      document.getElementById('tool-list').innerHTML = '<li style="text-align:center; color:#aaa;">Chưa có công cụ</li>';
      return;
    }

    renderSidebar();
  } catch (err) {
    console.error(err);
    document.getElementById('tool-list').innerHTML = '<li style="color:#e74c3c;">Lỗi: Không load được dữ liệu</li>';
  }
}

function renderSidebar() {
  const list = document.getElementById('tool-list');
  list.innerHTML = '';

  toolIds.forEach((id, i) => {
    const tool = currentData[id];
    const li = document.createElement('li');
    li.textContent = tool.name;
    li.dataset.id = id;
    if (i === 0) li.classList.add('active');
    li.onclick = () => selectTool(id);
    list.appendChild(li);
  });

  if (toolIds[0]) selectTool(toolIds[0]);
}

function selectTool(id) {
  document.querySelectorAll('#tool-list li').forEach(li => {
    li.classList.remove('active');
    if (li.dataset.id === id) li.classList.add('active');
  });

  const steps = currentData[id]?.steps || [];
  renderSteps(steps);
}

function renderSteps(steps) {
  const container = document.getElementById('steps-container');

  if (!steps.length) {
    container.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Chưa có hướng dẫn cho công cụ này.</p>';
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = steps.map((s, index) => {
    const parts = [];

    const safeStep = safeText(s.step);
    parts.push(`<div class="step-header">${safeStep}</div>`);

    parts.push(`<div class="step-desc">${preserveNewlines(safeText(s.desc))}</div>`);

    if (s.code) {
      const safeCode = escapePreserveNewlines(s.code);
      parts.push(`
        <div class="step-code" data-code-index="${index}">
          <button class="copy-btn" data-code="${btoa(unescape(encodeURIComponent(s.code)))}">Copy</button>
          <pre><code>${safeCode}</code></pre>
        </div>
      `);
    }

    if (s.img) {
      parts.push(`
        <div class="step-image">
          <img 
            src="${s.img}" 
            alt="Bước: ${safeText(s.step)}" 
            onerror="this.src='images/placeholder.jpg'; this.onerror=null; this.alt='Ảnh không tải được';"
            loading="lazy">
        </div>
      `);
    } else {
      parts.push(`<div class="step-image"><em style="color:#aaa;"></em></div>`);
    }

    return `<div class="step-item">${parts.join('')}</div>`;
  }).join('');

  container.classList.remove('hidden');

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', copyCode);
  });
}

function safeText(text) {
  if (typeof text !== 'string') return '';
  try {
    const uint8 = new TextEncoder().encode(text);
    return new TextDecoder('utf-8', { fatal: true }).decode(uint8);
  } catch {
    return text;
  }
}

function escapePreserveNewlines(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function preserveNewlines(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\n/g, '<br>');
}

async function copyCode(e) {
  const btn = e.target;
  const encoded = btn.dataset.code;
  const code = encoded ? decodeURIComponent(escape(atob(encoded))) : '';

  try {
    await navigator.clipboard.writeText(code);
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#898989ff';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
    }, 2000);
  } catch (err) {
    alert('Copy thất bại: ' + err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
});