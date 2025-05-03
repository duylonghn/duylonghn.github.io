const boardSelect = document.getElementById('boardSelect');
const firmwareTableBody = document.getElementById('firmwareTable').getElementsByTagName('tbody')[0];
const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');

let manifestData = null;

// Tải manifest từ server
fetch('manifest.json')
  .then(response => response.json())
  .then(data => {
    manifestData = data;
    populateBoardSelect(data.devices);
  })
  .catch(err => {
    console.error("Lỗi khi tải manifest:", err);
    statusDiv.textContent = "❌ Không thể tải danh sách thiết bị.";
  });

// Hiển thị các loại bo mạch trong <select>
function populateBoardSelect(devices) {
  devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.id;
    option.textContent = device.name;
    boardSelect.appendChild(option);
  });
}

// Khi người dùng chọn thiết bị
boardSelect.addEventListener('change', function () {
  const selectedId = this.value;
  firmwareTableBody.innerHTML = '';

  const device = manifestData.devices.find(d => d.id === selectedId);
  if (device) {
    device.firmwares.forEach(fw => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${fw.name}</td>
        <td><input type="checkbox" name="firmware" value="${fw.url}"></td>
      `;
      firmwareTableBody.appendChild(row);
    });
  }
});

// Gửi OTA đến IP thiết bị
sendButton.addEventListener('click', async function () {
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
