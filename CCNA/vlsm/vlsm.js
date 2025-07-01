function ipToBinary(ip) {
  return ip.split('.').map(part => parseInt(part).toString(2).padStart(8, '0')).join('.');
}

function binaryToIp(bin) {
  return bin.split('.').map(part => parseInt(part, 2)).join('.');
}

function calculateMaskBits(hosts) {
  let bits = 0;
  while ((2 ** bits - 2) < hosts) bits++;
  return 32 - bits;
}

function maskBitsToMask(bits) {
  let mask = [];
  for (let i = 0; i < 4; i++) {
    let part = Math.min(8, bits);
    mask.push(256 - (1 << (8 - part)));
    bits -= part;
  }
  return mask.join('.');
}

function ipToDecimal(ip) {
  const parts = ip.split('.').map(Number);
  return (parts[0]<<24) | (parts[1]<<16) | (parts[2]<<8) | parts[3];
}

function decimalToIp(decimal) {
  return [
    (decimal >>> 24) & 255,
    (decimal >>> 16) & 255,
    (decimal >>> 8) & 255,
    decimal & 255
  ].join('.');
}

function formatBinary(ipDecimal, baseMask, newMask, isPrimary) {
  const bin = ipToBinary(decimalToIp(ipDecimal)).replace(/\./g, '');
  let result = '';
  let group = [];

  for (let i = 0; i < 32; i++) {
    if (i === baseMask || i === newMask) group.push('||');

    const bit = bin[i];
    if (i >= baseMask && i < newMask) {
      group.push(`<span style="color: ${isPrimary ? 'red' : 'blue'}">${bit}</span>`);
    } else {
      group.push(bit);
    }

    if ((i + 1) % 8 === 0 && i !== 31) {
      group.push('.');
    }
  }

  result = group.join('');
  return result;
}

function generateSubnets() {
  const cidrInput = document.getElementById("base-ip").value.trim();
  const hostInput = document.getElementById("host-list").value.trim();
  const hosts = hostInput.split(',').map(h => parseInt(h.trim())).filter(n => !isNaN(n));

  if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidrInput)) {
    alert("Vui lòng nhập IP gốc theo định dạng CIDR (VD: 192.168.0.0/24)");
    return;
  }

  const [baseIp, baseMaskBitsStr] = cidrInput.split('/');
  const baseMaskBits = parseInt(baseMaskBitsStr);
  const baseDecimal = ipToDecimal(baseIp);
  const maxHosts = 2 ** (32 - baseMaskBits);
  const endLimit = baseDecimal + maxHosts;

  let result = '';
  result += `<h3>Bước 1: Xác định mạng con phù hợp</h3>`;
  result += `<table border="1" cellpadding="6" style="border-collapse: collapse; margin-bottom: 20px;">
    <tr><th>Yêu cầu (host)</th><th>Giải pháp (CIDR)</th></tr>`;

  const subnets = [];
  hosts.sort((a, b) => b - a);

  hosts.forEach(requiredHosts => {
    const maskBits = 32 - Math.ceil(Math.log2(requiredHosts + 2));
    const usable = 2 ** (32 - maskBits) - 2;
    subnets.push({ requiredHosts, maskBits, usable });
    result += `<tr><td>${requiredHosts}</td><td>/${maskBits} = ${usable}</td></tr>`;
  });

  result += `</table>`;

  // Bước 2: Phân chia nhị phân
  result += `<h3>Bước 2: Phân chia mạng con theo nhị phân</h3>`;
  result += `<div style="margin-bottom: 10px;">CIDR gốc: ${baseIp}/${baseMaskBits}</div>`;

  let currentBase = baseDecimal;
  let currentBaseMask = baseMaskBits;

  for (let i = 0; i < subnets.length; i++) {
    const subnet = subnets[i];
    const newMask = subnet.maskBits;
    const subnetCount = 2 ** (newMask - currentBaseMask);

    result += `<div style="margin-bottom: 10px;"><strong>Mạng ${decimalToIp(currentBase)}/${currentBaseMask} → /${newMask}</strong></div>`;

    for (let j = 0; j < subnetCount; j++) {
      const netDec = currentBase + j * 2 ** (32 - newMask);
      const binDisplay = formatBinary(netDec, currentBaseMask, newMask, j === 0);
      const label = j === 0 ? ` (LAN ${i + 1})` : '';
      result += `<div style="margin-left: 20px;">${binDisplay} → ${decimalToIp(netDec)}/${newMask}${label}</div>`;

      if (j === 0) {
        subnet.network = decimalToIp(netDec);
        subnet.broadcast = decimalToIp(netDec + 2 ** (32 - newMask) - 1);
        subnet.firstHost = decimalToIp(netDec + 1);
        subnet.lastHost = decimalToIp(netDec + 2 ** (32 - newMask) - 2);
        subnet.mask = maskBitsToMask(newMask);
      }
    }

    currentBase += 2 ** (32 - newMask);
    currentBaseMask = newMask;
  }

  // Bước 3: Tổng hợp
  result += `<h3>Bước 3: Tổng hợp kết quả</h3>`;
  subnets.forEach((s, i) => {
    result += `
      <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
        <strong>LAN ${i + 1}</strong><br>
        Yêu cầu: ${s.requiredHosts} host → Giải pháp: /${s.maskBits} = ${s.usable} usable<br>
        Mạng: ${s.network} /${s.maskBits}<br>
        Subnet mask: ${s.mask}<br>
        Dải usable IP: ${s.firstHost} - ${s.lastHost}<br>
        Broadcast: ${s.broadcast}<br>
      </div>
    `;
  });

  document.getElementById("ip-result").innerHTML = result;
}

// Chuyển IP sang nhị phân
function convertToBinary() {
  const ip = document.getElementById("ip-to-bin").value.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    alert("IP không hợp lệ");
    return;
  }
  const binary = ip.split('.')
    .map(octet => parseInt(octet).toString(2).padStart(8, '0'))
    .join('.');
  const resultDiv = document.getElementById("bin-result");
  resultDiv.textContent = binary;
  resultDiv.style.display = "block";
}

// Chuyển nhị phân sang IP
function convertToDecimal() {
  const bin = document.getElementById("bin-to-ip").value.trim();
  if (!/^([01]{8}\.){3}[01]{8}$/.test(bin)) {
    alert("Định dạng nhị phân không hợp lệ");
    return;
  }
  const decimal = bin.split('.')
    .map(b => parseInt(b, 2))
    .join('.');
  const resultDiv = document.getElementById("ip-result-dec");
  resultDiv.textContent = decimal;
  resultDiv.style.display = "block";
}
