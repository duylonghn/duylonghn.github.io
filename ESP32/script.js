// Lấy các phần tử DOM
const boardSelect = document.getElementById('boardSelect');
const firmwareSelect = document.getElementById('firmwareSelect');
const installButton = document.getElementById('installButton');
const successMessage = document.getElementById('successMessage');
const loadingMessage = document.getElementById('loadingMessage');

// Hàm tải danh sách firmware từ manifestMap.json
async function loadManifests() {
  try {
    const response = await fetch('manifestMap.json');
    console.log("Đang tải manifest từ: manifestMap.json");

    if (!response.ok) throw new Error('Không thể tải file manifest');

    const manifests = await response.json();
    console.log('Manifest tải về:', manifests);
    return manifests;
  } catch (error) {
    console.error('Lỗi khi tải manifest:', error);
    alert('Không thể tải dữ liệu firmware. Vui lòng thử lại sau.');
    return null;
  }
}

// Cập nhật danh sách firmware khi chọn board
async function updateFirmwareOptions() {
  const selectedBoard = boardSelect.value;
  if (!selectedBoard) return;

  loadingMessage.style.display = 'block';

  const manifests = await loadManifests();
  if (manifests && manifests[selectedBoard]) {
    const firmwareList = manifests[selectedBoard];
    console.log('Danh sách firmware cho board này:', firmwareList);

    firmwareSelect.innerHTML = '<option value="">Chọn firmware...</option>';
    firmwareList.forEach(firmware => {
      const option = document.createElement('option');
      option.value = firmware.path;
      option.textContent = firmware.label;
      firmwareSelect.appendChild(option);
    });
  } else {
    alert("Không tìm thấy firmware cho board này!");
  }

  loadingMessage.style.display = 'none';
}

// Khi chọn một firmware, cập nhật manifest URL vào nút esp-web-install-button
firmwareSelect.addEventListener('change', () => {
  const selectedPath = firmwareSelect.value;
  if (!selectedPath) {
    installButton.removeAttribute('manifest');
  } else {
    // Gán đường dẫn manifest tương ứng
    installButton.setAttribute('manifest', selectedPath);
    console.log("Đã gán manifest cho install button:", selectedPath);
  }
});

// Khởi tạo ban đầu
updateFirmwareOptions();