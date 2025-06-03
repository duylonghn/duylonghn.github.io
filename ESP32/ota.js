let selectedManifest = null;

document.addEventListener('DOMContentLoaded', () => {
  const boardSelect = document.getElementById('boardSelect');
  const firmwareTable = document.getElementById('firmwareTable').getElementsByTagName('tbody')[0];
  const uploadBtn = document.getElementById('upload');
  const successMessage = document.getElementById('successMessage');
  const loadingMessage = document.getElementById('loadingMessage');
  const deviceIPInput = document.getElementById('deviceIP');

  // Tải danh sách firmware
  fetch('firmware.json')
    .then(res => res.json())
    .then(data => {
      const uniqueBoards = [...new Set(data.map(item => item.board))];
      uniqueBoards.forEach(board => {
        const option = document.createElement('option');
        option.value = board;
        option.textContent = board;
        boardSelect.appendChild(option);
      });

      boardSelect.addEventListener('change', () => {
        const selectedBoard = boardSelect.value;
        const filteredFirmwares = data.filter(fw => fw.board === selectedBoard);
        renderFirmwareTable(filteredFirmwares);
      });
    });

  function renderFirmwareTable(firmwareList) {
    firmwareTable.innerHTML = '';
    selectedManifest = null;

    firmwareList.forEach((fw, index) => {
      const row = firmwareTable.insertRow();
      row.insertCell().textContent = fw.name;
      row.insertCell().textContent = fw.note;

      const selectCell = row.insertCell();
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'firmwareOption';
      radio.value = fw.manifest;
      radio.addEventListener('change', () => {
        selectedManifest = fw.manifest;
      });
      selectCell.appendChild(radio);
    });
  }

  uploadBtn.addEventListener('click', async () => {
    const ip = deviceIPInput.value.trim();

    if (!ip) {
      alert('Vui lòng nhập địa chỉ IP của thiết bị ESP32.');
      return;
    }

    if (!selectedManifest) {
      alert('Vui lòng chọn một firmware để nạp.');
      return;
    }

    try {
      loadingMessage.style.display = 'block';
      successMessage.style.display = 'none';

      // Lấy manifest → lấy đường dẫn file bin
      const manifestRes = await fetch(selectedManifest);
      const manifestData = await manifestRes.json();
      const firmwarePath = manifestData.firmware;

      // Lấy file bin từ server
      const binRes = await fetch(firmwarePath);
      const binBlob = await binRes.blob();

      const formData = new FormData();
      formData.append('file', binBlob, firmwarePath.split('/').pop());

      const otaUrl = `http://${ip}/update`;

      const otaRes = await fetch(otaUrl, {
        method: 'POST',
        body: formData,
      });

      loadingMessage.style.display = 'none';

      if (otaRes.ok) {
        successMessage.style.display = 'block';
      } else {
        alert('Nạp firmware thất bại. Vui lòng kiểm tra kết nối.');
      }
    } catch (err) {
      loadingMessage.style.display = 'none';
      alert('Đã xảy ra lỗi: ' + err.message);
    }
  });
});
