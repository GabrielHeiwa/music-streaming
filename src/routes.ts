import { Router, Request, Response } from "express";
import multer from "./config/multer.conf"
import Music_Controller from "./controller/Music_Controller";

const routes = Router();

routes.post("/music_upload",
    multer.single("music"),
    Music_Controller.music_upload
);

routes.post("/music_save",
    Music_Controller.music_save
);

routes.get("/music_stream/:music_name", 
    Music_Controller.musci_stream
);

export default routes;