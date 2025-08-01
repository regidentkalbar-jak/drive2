// --- DATA ---
let berkas = JSON.parse(localStorage.getItem("berkas")) || [];
const tbody = document.querySelector("#tabelBerkas tbody");
const rekapMinggu = document.getElementById("rekapMinggu");
const rekapSelesai = document.getElementById("rekapSelesai");
let chart;

// Input elements
const nrkbInput = document.getElementById("nrkb");
const jumlahPkbInput = document.getElementById("jumlahPkb");

// Validasi NRKB hanya huruf dan angka
nrkbInput.addEventListener("input", function () {
  this.value = this.value.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase();
});

// Format PKB ribuan
jumlahPkbInput.addEventListener("input", function () {
  let value = this.value.replace(/\D/g, "");
  this.value = value ? new Intl.NumberFormat("id-ID").format(value) : "";
});

document.getElementById("berkasForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const jumlahPkbNumeric = jumlahPkbInput.value.replace(/\./g, "").replace(/,/g, "");
  const data = {
    tanggalMasuk: tanggalMasuk.value,
    nrkb: nrkbInput.value,
    namaPemilik: namaPemilik.value,
    nomorRangka: nomorRangka.value,
    noBpkb: noBpkb.value,
    tanggalJatuhTempo: tanggalJatuhTempo.value,
    jumlahPkb: jumlahPkbNumeric,
    proses: proses.value,
    checklist: defaultChecklist(proses.value),
    pengingat: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  berkas.push(data);
  saveData();
  this.reset();
});

function defaultChecklist(proses) {
  if (proses === "Perpanjangan STNK") return { stnk: false, tnkb: false };
  if (proses === "Mutasi Keluar") return { selesai: false };
  return { stnk: false, tnkb: false, bpkb: false };
}

function saveData() {
  localStorage.setItem("berkas", JSON.stringify(berkas));
  renderTable();
  renderRekap();
}

function toggleChecklist(i, key) {
  berkas[i].checklist[key] = !berkas[i].checklist[key];
  saveData();
}

function hapusData(i) {
  if (confirm("Yakin ingin menghapus catatan ini?")) {
    berkas.splice(i, 1);
    saveData();
  }
}

function renderTable() {
  tbody.innerHTML = "";
  if (berkas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13">Belum ada catatan</td></tr>`;
    return;
  }
  berkas.forEach((b, i) => {
    const checklistHTML = Object.keys(b.checklist).map(
      (k) => `<input type="checkbox" class="form-check-input me-1" ${b.checklist[k] ? "checked" : ""} onchange="toggleChecklist(${i}, '${k}')"> ${k.toUpperCase()}`
    ).join("<br>");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${b.tanggalMasuk}</td>
      <td>${b.nrkb}</td>
      <td>${b.namaPemilik}</td>
      <td>${b.noBpkb}</td>
      <td>${b.nomorRangka}</td>
      <td>${b.proses}</td>
      <td>${b.tanggalJatuhTempo}</td>
      <td>Rp ${Number(b.jumlahPkb).toLocaleString()}</td>
      <td>${checklistHTML}</td>
      <td><button class="btn btn-sm btn-danger" onclick="hapusData(${i})"><i class="fas fa-trash"></i></button></td>`;
    tbody.appendChild(tr);
  });
}

function renderRekap() {
  const mingguIni = berkas.filter((b) =>
    new Date(b.tanggalMasuk) >= new Date(new Date().setDate(new Date().getDate() - 7))
  ).length;
  const selesai = berkas.filter((b) => Object.values(b.checklist).every((v) => v)).length;
  rekapMinggu.innerText = mingguIni;
  rekapSelesai.innerText = selesai;
  const prosesCount = {};
  berkas.forEach((b) => { prosesCount[b.proses] = (prosesCount[b.proses] || 0) + 1; });
  drawChart(prosesCount);
}

function drawChart(prosesCount) {
  const ctx = document.getElementById("chartProses").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: { labels: Object.keys(prosesCount), datasets: [{ data: Object.values(prosesCount), backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"] }] }
  });
}

function showBelumSelesai() {
  const belum = berkas.filter((b) => !Object.values(b.checklist).every((v) => v));
  alert(belum.length === 0 ? "Semua berkas sudah selesai." : "Berkas Belum Selesai:\n" + belum.map((b) => `${b.nrkb} - ${b.proses}`).join("\n"));
}

function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(berkas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Berkas");
  XLSX.writeFile(wb, "berkas.xlsx");
}

setInterval(() => {
  berkas.forEach((b) => {
    if (Date.now() > b.pengingat && !Object.values(b.checklist).every((v) => v)) {
      notify(`Pengingat: Berkas ${b.nrkb} belum selesai!`);
      b.pengingat = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
  });
  saveData();
}, 60000);

function notify(msg) {
  if (Notification.permission === "granted") new Notification(msg);
  else if (Notification.permission !== "denied") Notification.requestPermission().then((perm) => { if (perm === "granted") new Notification(msg); });
}

// Backup & Restore
function backupData() {
  const blob = new Blob([JSON.stringify(berkas)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup_berkas.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        berkas = data;
        saveData();
        alert("Data berhasil diimpor!");
      } else {
        alert("Format file tidak sesuai!");
      }
    } catch (error) {
      alert("Gagal membaca file!");
    }
  };
  reader.readAsText(file);
}

renderTable();
renderRekap();
