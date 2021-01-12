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
    Music_Controller.music_stream
);

routes.get("/music_database_index",
    Music_Controller.music_database_index
);

routes.get("/music_folder_index",
    Music_Controller.music_folder_index
);

routes.get("/music_syncronization", 
    Music_Controller.music_syncronization
);

export default routes;