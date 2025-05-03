// Lấy các phần tử DOM
const boardSelect = document.getElementById('boardSelect');
const firmwareTableBody = document.getElementById('firmwareTable').getElementsByTagName('tbody')[0];
const installButton = document.getElementById('installButton');
const successMessage = document.getElementById('successMessage');
const loadingMessage = document.getElementById('loadingMessage');

let manifestData = null;

// Tải manifest từ server
fetch('/ESP32/manifest.json')
  .then(response => response.json())
  .then(data => {
    manifestData = data;
    populateBoardSelect(data.devices);
  })
  .catch(err => {
    console.error("Lỗi khi tải manifest:", err);
    alert("❌ Không thể tải danh sách thiết bị.");
  });

// Hiển thị các loại bo mạch trong <select>
function populateBoardSelect(devices) {
  boardSelect.innerHTML = '<option value="">-- Chọn thiết bị --</option>';
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
  installButton.removeAttribute('manifest');

  const device = manifestData.devices.find(d => d.id === selectedId);
  if (device) {
    device.firmwares.forEach(fw => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${fw.name}</td>
        <td><input type="radio" name="firmware" value="${fw.url}"></td>
      `;
      firmwareTableBody.appendChild(row);
    });

    // Gắn sự kiện khi chọn radio
    document.querySelectorAll('input[name="firmware"]').forEach(input => {
      input.addEventListener('change', function () {
        installButton.setAttribute('manifest', this.value);
        console.log("Đã gán manifest cho install button:", this.value);
      });
    });
  }
});
