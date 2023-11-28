const express = require("express");
const fs = require("fs");
const expressLayouts = require("express-ejs-layouts");
const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const multer = require("multer");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const PDFDocument = require("pdfkit");
const PNG = require("png-js");

// Koneksi database
require("dotenv").config();
const db = require("./utils/db");

const app = express();
const port = process.env.PORT || 3000;

// Set-Up method override
app.use(methodOverride("_method"));

// Set-Up EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: {},
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(flash());

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "laporan/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Route Download
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "laporan", filename);
  res.download(filePath, filename);
});

// Halaman Home
app.get("/", (req, res) => {
  req.session.id_login = " ";
  req.session.login = false;
  res.render("index", {
    layout: false,
    masuk_dulu: req.flash("masuk_dulu"),
    keluar: req.flash("keluar"),
  });
});

//
// Masuk dan Daftar
app.post(
  "/daftar",
  [
    body("email").custom(async (value, { req }) => {
      const duplikat = await db("tb_login")
        .select("email")
        .where({ email: value })
        .first();
      if (duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("no_hp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");

      return res.status(401).json({ success: false, error: err });
    } else {
      const { nama, email, no_hp, password } = req.body;
      try {
        await db("tb_login").insert({
          nama,
          email,
          no_hp,
          password,
          status: "user",
        });
        res.json({ success: true });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
          message: "Terjadi kesalahan saat mencoba masuk",
        });
      }
    }
  },
);

