const db = require("knex")({
  client: "mysql2",
  connection: {
    host: "localhost",
    user: "root",
    password: "A.maulana123",
    database: "siswa_magang2",
  },
});

module.exports = db;
