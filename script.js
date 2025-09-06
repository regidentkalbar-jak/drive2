let berkas = JSON.parse(localStorage.getItem("berkas")) || [];
let pengurusData = JSON.parse(localStorage.getItem("pengurusData")) || [];

const tbody = document.querySelector("#tabelBerkas tbody");
const tbodyPengurus = document.querySelector("#tabelPengurus tbody");
const rekapMinggu = document.getElementById("rekapMinggu");
const rekapSelesai = document.getElementById("rekapSelesai");
const pengurusSelect = document.getElementById("pengurus");
let chart;

// ======== FORMAT TANGGAL (DD-MM-YYYY) ========
function formatTanggal(tgl) {
  if (!tgl) return "";
  const d = new Date(tgl);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// ======== FORMAT RUPIAH ========
function formatRupiah(angka) {
  return angka.replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ======== FORM ENTRI BERKAS ========
document.getElementById("jumlahPkb").addEventListener("input", function () {
  this.value = formatRupiah(this.value);
});

document.getElementById("pengurus").addEventListener("change", function () {
  const selected = pengurusData.find(p => p.nama === this.value);
  document.getElementById("noTelp").value = selected ? selected.telp : "";
});

document.getElementById("berkasForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const data = {
    tanggalMasuk: tanggalMasuk.value,
    nrkb: nrkb.value,
    namaPemilik: namaPemilik.value,
    nomorRangka: nomorRangka.value,
    noBpkb: noBpkb.value,
    tanggalJatuhTempo: tanggalJatuhTempo.value,
    jumlahPkb: jumlahPkb.value,
    pengurus: pengurus.value,
    noTelp: noTelp.value,
    catatan: catatan.value,
    proses: proses.value,
    checklist: defaultChecklist(proses.value),
    pengingat: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  berkas.push(data);
  saveData();
  this.reset();
});

// ======== DEFAULT CHECKLIST ========
function defaultChecklist(proses) {
  if (proses === "Perpanjangan STNK") return { stnk: false, tnkb: false };
  if (proses === "Mutasi Keluar") return { selesai: false };
  return { stnk: false, tnkb: false, bpkb: false };
}

// ======== SIMPAN DATA ========
function saveData() {
  localStorage.setItem("berkas", JSON.stringify(berkas));
  localStorage.setItem("pengurusData", JSON.stringify(pengurusData));
  renderTable();
  renderPengurus();
  renderRekap();
}

// ======== HAPUS DATA ========
function hapusData(i) {
  if (confirm("Yakin ingin menghapus catatan ini?")) {
    berkas.splice(i, 1);
    saveData();
  }
}
function hapusPengurus(i) {
  if (confirm("Hapus pengurus ini?")) {
    pengurusData.splice(i, 1);
    saveData();
    updatePengurusSelect();
  }
}

// ======== RENDER TABEL BERKAS ========
function renderTable() {
  tbody.innerHTML = "";
  if (berkas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14">Belum ada catatan</td></tr>`;
    return;
  }
  berkas.forEach((b, i) => {
    const checklistHTML = Object.keys(b.checklist)
      .map(
        (k) =>
          `<input type="checkbox" class="form-check-input me-1" ${
            b.checklist[k] ? "checked" : ""
          } onchange="toggleChecklist(${i}, '${k}')"> ${k.toUpperCase()}`
      )
      .join("<br>");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${formatTanggal(b.tanggalMasuk)}</td>
      <td>${b.nrkb}</td>
      <td>${b.namaPemilik}</td>
      <td>${b.noBpkb}</td>
      <td>${b.nomorRangka}</td>
      <td>${b.pengurus}</td>
      <td>${b.noTelp}</td>
      <td>${b.proses}</td>
      <td>${formatTanggal(b.tanggalJatuhTempo)}</td>
      <td>Rp ${b.jumlahPkb}</td>
      <td>${b.catatan || "-"}</td>
      <td>${checklistHTML}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="hapusData(${i})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== RENDER DATA MASTER ========
document.getElementById("pengurusForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const data = {
    nama: namaPengurus.value,
    telp: telpPengurus.value
  };
  pengurusData.push(data);
  saveData();
  this.reset();
  updatePengurusSelect();
});

function renderPengurus() {
  tbodyPengurus.innerHTML = "";
  if (pengurusData.length === 0) {
    tbodyPengurus.innerHTML = `<tr><td colspan="4">Belum ada data</td></tr>`;
    return;
  }
  pengurusData.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.nama}</td>
      <td>${p.telp}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusPengurus(${i})"><i class="fas fa-trash"></i></button></td>
    `;
    tbodyPengurus.appendChild(tr);
  });
}
function updatePengurusSelect() {
  pengurusSelect.innerHTML = `<option value="">-- Pilih Pengurus --</option>`;
  pengurusData.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.nama;
    opt.textContent = p.nama;
    pengurusSelect.appendChild(opt);
  });
}

// ======== CHECKLIST ========
function toggleChecklist(i, key) {
  berkas[i].checklist[key] = !berkas[i].checklist[key];
  saveData();
}

// ======== REKAP ========
function renderRekap() {
  const mingguIni = berkas.filter(
    (b) =>
      new Date(b.tanggalMasuk) >=
      new Date(new Date().setDate(new Date().getDate() - 7))
  ).length;
  const selesai = berkas.filter((b) =>
    Object.values(b.checklist).every((v) => v)
  ).length;

  rekapMinggu.innerText = mingguIni;
  rekapSelesai.innerText = selesai;

  const prosesCount = {};
  berkas.forEach((b) => {
    prosesCount[b.proses] = (prosesCount[b.proses] || 0) + 1;
  });
  drawChart(prosesCount);
}

function drawChart(prosesCount) {
  const ctx = document.getElementById("chartProses").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(prosesCount),
      datasets: [{ data: Object.values(prosesCount) }]
    }
  });
}

// ======== EXPORT EXCEL ========
function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(berkas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Berkas");
  XLSX.writeFile(wb, "berkas.xlsx");
}

// ======== BELUM SELESAI ========
function show
