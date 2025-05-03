const firmwareTableBody = document.querySelector('#firmwareTable tbody');
  const sendButton = document.getElementById('sendButton');
  const statusDiv = document.getElementById('status');

  let firmwareList = [];

  // Tải danh sách firmware từ file firmware.json
  fetch('firmware.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        firmwareList = data;
        populateFirmwareTable(data);
      } else {
        console.error('Dữ liệu firmware.json không hợp lệ.');
        statusDiv.textContent = "❌ Dữ liệu firmware không hợp lệ.";
      }
    })
    .catch(err => {
      console.error('Không thể tải firmware.json:', err);
      statusDiv.textContent = "❌ Không thể tải danh sách firmware.";
    });

  // Hiển thị danh sách firmware lên bảng
  function populateFirmwareTable(firmwares) {
    firmwares.forEach(item => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = item.name;

      const noteCell = document.createElement('td');
      noteCell.textContent = item.note || '';

      const selectCell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'firmware';
      checkbox.value = item.url;
      selectCell.appendChild(checkbox);

      row.appendChild(nameCell);
      row.appendChild(noteCell);
      row.appendChild(selectCell);

      firmwareTableBody.appendChild(row);
    });
  }

  // Gửi OTA đến thiết bị ESP32
  sendButton.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="firmware"]:checked');
    if (!selected) {
      alert('Vui lòng chọn firmware.');
      return;
    }

    const firmwareUrl = selected.value;
    const deviceIp = prompt("Nhập IP thiết bị ESP32:");

    if (!deviceIp) {
      alert('Bạn cần nhập IP.');
      return;
    }

    try {
      statusDiv.textContent = "⏳ Đang gửi yêu cầu OTA...";
      const response = await fetch(`http://${deviceIp}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: firmwareUrl })
      });

      if (response.ok) {
        statusDiv.textContent = "✅ OTA thành công!";
      } else {
        statusDiv.textContent = "❌ Gửi OTA thất bại!";
      }
    } catch (error) {
      console.error(error);
      statusDiv.textContent = "❌ Lỗi kết nối đến thiết bị!";
    }
  });