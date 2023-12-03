// Fungsi Ketikan
const text = ["Di Aplikasi Pendataan Siswa Magang"];
let textIndex = 0;
let charIndex = 0;
const speed = 100;

const typeText = () => {
  if (textIndex < text.length) {
    const ketikText = text[textIndex];
    if (charIndex < ketikText.length) {
      document.querySelector(".ketikan").innerHTML +=
        ketikText.charAt(charIndex);
      charIndex++;
      setTimeout(typeText, speed);
    } else {
      setTimeout(eraseText, 1000);
    }
  } else {
    textIndex = 0;
    setTimeout(typeText, speed);
  }
};

const eraseText = () => {
  const ketikText = text[textIndex];
  if (charIndex >= 0) {
    const typedTextElement = document.querySelector(".ketikan");
    typedTextElement.innerHTML = ketikText.substring(0, charIndex);
    charIndex--;
    setTimeout(eraseText, speed);
  } else {
    textIndex++;
    setTimeout(typeText, 500);
  }
};

window.onload = () => {
  typeText();
};
// Akhir fungsi ketikkan

window.addEventListener("click", (pencet) => {
  // Mengecek apakah elemen yang diklik memiliki class "terkecuali" atau berada di dalamnya
  const alert = document.querySelectorAll(".alert-manual");
  let targetElement = pencet.target;
  let isTerkecuali = false;

  // Periksa apakah elemen yang diklik memiliki class "terkecuali"
  if (targetElement.classList.contains("terkecuali")) {
    isTerkecuali = true;
  } else {
    // Periksa apakah elemen yang diklik adalah anak dari elemen dengan class "terkecuali"
    let parentElement = targetElement.parentElement;
    while (parentElement) {
      if (parentElement.classList.contains("terkecuali")) {
        isTerkecuali = true;
        break;
      }
      parentElement = parentElement.parentElement;
    }
  }

  // Jika elemen yang diklik bukan elemen dengan class "terkecuali" atau tidak berada di dalamnya
  if (!isTerkecuali) {
    // Jalankan fungsi yang diinginkan di sini
    alert.forEach((a) => {
      a.classList.add("hidden");
    });
    if (!page_masuk.classList.contains("translate-x-[100vw]")) {
      page_masuk.classList.add("translate-x-[100vw]");
      setTimeout(() => {
        page_masuk.classList.remove("flex");
        page_masuk.classList.add("hidden");
      }, 100);
    }
    if (!page_daftar.classList.contains("translate-x-[100vw]")) {
      page_daftar.classList.add("translate-x-[100vw]");
      setTimeout(() => {
        page_daftar.classList.remove("flex");
        page_daftar.classList.add("hidden");
      }, 100);
    }

    if (ilustrasi.classList.contains("opacity-0")) {
      ilustrasi.classList.remove("opacity-0");
    }

    opsiMasuk = "tidak aktif";
    opsiDaftar = "tidak aktif";
  }
});

// Fungsi Masuk Daftar
const tombol_daftar = document.querySelectorAll(".tombol-daftar");
const tombol_masuk = document.querySelectorAll(".tombol-masuk");

const page_daftar = document.querySelector(".page-daftar");
const page_masuk = document.querySelector(".page-masuk");

const prev_daftar = document.querySelector(".prev-daftar");
const prev_masuk = document.querySelector(".prev-masuk");

const ilustrasi = document.querySelector(".ilustrasi");

let opsiMasuk = "tidak aktif";
let opsiDaftar = "tidak aktif";

tombol_daftar.forEach((tbl_daftar) => {
  tbl_daftar.addEventListener("click", () => {
    if (opsiDaftar === "tidak aktif" && opsiMasuk === "tidak aktif") {
      page_daftar.classList.remove("hidden");
      page_daftar.classList.add("flex");
      setTimeout(() => {
        page_daftar.classList.remove("translate-x-[100vw]");
        ilustrasi.classList.toggle("opacity-0");
      }, 100);

      opsiDaftar = "aktif";
    } else if (opsiDaftar === "tidak aktif" && opsiMasuk === "aktif") {
      page_masuk.classList.add("translate-x-[100vw]");
      page_daftar.classList.remove("hidden");
      page_daftar.classList.add("flex");
      setTimeout(() => {
        page_masuk.classList.remove("flex");
        page_masuk.classList.add("hidden");
        page_daftar.classList.remove("translate-x-[100vw]");
      }, 100);

      opsiDaftar = "aktif";
      opsiMasuk = "tidak aktif";
    }
  });
});

tombol_masuk.forEach((tbl_masuk) => {
  tbl_masuk.addEventListener("click", () => {
    if (opsiMasuk === "tidak aktif" && opsiDaftar === "tidak aktif") {
      page_masuk.classList.remove("hidden");
      page_masuk.classList.add("flex");
      setTimeout(() => {
        page_masuk.classList.remove("translate-x-[100vw]");
        ilustrasi.classList.toggle("opacity-0");
      }, 100);

      opsiMasuk = "aktif";
    } else if (opsiMasuk === "tidak aktif" && opsiDaftar === "aktif") {
      page_daftar.classList.add("translate-x-[100vw]");
      page_masuk.classList.remove("hidden");
      page_masuk.classList.add("flex");
      setTimeout(() => {
        page_daftar.classList.remove("flex");
        page_daftar.classList.add("hidden");
        page_masuk.classList.remove("translate-x-[100vw]");
      }, 100);

      opsiMasuk = "aktif";
      opsiDaftar = "tidak aktif";
    }
  });
});

prev_daftar.addEventListener("click", () => {
  page_daftar.classList.add("translate-x-[100vw]");
  setTimeout(() => {
    page_daftar.classList.add("hidden");
    page_daftar.classList.remove("flex");
  }, 100);
  ilustrasi.classList.toggle("opacity-0");

  opsiDaftar = "tidak aktif";
});
prev_masuk.addEventListener("click", () => {
  page_masuk.classList.add("translate-x-[100vw]");
  setTimeout(() => {
    page_masuk.classList.add("hidden");
    page_masuk.classList.remove("flex");
  }, 100);
  ilustrasi.classList.toggle("opacity-0");

  opsiMasuk = "tidak aktif";
});
// Akhir Fungsi Masuk Daftar
