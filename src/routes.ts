import { Router, Request, Response } from "express";
import multer from "./config/multer.conf"

const routes = Router();

routes.post("/music_upload", multer.single("music"), (req: Request, res: Response) => {
    res.sendStatus(200);
});

export default routes;