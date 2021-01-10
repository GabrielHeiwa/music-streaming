import { Request, Response } from "express";
import connection from "../database/connection";

interface I_Music_Data {
    music_title: string,
    music_duration: string,
    music_name: string,
}

export default {
    async music_upload(req: Request, res: Response) {
        res.sendStatus(200);
    },

    async music_save(req: Request, res: Response) {
        const music_data: I_Music_Data = req.body;

        try {
            await connection("musics")
                .insert(music_data)
                .then(() => 
                    res.status(201).send("Music saved with sucess"));

        } catch (err) {
            res.status(500).send("Saved error");
            
        }
    }
}