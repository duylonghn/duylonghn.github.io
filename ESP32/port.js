document.addEventListener('DOMContentLoaded', () => {
  const firmwareTableBody = document.querySelector('#firmwareTable tbody');
  const successMessage = document.getElementById('successMessage');

  // Fetch danh sách firmware từ firmware-list.json
  fetch('firmware.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        data.forEach(item => {
          const row = document.createElement('tr');

          const nameCell = document.createElement('td');
          nameCell.textContent = item.name;

          const noteCell = document.createElement('td');
          noteCell.textContent = item.note || '';  // Lấy ghi chú từ firmware-list.json

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
          row.appendChild(noteCell);  // Hiển thị ghi chú trong cột Thông tin
          row.appendChild(buttonCell);

          firmwareTableBody.appendChild(row);
        });
      } else {
        console.error('Dữ liệu firmware.json không hợp lệ.');
      }
    })
    .catch(err => {
      console.error('Không thể tải firmware-list.json:', err);
    });
});