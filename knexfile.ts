import { Config } from "knex";
import path from "path";

const development_Config: Config = {
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "src", "database", "dev.sqlite")
  },
  migrations: {
    directory: path.resolve(__dirname, "src", "database", "migrations"),
  },
  useNullAsDefault: false,
};

export default development_Config;
