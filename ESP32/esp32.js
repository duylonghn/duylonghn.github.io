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
let port;
let reader;
let writer; // <-- thêm biến writer
let keepReading = false;

const connectButton = document.getElementById('connectSerialBtn');
const disconnectButton = document.getElementById('disconnectSerialBtn');
const serialOutput = document.getElementById('serialOutput');
const serialInput = document.getElementById('serialInput');
const sendButton = document.getElementById('sendSerialBtn');

connectButton.addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    // Tạo encoder và writer một lần sau khi kết nối
    const textEncoder = new TextEncoderStream();
    textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    connectButton.disabled = true;
    disconnectButton.disabled = false;
    sendButton.disabled = false;

    keepReading = true;
    readSerialLoop();
  } catch (err) {
    console.error('Lỗi khi mở cổng serial:', err);
  }
});

disconnectButton.addEventListener('click', async () => {
  keepReading = false;
  disconnectButton.disabled = true;
  connectButton.disabled = false;
  sendButton.disabled = true;

  if (reader) {
    try {
      await reader.cancel();
    } catch (e) {}
  }

  if (writer) {
    try {
      writer.releaseLock();
    } catch (e) {}
  }

  if (port) {
    try {
      await port.close();
    } catch (e) {}
  }

  serialOutput.textContent += "\n🔌 Ngắt kết nối.\n";
});

async function readSerialLoop() {
  while (port.readable && keepReading) {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    try {
      while (keepReading) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          serialOutput.textContent += value;
          serialOutput.scrollTop = serialOutput.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu serial:', error);
    } finally {
      reader.releaseLock();
    }
  }
}

sendButton.addEventListener('click', async () => {
  const command = serialInput.value;
  if (command && writer) {
    try {
      await writer.write(command + '\n');
      serialInput.value = '';
    } catch (error) {
      console.error('Lỗi khi gửi command:', error);
    }
  }
});

// Gửi bằng phím Enter
serialInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});
