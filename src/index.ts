import express from "express";
import routes from "./routes";
import path from "path";
import dotenv from "dotenv";
dotenv.config()

const server = express();
// Server configuration
server.use(express.json());
server.use(express.urlencoded({ extended: true}));
server.use("/index", express.static(path.resolve(__dirname, "public")));
server.use(routes);

server.listen("3000", () => console.log("> Runnig"));