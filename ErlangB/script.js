// Hàm Erlang B dùng đệ quy tích lũy (chính xác và tối ưu)
function erlangB(N, A) {
    let B = 1.0;
    for (let i = 1; i <= N; i++) {
      B = (A * B) / (i + A * B);
    }
    return B;
  }

  // Tìm A từ N và GOS bằng tìm kiếm nhị phân
  function findA(N, targetB) {
    let low = 0, high = N * 10, mid, B;
    let precision = 0.00001;
    let maxIter = 100;
    let iter = 0;
    while (high - low > precision && iter < maxIter) {
      mid = (low + high) / 2;
      B = erlangB(N, mid);
      if (B > targetB) high = mid;
      else low = mid;
      iter++;
    }
    return mid;
  }

  // Tìm N từ A và GOS bằng duyệt tuyến tính
  function findN(A, targetB) {
    for (let N = 1; N <= 10000; N++) {
      let B = erlangB(N, A);
      if (B <= targetB) return N;
    }
    return null;
  }

  function compute() {
    const N = parseInt(document.getElementById("channels").value);
    const A = parseFloat(document.getElementById("erlang").value);
    const B = parseFloat(document.getElementById("gos").value);

    const hasN = !isNaN(N);
    const hasA = !isNaN(A);
    const hasB = !isNaN(B);
    const resultDiv = document.getElementById("result");

    if ([hasN, hasA, hasB].filter(x => x).length < 2) {
      resultDiv.innerText = "Vui lòng nhập ít nhất 2 trên 3 giá trị.";
      return;
    }

    if (hasB && (B < 0 || B > 1)) {
      resultDiv.innerText = "GOS phải nằm trong khoảng từ 0 đến 1.";
      return;
    }

    if (hasN && N <= 0) {
      resultDiv.innerText = "Số mạch phải là số nguyên dương.";
      return;
    }

    if (hasA && A < 0) {
      resultDiv.innerText = "Lưu lượng Erlang không thể âm.";
      return;
    }

    if (hasN && hasA && !hasB) {
      const resultB = erlangB(N, A);
      resultDiv.innerText = `Tỷ số suy hao B = ${resultB.toFixed(5)}`;
    } else if (hasN && hasB && !hasA) {
      const resultA = findA(N, B);
      resultDiv.innerText = `Lưu lượng Erlang A ≈ ${resultA.toFixed(4)}`;
    } else if (hasA && hasB && !hasN) {
      const resultN = findN(A, B);
      if (resultN)
        resultDiv.innerText = `Số mạch cần thiết ≈ ${resultN}`;
      else
        resultDiv.innerText = "Không tìm được số mạch phù hợp (vượt giới hạn).";
    } else {
      resultDiv.innerText = "Bạn đã nhập đủ 3 giá trị. Không cần tính.";
    }
  }