const db = require("knex")({
  client: "mysql2",
  connection: {
    host: "localhost",
    user: "root",
    password: "",
    database: "siswa_magang2",
  },
});

module.exports = db;
