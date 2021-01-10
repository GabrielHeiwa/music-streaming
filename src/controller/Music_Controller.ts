import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import connection from "../database/connection";
import bytes from "bytes";

interface I_Music_Data {
    music_title: string,
    music_duration: string,
    music_name: string,
}

export default {
    async music_upload(req: Request, res: Response) {
        const file_data = req.file,
            extension = file_data.originalname.split(".")[1],
            music_title = file_data.originalname,
            music_name = file_data.filename,
            music_duration = req.body.music_duration;

            console.log(req.body)
        

        res.status(200).json({
            msg: "Upload and save make with success",
            music_title: music_title,
            music_duration: music_duration,
            music_name: file_data.filename,
            music_extension: extension
        });
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
    },

    async musci_stream(req: Request, res: Response) {
        const music_name = req.params.music_name;
        const path_folder_music = path.resolve(__dirname, "..", "database", "music", music_name);
        
        const getStat = promisify(fs.stat);
        const stat = await getStat(path_folder_music);

        res.writeHead(200, {
            'Content-Type': 'audio/ogg',
            'Content-Length': bytes(stat.size)
        });

        const music_stream = fs.createReadStream(path_folder_music);
        music_stream.pipe(res);
    }
}