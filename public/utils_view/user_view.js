// Konfigurasi datatables
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

// Konfigurasi Toastr & Sweet Alert
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
  let blocked = document
    .getElementById("pesan-peringatan")
    .getAttribute("data-blocked");

  if (msgBerhasil.length !== 0) {
    toastr.success(msgBerhasil, "Berhasil");
  } else if (msgGagal.length !== 0) {
    toastr.error(msgGagal, "Gagal");
  }

  if (blocked !== "") {
    Swal.fire({
      title: "Berhenti!, kamu belum mengisi biodata",
      text: "Silahkan isi biodata terlebih dahulu di halaman biodata!",
      icon: "warning",
      confirmButtonText: "OK",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/siswa_user";
      }
    });
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
