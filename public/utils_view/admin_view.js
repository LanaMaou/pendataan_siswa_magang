//  Konfigurasi DataTables
$(() => {
  $("#dataTables")
    .DataTable({
      responsive: true,
      lengthChange: true,
      autoWidth: false,
    })
    .buttons()
    .container()
    .appendTo("#example1_wrapper .col-md-6:eq(0)");
});

// Konfigurasi Toastr & SweetAlert
toastr.options = {
  positionClass: "toast-top-center",
  closeButton: true,
  newestOnTop: true,
  showDuration: "100",
  hideDuration: "100",
  timeOut: "1000",
};
$(document).ready(() => {
  let msgBerhasil = document
    .getElementById("pesan-peringatan")
    .getAttribute("data-berhasil");
  let nama;
  let msgGagal = document
    .getElementById("pesan-peringatan")
    .getAttribute("data-gagal");

  if (msgBerhasil.length !== 0) {
    toastr.success(msgBerhasil, "Berhasil");
  } else if (msgGagal.length !== 0) {
    toastr.error(msgGagal, "Gagal");
  }

  $(".hapus_form").submit(function (event) {
    event.preventDefault();
    nama = $(this).find("input[name='nama']").val();
    Swal.fire({
      title: "Apakah anda yakin ingin menghapusnya?",
      text: `Kamu Akan Menghapus Data '${nama}'`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        $(this).unbind("submit").submit();
      }
    });
  });
});

// Function data siswa
function tampilkanDataSiswa() {
  let select = document.getElementById("select_akun_tambah");
  let input_nama = document.getElementById("nama_siswa_tambah");
  let input_nohp = document.getElementById("nohp_siswa_tambah");
  let selectedOption = select.options[select.selectedIndex];

  if (selectedOption.value !== "") {
    let nama = selectedOption.getAttribute("data-nama");
    let nohp = selectedOption.getAttribute("data-nohp");
    input_nama.value = nama;
    input_nohp.value = nohp;
  } else {
    input_nama.value = "";
    input_nohp.value = "";
  }
}

function tampilkanDataSiswaEdit() {
  const selectElements = document.querySelectorAll(".select_akun_edit");

  selectElements.forEach((select) => {
    const selectedOption = select.options[select.selectedIndex];
    const modal = select.closest(".modal-edit");

    if (modal) {
      const inputNama = modal.querySelector(".nama_siswa_edit");
      const inputNohp = modal.querySelector(".nohp_siswa_edit");

      if (selectedOption.value !== "") {
        let nama = selectedOption.getAttribute("data-nama");
        let nohp = selectedOption.getAttribute("data-nohp");
        inputNama.value = nama;
        inputNohp.value = nohp;
      } else {
        inputNama.value = "";
        inputNohp.value = "";
      }
    }
  });
}

// Function data laporan
function tampilkanDataSiswaLaporan() {
  let select = document.getElementById("select_nama_tambah");
  let input_nis = document.getElementById("nis_siswa_tambah");
  let input_nohp = document.getElementById("nohp_siswa_tambah");
  let input_nama_sekolah = document.getElementById("nama_sekolah_tambah");
  let input_id_login = document.getElementById("id_login_tambah");
  let selectedOption = select.options[select.selectedIndex];

  if (selectedOption.value !== "") {
    let nis = selectedOption.getAttribute("data-nis_siswa");
    let nohp = selectedOption.getAttribute("data-nohp_siswa");
    let asal_sekolah = selectedOption.getAttribute("data-asal_sekolah");
    let id_login = selectedOption.getAttribute("data-id_login");
    input_nis.value = nis;
    input_nohp.value = nohp;
    input_nama_sekolah.value = asal_sekolah;
    input_id_login.value = id_login;
  } else {
    input_nis.value = "";
    input_nohp.value = "";
    input_nama_sekolah.value = "";
  }
}

function tampilkanDataSiswaLaporanEdit() {
  const selectElements = document.querySelectorAll(".select_nama_edit");

  selectElements.forEach((select) => {
    const selectedOption = select.options[select.selectedIndex];
    const modal = select.closest(".modal-edit");

    if (modal) {
      const inputNis = modal.querySelector(".nis_siswa_edit");
      const inputNohp = modal.querySelector(".nohp_siswa_edit");
      const inputSekolah = modal.querySelector(".nama_sekolah_edit");
      const inputLogin = modal.querySelector(".id_login");

      if (selectedOption.value !== "") {
        let nis = selectedOption.getAttribute("data-nis_siswa");
        let nohp = selectedOption.getAttribute("data-nohp_siswa");
        let asal_sekolah =
          selectedOption.getAttribute("data-asal_sekolah");
        let id_login = selectedOption.getAttribute("data-id_login");
        inputNis.value = nis;
        inputNohp.value = nohp;
        inputSekolah.value = asal_sekolah;
        inputLogin.value = id_login;
      } else {
        inputNis.value = "";
        inputNohp.value = "";
        inputSekolah.value = "";
        inputLogin.value = "";
      }
    }
  });
}

function resetInputFileEdit() {
  const btnReset = document.querySelectorAll(".btn-reset-edit");

  btnReset.forEach((button) => {
    const buttonReset = button.closest(".modal-edit");
    const inputFile = buttonReset.querySelector(".input-file-edit");
    const labelFile = buttonReset.querySelector(".label-file-edit");

    inputFile.value = "";
    labelFile.innerHTML = "Masukan Laporan";
  });
}

// Function penilaian
const inputNilais = document.querySelectorAll(".input-penilaian");

      inputNilais.forEach((input) => {
        input.addEventListener("input", function () {
          const inputValue = this.value;

          const modal = this.closest(".modal-nilai");

          if (modal) {
            const inputGrade = modal.querySelector(".input-grade");

            if (inputValue > 0 && inputValue <= 65) {
              inputGrade.value = "D";
            } else if (inputValue > 65 && inputValue <= 75) {
              inputGrade.value = "C";
            } else if (inputValue > 75 && inputValue <= 85) {
              inputGrade.value = "B";
            } else if (inputValue > 85 && inputValue <= 100) {
              inputGrade.value = "A";
            } else if (inputValue > 100) {
              input.value = 100;
              inputGrade.value = "A";
            } else {
              inputGrade.value = "Tolong masukan nilai";
            }
          }
        });
      });