app.post("/masuk", async (req, res) => {
  const { email, password } = req.body;
  try {
    const akun = await db("tb_login")
      .select("*")
      .where({ email, password })
      .first();
    if (akun) {
      req.session.id_login = akun.id_login;
      req.session.email = akun.email;
      req.session.password = akun.password;
      req.session.nama = akun.nama;
      req.session.no_hp = akun.no_hp;
      req.session.status = akun.status;
      req.session.login = true;

      req.flash("berhasil", `Selamat Datang, ${akun.nama}`);

      if (akun.status === "admin") {
        res.json({ success: true, redirectTo: "/admin" });
      } else if (akun.status === "user") {
        res.json({ success: true, redirectTo: "/user" });
      }
    } else {
      res.status(401).json({ success: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mencoba masuk",
    });
  }
});

app.get("/keluar", (req, res) => {
  req.session.id_login = "";
  req.session.email = "";
  req.session.password = "";
  req.session.nama = "";
  req.session.no_hp = "";
  req.session.status = "";
  req.session.login = false;

  req.flash("keluar", "Anda Telah Keluar!");
  res.redirect("/");
});

app.put(
  "/ubah-akun",
  [
    body("email").custom(async (value, { req }) => {
      const oldEmail = req.body.oldEmail;
      const duplikat = await db("tb_login")
        .select("email")
        .where({ email: value })
        .first();
      if (value !== oldEmail && duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
  ],
  async (req, res) => {
    const redirect = req.body.redirect;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/" + redirect);
    } else {
      const { id_login, email, password } = req.body;
      try {
        await db("tb_login").where({ id_login }).update({
          email,
          password,
        });
        req.session.email = email;
        req.session.password = password;
        req.flash("berhasil", "Data Akun Berhasil Diubah!");
        res.redirect("/" + redirect);
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/" + redirect);
      }
    }
  },
);

//
// Halaman Admin
app.get("/admin", async (req, res) => {
  if (req.session.login) {
    const data_akun = await db("tb_login").select("*");
    const pembimbing = await db("data_pembimbing").count("* as total").first();
    const ruangan = await db("data_ruangan").count("* as total").first();
    const sekolah = await db("data_sekolah").count("* as total").first();
    const siswa = await db("data_siswa").count("* as total").first();
    res.render("dashboard_admin", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      total_pembimbing: pembimbing.total,
      total_ruangan: ruangan.total,
      total_sekolah: sekolah.total,
      total_siswa: siswa.total,
      data_akun,
      halaman: "Dashboard",
      activePage: "admin",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/akun",
  [
    body("email").custom(async (value) => {
      const duplikat = await db("tb_login")
        .select("email")
        .where({ email: value })
        .first();
      if (duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("no_hp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/admin");
    } else {
      const { nama, email, no_hp, password, status } = req.body;
      try {
        await db("tb_login").insert({
          nama,
          email,
          no_hp,
          password,
          status,
        });
        req.flash("berhasil", "Data Akun Berhasil Ditambahkan!");
        res.redirect("/admin");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/admin");
      }
    }
  },
);

app.put(
  "/akun",
  [
    body("email").custom(async (value, { req }) => {
      const oldEmail = req.body.oldEmail;
      const duplikat = await db("tb_login")
        .select("email")
        .where({ email: value })
        .first();
      if (value !== oldEmail && duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("no_hp", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/admin");
    } else {
      const { id_login, nama, email, no_hp, password, status } = req.body;
      try {
        await db("tb_login").where({ id_login }).update({
          nama,
          email,
          no_hp,
          password,
          status,
        });
        req.flash("berhasil", "Data Akun Berhasil Diubah!");
        res.redirect("/admin");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/admin");
      }
    }
  },
);

app.delete("/akun", async (req, res) => {
  const { id_login, nama } = req.body;
  try {
    await db("tb_login").where({ id_login }).del();
    req.flash("berhasil", `Data Akun ${nama} Berhasil Dihapus!`);
    res.redirect("/admin");
  } catch (err) {
    console.log(err);
  }
});

//
// Halaman User
app.get("/user", async (req, res) => {
  if (req.session.login) {
    const data_siswa = await db("data_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .join("tb_login", "data_siswa.id_login", "=", "tb_login.id_login")
      .select("*");
    const pembimbing = await db("data_pembimbing").count("* as total").first();
    const ruangan = await db("data_ruangan").count("* as total").first();
    const sekolah = await db("data_sekolah").count("* as total").first();
    const siswa = await db("data_siswa").count("* as total").first();
    res.render("dashboard_user", {
      layout: "layouts/layout-user",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      total_pembimbing: pembimbing.total,
      total_ruangan: ruangan.total,
      total_sekolah: sekolah.total,
      total_siswa: siswa.total,
      data_siswa,
      halaman: "Dashboard",
      activePage: "user",
      blocked: "",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

//
// Halaman Pembimbing
app.get("/pembimbing", async (req, res) => {
  if (req.session.login) {
    const data_pembimbing = await db("data_pembimbing").select("*");
    res.render("data_pembimbing", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      data_pembimbing,
      halaman: "Menu Pembimbing",
      activePage: "pembimbing",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/pembimbing",
  [
    body("email_pembimbing").custom(async (value) => {
      const duplikat = await db("data_pembimbing")
        .select("email_pembimbing")
        .where({ email_pembimbing: value })
        .first();
      if (duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email_pembimbing", "Email tidak valid!").isEmail(),
    check("nohp_pembimbing", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/pembimbing");
    } else {
      const { nama_pembimbing, nohp_pembimbing, email_pembimbing } = req.body;
      try {
        await db("data_pembimbing").insert({
          nama_pembimbing,
          nohp_pembimbing,
          email_pembimbing,
        });
        req.flash("berhasil", "Data Pembimbing Berhasil Ditambahkan!");
        res.redirect("/pembimbing");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/pembimbing");
      }
    }
  },
);

app.put(
  "/pembimbing",
  [
    body("email_pembimbing").custom(async (value, { req }) => {
      const oldEmail = req.body.oldEmail;
      const duplikat = await db("data_pembimbing")
        .select("email_pembimbing")
        .where({ email_pembimbing: value })
        .first();
      if (value !== oldEmail && duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email_pembimbing", "Email tidak valid!").isEmail(),
    check("nohp_pembimbing", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/pembimbing");
    } else {
      const {
        id_pembimbing,
        nama_pembimbing,
        email_pembimbing,
        nohp_pembimbing,
      } = req.body;
      try {
        await db("data_pembimbing").where({ id_pembimbing }).update({
          nama_pembimbing,
          email_pembimbing,
          nohp_pembimbing,
        });
        req.flash("berhasil", "Data Pembimbing Berhasil Diubah!");
        res.redirect("/pembimbing");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/pembimbing");
      }
    }
  },
);

app.delete("/pembimbing", async (req, res) => {
  const { id_pembimbing, nama } = req.body;
  try {
    await db("data_pembimbing").where({ id_pembimbing }).del();
    req.flash("berhasil", `Data Pembimbing ${nama} Berhasil Dihapus!`);
    res.redirect("/pembimbing");
  } catch (err) {
    console.log(err);
  }
});

//
// Halaman Ruangan
app.get("/ruangan", async (req, res) => {
  if (req.session.login) {
    const data_ruangan = await db("data_ruangan").select("*");
    res.render("data_ruangan", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      data_ruangan,
      halaman: "Menu Ruangan",
      activePage: "ruangan",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/ruangan",
  body("nama_ruangan").custom(async (value) => {
    const duplikat = await db("data_ruangan")
      .select("nama_ruangan")
      .where({ nama_ruangan: value })
      .first();
    if (duplikat) {
      throw new Error("Ruangan yang dimasukan sudah ada!");
    }
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/ruangan");
    } else {
      const { nama_ruangan, kepala_ruangan, lokasi_ruangan } = req.body;
      try {
        await db("data_ruangan").insert({
          nama_ruangan,
          kepala_ruangan,
          lokasi_ruangan,
        });
        req.flash("berhasil", "Data Ruangan Berhasil Ditambahkan!");
        res.redirect("/ruangan");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/ruangan");
      }
    }
  },
);

app.put(
  "/ruangan",
  body("nama_ruangan").custom(async (value, { req }) => {
    const oldNama = req.body.oldNama;
    const duplikat = await db("data_ruangan")
      .select("nama_ruangan")
      .where({ nama_ruangan: value })
      .first();
    if (value !== oldNama && duplikat) {
      throw new Error("Ruangan yang dimasukan sudah Ada!");
    }
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/ruangan");
    } else {
      const { id_ruangan, nama_ruangan, kepala_ruangan, lokasi_ruangan } =
        req.body;
      try {
        await db("data_ruangan").where({ id_ruangan }).update({
          nama_ruangan,
          kepala_ruangan,
          lokasi_ruangan,
        });
        req.flash("berhasil", "Data Ruangan Berhasil Diubah!");
        res.redirect("/ruangan");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/ruangan");
      }
    }
  },
);

app.delete("/ruangan", async (req, res) => {
  const { id_ruangan, nama } = req.body;
  try {
    await db("data_ruangan").where({ id_ruangan }).del();
    req.flash("berhasil", `Data Ruangan ${nama} Berhasil Dihapus!`);
    res.redirect("/ruangan");
  } catch (err) {
    console.log(err);
  }
});

//
// Halaman Sekolah
app.get("/sekolah", async (req, res) => {
  if (req.session.login) {
    const data_sekolah = await db("data_sekolah").select("*");
    res.render("data_sekolah", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      data_sekolah,
      halaman: "Menu Sekolah",
      activePage: "sekolah",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/sekolah",
  [
    body("nama_sekolah").custom(async (value) => {
      const duplikat = await db("data_sekolah")
        .select("nama_sekolah")
        .where({ nama_sekolah: value })
        .first();
      if (duplikat) {
        throw new Error("Sekolah yang dimasukan sudah ada!");
      }
    }),
    body("email_sekolah").custom(async (value) => {
      const duplikat = await db("data_sekolah")
        .select("email_sekolah")
        .where({ email_sekolah: value })
        .first();
      if (duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email_sekolah", "Email tidak valid!").isEmail(),
    check("nohp_sekolah", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/sekolah");
    } else {
      const { nama_sekolah, nohp_sekolah, email_sekolah, alamat_sekolah } =
        req.body;
      try {
        await db("data_sekolah").insert({
          nama_sekolah,
          nohp_sekolah,
          email_sekolah,
          alamat_sekolah,
        });
        req.flash("berhasil", "Data Sekolah Berhasil Ditambahkan!");
        res.redirect("/sekolah");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/sekolah");
      }
    }
  },
);

app.put(
  "/sekolah",
  [
    body("nama_sekolah").custom(async (value, { req }) => {
      const oldNama = req.body.oldNama;
      const duplikat = await db("data_sekolah")
        .select("nama_sekolah")
        .where({ nama_sekolah: value })
        .first();
      if (value !== oldNama && duplikat) {
        throw new Error("Sekolah yang dimasukan sudah ada!");
      }
    }),
    body("email_sekolah").custom(async (value, { req }) => {
      const oldEmail = req.body.oldEmail;
      const duplikat = await db("data_sekolah")
        .select("email_sekolah")
        .where({ email_sekolah: value })
        .first();
      if (value !== oldEmail && duplikat) {
        throw new Error("Email yang dimasukan sudah terdaftar!");
      }
    }),
    check("email_sekolah", "Email tidak valid!").isEmail(),
    check("nohp_sekolah", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/sekolah");
    } else {
      const {
        id_sekolah,
        nama_sekolah,
        nohp_sekolah,
        email_sekolah,
        alamat_sekolah,
      } = req.body;
      try {
        await db("data_sekolah").where({ id_sekolah }).update({
          nama_sekolah,
          nohp_sekolah,
          email_sekolah,
          alamat_sekolah,
        });
        req.flash("berhasil", "Data Sekolah Berhasil Diubah!");
        res.redirect("/sekolah");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/sekolah");
      }
    }
  },
);

app.delete("/sekolah", async (req, res) => {
  const { id_sekolah, nama } = req.body;
  try {
    await db("data_sekolah").where({ id_sekolah }).del();
    req.flash("berhasil", `Data Sekolah ${nama} Berhasil Dihapus!`);
    res.redirect("/sekolah");
  } catch (err) {
    console.log(err);
  }
});

// Halaman Siswa
app.get("/siswa", async (req, res) => {
  if (req.session.login) {
    const data_siswa = await db("data_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .join("tb_login", "data_siswa.id_login", "=", "tb_login.id_login")
      .select("data_siswa.*", "data_sekolah.nama_sekolah", "tb_login.*");
    const data_sekolah = await db("data_sekolah");
    const data_akun = await db("tb_login")
      .leftJoin("data_siswa", "tb_login.id_login", "data_siswa.id_login")
      .whereNull("data_siswa.id_login")
      .where({ status: "user" })
      .select("tb_login.*");
    res.render("data_siswa", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      no_hp: req.session.no_hp,
      data_siswa,
      data_sekolah,
      data_akun,
      halaman: "Menu Siswa",
      activePage: "siswa",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/siswa",
  [
    body("nis").custom(async (value) => {
      const duplikat = await db("data_siswa")
        .select("nis")
        .where({ nis: value })
        .first();
      if (duplikat) {
        throw new Error("Nis yang dimasukan sudah ada!");
      }
    }),
    check("nohp_siswa", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/siswa");
    } else {
      const {
        nis,
        nama_siswa,
        nohp_siswa,
        alamat_siswa,
        jenkel,
        tempat_lahir,
        tanggal_lahir,
        status_laporan,
        id_sekolah,
        id_login,
      } = req.body;
      try {
        await db("data_siswa").insert({
          nis,
          nama_siswa,
          nohp_siswa,
          alamat_siswa,
          jenkel,
          tempat_lahir,
          tanggal_lahir,
          status_laporan,
          id_sekolah,
          id_login,
        });
        req.flash("berhasil", "Data Siswa Berhasil Ditambahkan!");
        res.redirect("/siswa");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/siswa");
      }
    }
  },
);

app.put(
  "/siswa",
  [
    body("nis").custom(async (value, { req }) => {
      const oldNIS = req.body.oldNIS;
      const duplikat = await db("data_siswa")
        .select("nis")
        .where({ nis: value })
        .first();
      if (value !== oldNIS && duplikat) {
        throw new Error("Nis yang dimasukan sudah ada!");
      }
    }),
    check("nohp_siswa", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/siswa");
    } else {
      const {
        id_siswa,
        nis,
        nama_siswa,
        nohp_siswa,
        alamat_siswa,
        jenkel,
        tempat_lahir,
        tanggal_lahir,
        id_sekolah,
        status_laporan,
        id_login,
      } = req.body;
      try {
        await db("data_siswa").where({ id_siswa }).update({
          nis,
          nama_siswa,
          nohp_siswa,
          alamat_siswa,
          jenkel,
          tempat_lahir,
          tanggal_lahir,
          id_sekolah,
          status_laporan,
          id_login,
        });
        req.flash("berhasil", "Data Siswa Berhasil Diubah!");
        res.redirect("/siswa");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/siswa");
      }
    }
  },
);

app.delete("/siswa", async (req, res) => {
  const { id_siswa, nama } = req.body;
  try {
    await db("data_siswa").where({ id_siswa }).del();
    req.flash("berhasil", `Data Siswa ${nama} Berhasil Dihapus!`);
    res.redirect("/siswa");
  } catch (err) {
    console.log(err);
  }
});

// Halaman Laporan
app.get("/laporan", async (req, res) => {
  if (req.session.login) {
    const data_laporan = await db("data_laporan")
      .join(
        "data_pembimbing",
        "data_laporan.id_pembimbing",
        "=",
        "data_pembimbing.id_pembimbing",
      )
      .join(
        "data_ruangan",
        "data_laporan.id_ruangan",
        "=",
        "data_ruangan.id_ruangan",
      )
      .join("data_siswa", "data_laporan.id_siswa", "=", "data_siswa.id_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .leftJoin(
        "data_nilai",
        "data_laporan.id_laporan",
        "=",
        "data_nilai.id_laporan",
      )
      .select(
        "data_laporan.*",
        "data_pembimbing.*",
        "data_ruangan.*",
        "data_siswa.*",
        "data_sekolah.nama_sekolah",
        "data_nilai.id_nilai",
        "data_nilai.nilai",
        "data_nilai.grade",
      );
    const data_siswa = await db("data_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .where({
        status_laporan: "Belum Laporan",
      });
    const data_pembimbing = await db("data_pembimbing");
    const data_ruangan = await db("data_ruangan");
    res.render("data_laporan", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      data_laporan,
      data_siswa,
      data_pembimbing,
      data_ruangan,
      halaman: "Menu Laporan",
      activePage: "laporan",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post("/laporan", upload.single("filename"), async (req, res) => {
  const { isi_laporan, id_pembimbing, id_ruangan, id_siswa, id_login, nis } =
    req.body;
  const { filename } = req.file;
  try {
    await db("data_laporan").insert({
      isi_laporan,
      laporan: filename,
      id_pembimbing,
      id_ruangan,
      id_siswa,
      id_login,
    });
    await db("data_siswa")
      .update({ status_laporan: "Sudah Laporan" })
      .where({ nis });
    req.flash("berhasil", "Data Laporan Berhasil Ditambahkan!");
    res.redirect("/laporan");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan");
  }
});

app.put("/laporan", upload.single("filename"), async (req, res) => {
  let filename;
  if (!req.file) {
    filename = req.body.oldLaporan;
  } else {
    filename = req.file.filename;
  }
  const {
    id_laporan,
    isi_laporan,
    id_pembimbing,
    id_ruangan,
    id_siswa,
    id_login,
  } = req.body;
  try {
    await db("data_laporan").where({ id_laporan }).update({
      isi_laporan,
      laporan: filename,
      id_pembimbing,
      id_ruangan,
      id_siswa,
      id_login,
    });
    req.flash("berhasil", "Data Laporan Berhasil Diubah!");
    res.redirect("/laporan");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan");
  }
});

app.delete("/laporan", async (req, res) => {
  const { id_laporan, id_siswa, nama } = req.body;
  try {
    await db("data_laporan").where({ id_laporan }).del();
    await db("data_siswa")
      .update({ status_laporan: "Belum Laporan" })
      .where({ id_siswa });
    req.flash("berhasil", `Data Laporan ${nama} Berhasil Dihapus!`);
    res.redirect("/laporan");
  } catch (err) {
    console.log(err);
  }
});

// Penilaian
app.post("/penilaian", async (req, res) => {
  const { nilai, grade, id_laporan } = req.body;
  try {
    await db("data_nilai").insert({
      nilai,
      grade,
      id_laporan,
    });
    req.flash("berhasil", "Data Nilai Berhasil Ditambahkan!");
    res.redirect("/laporan");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan");
  }
});

app.put("/penilaian", async (req, res) => {
  const { id_nilai, nilai, grade } = req.body;
  try {
    await db("data_nilai").where({ id_nilai }).update({
      nilai,
      grade,
    });
    req.flash("berhasil", "Data Nilai Berhasil Diubah!");
    res.redirect("/laporan");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan");
  }
});

//
// Halaman Siswa User
app.get("/siswa_user", async (req, res) => {
  if (req.session.login) {
    const id = req.session.id_login ? req.session.id_login : "";
    const data_siswa = await db("data_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .select("data_siswa.*", "data_sekolah.nama_sekolah")
      .where({ id_login: id })
      .first();
    const data_sekolah = await db("data_sekolah");
    if (data_siswa) {
      res.render("data_siswa_user", {
        layout: "layouts/layout-user",
        berhasil: req.flash("berhasil"),
        gagal: req.flash("gagal"),
        id_login: req.session.id_login,
        email: req.session.email,
        password: req.session.password,
        nama: req.session.nama,
        no_hp: req.session.no_hp,
        data_siswa,
        data_sekolah,
        halaman: "Biodata Siswa",
        activePage: "siswa_user",
        formAction: "siswa_user?_method=PUT",
        btnType: "",
        blocked: "",
      });
    } else {
      res.render("data_siswa_user", {
        layout: "layouts/layout-user",
        berhasil: req.flash("berhasil"),
        gagal: req.flash("gagal"),
        id_login: req.session.id_login,
        email: req.session.email,
        password: req.session.password,
        nama: req.session.nama,
        no_hp: req.session.no_hp,
        data_siswa: "",
        data_sekolah,
        halaman: "Biodata Siswa",
        activePage: "siswa_user",
        formAction: "siswa_user",
        btnType: "submit",
        blocked: "",
      });
    }
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post(
  "/siswa_user",
  [
    body("nis").custom(async (value) => {
      const duplikat = await db("data_siswa")
        .select("nis")
        .where({ nis: value })
        .first();
      if (duplikat) {
        throw new Error("Nis yang dimasukan sudah ada!");
      }
    }),
    check("nohp_siswa", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/siswa_user");
    } else {
      const {
        nis,
        nama_siswa,
        nohp_siswa,
        alamat_siswa,
        jenkel,
        tempat_lahir,
        tanggal_lahir,
        status_laporan,
        id_sekolah,
        id_login,
      } = req.body;
      try {
        await db("data_siswa").insert({
          nis,
          nama_siswa,
          nohp_siswa,
          alamat_siswa,
          jenkel,
          tempat_lahir,
          tanggal_lahir,
          status_laporan,
          id_sekolah,
          id_login,
        });
        req.flash("berhasil", "Data Berhasil Disimpan!");
        res.redirect("/siswa_user");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/siswa_user");
      }
    }
  },
);

app.put(
  "/siswa_user",
  [
    body("nis").custom(async (value, { req }) => {
      const oldNIS = req.body.oldNIS;
      const duplikat = await db("data_siswa")
        .select("nis")
        .where({ nis: value })
        .first();
      if (value !== oldNIS && duplikat) {
        throw new Error("Nis yang dimasukan sudah ada!");
      }
    }),
    check("nohp_siswa", "No HP tidak valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors
        .array()
        .map((error) => error.msg.replace(/,/g, "") + "<br>")
        .join("");
      req.flash("gagal", err);
      return res.redirect("/siswa_user");
    } else {
      const {
        id_siswa,
        nis,
        nama_siswa,
        nohp_siswa,
        alamat_siswa,
        jenkel,
        tempat_lahir,
        tanggal_lahir,
        id_sekolah,
        status_laporan,
        id_login,
      } = req.body;
      try {
        await db("data_siswa").where({ id_siswa }).update({
          nis,
          nama_siswa,
          nohp_siswa,
          alamat_siswa,
          jenkel,
          tempat_lahir,
          tanggal_lahir,
          id_sekolah,
          status_laporan,
          id_login,
        });
        req.flash("berhasil", "Data Berhasil Diubah!");
        res.redirect("/siswa_user");
      } catch (err) {
        req.flash("gagal", err.message);
        res.redirect("/siswa_user");
      }
    }
  },
);

//
// Halaman Laporan User
app.get("/laporan_user", async (req, res) => {
  if (req.session.login) {
    const id = req.session.id_login ? req.session.id_login : "";
    const data_laporan = await db("data_laporan")
      .join(
        "data_pembimbing",
        "data_laporan.id_pembimbing",
        "=",
        "data_pembimbing.id_pembimbing",
      )
      .join(
        "data_ruangan",
        "data_laporan.id_ruangan",
        "=",
        "data_ruangan.id_ruangan",
      )
      .select("data_laporan.*", "data_pembimbing.*", "data_ruangan.*")
      .where({ id_login: id })
      .first();
    const data_siswa = await db("data_siswa")
      .join(
        "data_sekolah",
        "data_siswa.id_sekolah",
        "=",
        "data_sekolah.id_sekolah",
      )
      .select("data_siswa.*", "data_sekolah.nama_sekolah")
      .where({ id_login: id })
      .first();
    const data_pembimbing = await db("data_pembimbing");
    const data_ruangan = await db("data_ruangan");
    if (data_laporan) {
      res.render("data_laporan_user", {
        layout: "layouts/layout-user",
        berhasil: req.flash("berhasil"),
        gagal: req.flash("gagal"),
        id_login: req.session.id_login,
        email: req.session.email,
        password: req.session.password,
        nama: req.session.nama,
        data_laporan,
        data_siswa,
        data_pembimbing,
        data_ruangan,
        halaman: "Menu Laporan",
        activePage: "laporan_user",
        formAction: "laporan_user?_method=PUT",
        btnType: "",
        blocked: "",
      });
    } else {
      if (data_siswa) {
        res.render("data_laporan_user", {
          layout: "layouts/layout-user",
          berhasil: req.flash("berhasil"),
          gagal: req.flash("gagal"),
          id_login: req.session.id_login,
          email: req.session.email,
          password: req.session.password,
          nama: req.session.nama,
          data_laporan: "",
          data_siswa,
          data_pembimbing,
          data_ruangan,
          halaman: "Menu Laporan",
          activePage: "laporan_user",
          formAction: "laporan_user",
          btnType: "submit",
          blocked: "",
        });
      } else {
        res.render("data_laporan_user", {
          layout: "layouts/layout-user",
          berhasil: req.flash("berhasil"),
          gagal: req.flash("gagal"),
          id_login: req.session.id_login,
          email: req.session.email,
          password: req.session.password,
          nama: req.session.nama,
          data_laporan: "",
          data_siswa: "",
          data_pembimbing,
          data_ruangan,
          halaman: "Menu Laporan",
          activePage: "laporan_user",
          formAction: "laporan_user",
          btnType: "submit",
          blocked: "block",
        });
      }
    }
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

app.post("/laporan_user", upload.single("filename"), async (req, res) => {
  const { isi_laporan, id_pembimbing, id_ruangan, id_siswa, id_login, nis } =
    req.body;
  const { filename } = req.file;
  try {
    await db("data_laporan").insert({
      isi_laporan,
      laporan: filename,
      id_pembimbing,
      id_ruangan,
      id_siswa,
      id_login,
    });
    await db("data_siswa")
      .update({ status_laporan: "Sudah Laporan" })
      .where({ nis });
    req.flash("berhasil", "Data Laporan Berhasil Ditambahkan!");
    res.redirect("/laporan_user");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan_user");
  }
});

app.put("/laporan_user", upload.single("filename"), async (req, res) => {
  let filename;
  if (!req.file) {
    filename = req.body.oldLaporan;
  } else {
    filename = req.file.filename;
  }
  const {
    id_laporan,
    isi_laporan,
    id_pembimbing,
    id_ruangan,
    id_siswa,
    id_login,
  } = req.body;
  try {
    await db("data_laporan").where({ id_laporan }).update({
      isi_laporan,
      laporan: filename,
      id_pembimbing,
      id_ruangan,
      id_siswa,
      id_login,
    });
    req.flash("berhasil", "Data Laporan Berhasil Diubah!");
    res.redirect("/laporan_user");
  } catch (err) {
    console.log(err.message);
    req.flash("gagal", err.message);
    res.redirect("/laporan_user");
  }
});

//
// Cetak Sertifikat
app.get("/cetak_sertifikat", async (req, res) => {
  if (req.session.login) {
    const data_laporan = await db("data_laporan")
      .join("data_siswa", "data_laporan.id_siswa", "=", "data_siswa.id_siswa")
      .join(
        "data_nilai",
        "data_laporan.id_laporan",
        "=",
        "data_nilai.id_laporan",
      )
      .select("data_laporan.*", "data_siswa.*", "data_nilai.*");
    res.render("cetak_sertifikat", {
      layout: "layouts/layout-admin",
      berhasil: req.flash("berhasil"),
      gagal: req.flash("gagal"),
      id_login: req.session.id_login,
      email: req.session.email,
      password: req.session.password,
      nama: req.session.nama,
      data_laporan,
      halaman: "Cetak Sertifikat",
      activePage: "cetak_sertifikat",
    });
  } else {
    req.flash("masuk_dulu", "Silahkan Masuk Terlebih Dahulu!");
    res.redirect("/");
  }
});

// app.post("/cetak_sertifikat", async (req, res) => {
//   const { nama_siswa } = req.body;
//   try {
//     const backgroundImage = await loadImage(
//       "sertifikat/templete_sertifikat.png",
//     );
//     const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
//     const ctx = canvas.getContext("2d");

//     ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

//     ctx.font = '90px "Ephesis"';
//     ctx.fillStyle = "#2B5F9C";

//     const textWidth = ctx.measureText(nama_siswa).width;
//     const xPos = canvas.width / 2 - textWidth / 2;
//     const yPos = 750;
//     ctx.fillText(nama_siswa, xPos, yPos);

//     const outputFile = `sertifikat-${nama_siswa}.png`;
//     const out = fs.createWriteStream(outputFile);
//     const stream = canvas.createPNGStream();
//     stream.pipe(out);

//     out.on("finish", () => {
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename="${outputFile}"`,
//       );
//       res.sendFile(path.join(__dirname, outputFile), (err) => {
//         if (err) {
//           console.error(err);
//           res.status(500).send("Terjadi kesalahan saat mengirim file.");
//         } else {
//           // Hapus file setelah berhasil dikirim
//           fs.unlink(outputFile, (err) => {
//             if (err) {
//               console.error(err);
//             }
//           });
//         }
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Terjadi kesalahan saat membuat sertifikat");
//   }
// });

app.post("/cetak_sertifikat", async (req, res) => {
  const { nama_siswa } = req.body;
  try {
    const doc = new PDFDocument({ size: [2000, 1414] });

    doc.image("sertifikat/templete_sertifikat.png", 0, 0, {
      width: 2000,
      height: 1414,
    });

    const verticalOffset = 0; // Atur offset vertikal
    const textY = doc.page.height / 2 + verticalOffset; // Menyesuaikan posisi vertikal

    doc
      .font("font/Ephesis-Regular.ttf")
      .fontSize(90)
      .fillColor("#2B5F9C")
      .text(nama_siswa, 0, textY , { align: "center" });

    const outputFile = `sertifikat-${nama_siswa}.pdf`;
    const outputFilePath = path.join(__dirname, outputFile);

    const stream = doc.pipe(fs.createWriteStream(outputFilePath));

    // Event 'finish' di sini menunggu hingga proses penulisan selesai
    stream.on("finish", () => {
      // Set header dan kirim file ke client
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${outputFile}"`,
      );
      res.setHeader("Content-Type", "application/pdf");

      const fileStream = fs.createReadStream(outputFilePath);
      fileStream.pipe(res);
    });

    doc.end(); // Akhiri proses pembuatan PDF
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan saat membuat sertifikat");
  }
});

app.listen(port, () => {
  console.log(`Aplikasi Pendataan Siswa Magang | Listening at port ${port}`);
});
