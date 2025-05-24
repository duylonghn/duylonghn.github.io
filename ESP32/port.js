document.addEventListener('DOMContentLoaded', () => {
  const firmwareTableBody = document.querySelector('#firmwareTable tbody');
  const successMessage = document.getElementById('successMessage');
  const boardSelect = document.getElementById('boardSelect');

  let firmwareData = [];

  fetch('firmware.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        firmwareData = data;
        populateBoardOptions(data);
      } else {
        console.error('Dữ liệu firmware.json không hợp lệ.');
      }
    })
    .catch(err => {
      console.error('Không thể tải firmware-list.json:', err);
    });

  function populateBoardOptions(data) {
    const boards = [...new Set(data.map(item => item.board))];
    boards.forEach(board => {
      const option = document.createElement('option');
      option.value = board;
      option.textContent = board;
      boardSelect.appendChild(option);
    });
  }

  function renderFirmwareList(boardFilter) {
    firmwareTableBody.innerHTML = '';

    const filtered = firmwareData.filter(item => item.board === boardFilter);
    if (filtered.length === 0) {
      const emptyRow = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'Không có firmware nào cho board này.';
      emptyRow.appendChild(td);
      firmwareTableBody.appendChild(emptyRow);
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = item.name;

      const noteCell = document.createElement('td');
      noteCell.textContent = item.note || '';

      const buttonCell = document.createElement('td');
      const installBtn = document.createElement('esp-web-install-button');
      installBtn.setAttribute('manifest', item.manifest);
      installBtn.addEventListener('installation-success', () => {
        successMessage.style.display = 'block';
        setTimeout(() => {
          window.scrollTo({ top: successMessage.offsetTop, behavior: 'smooth' });
        }, 500);
      });

      buttonCell.appendChild(installBtn);
      row.appendChild(nameCell);
      row.appendChild(noteCell);
      row.appendChild(buttonCell);

      firmwareTableBody.appendChild(row);
    });
  }

  boardSelect.addEventListener('change', () => {
    const selectedBoard = boardSelect.value;
    if (selectedBoard) {
      renderFirmwareList(selectedBoard);
    } else {
      firmwareTableBody.innerHTML = '';
    }
  });
});