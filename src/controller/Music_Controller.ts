import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import connection from "../database/connection";
import bytes from "bytes";
import aws from "aws-sdk";
import { WriteEventStream } from "aws-sdk/clients/pinpoint";

interface I_Music_Data {
    music_name: string,
}

let musics_not_syncronization = [];

export default {
    async music_upload(req: Request, res: Response) {
        const { originalname: music_title, key, size, location: music_url } = req.file;
        const music_extension = music_title.split(".")[1];
        const { music_duration } = req.body;

        try {
            await connection("musics")
                .insert({
                    music_title,
                    music_duration,
                    music_name: key,
                    music_extension,
                    music_size: bytes(size),
                    music_url
                })
                .then(() => res.status(200).json({
                    msg: "Upload and save make with success",
                }))
                .catch(err => res.status(400).json({
                    msg: "It's not possible to make the register in database",
                    err: err.message,
                }));

        } catch (err) {
            res.status(400).json({
                msg: "Error in the upload process",
                err: err
            });

        }
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

    async music_stream(req: Request, res: Response) {
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
    },

    async music_database_index(req: Request, res: Response) {
        try {
            return await connection("musics")
                .select("*")
                .then(musics => res.status(200).json({
                    msg: "Sucess in get all musics in database",
                    musics: musics
                }))
                .catch(err => res.status(400).json({
                    msg: "Error in try to get all music in database"
                }));

        } catch (err) {
            return res.status(400).json({
                msg: "Failend in try to list all music in database",
                err: err.message
            })
        }
    },

    async music_folder_index(req: Request, res: Response) {
        try {
            return fs.readdir(path.resolve(__dirname, "..", "database", "music"), "utf-8", (err, files) => {
                if (err)
                    return res.status(400).json({
                        msg: "Failed in the acess folder of musics",
                        err: err.message
                    });

                return res.status(200).json({
                    msg: "Sucess in the acess folder of all musics",
                    musics: files
                });
            });
        } catch (err) {
            return res.status(400).json({
                msg: "Error in the operation of get all musics saved in the folder",
                err: err.message
            });

        }
    },

    async music_syncronization(req: Request, res: Response) {
        try {
            const musics_in_the_database = await connection("musics")
                .select("music_name")
                .select("music_url")
                .then((musics: I_Music_Data[]) => musics)

            const readdir = promisify(fs.readdir);
            const musics_in_the_folder = await readdir(
                path.resolve(__dirname, "..", "database", "music"),
                "utf-8",
            );

            musics_in_the_database.forEach(item => {
                if (!musics_in_the_folder.includes(item.music_name))
                    musics_not_syncronization.push(item);
            })

            if (musics_not_syncronization.length > 0)
                return res.status(400).json({
                    msg: "Exist music out in the folder!",
                    musics: musics_not_syncronization
                })

            res.status(200).send("ok")

        } catch (err) {
            return res.status(400).json({
                msg: "Error in the operation of get all musics in the database",
                err: err.message
            });

        };
    },

    async music_restore() {
        const s3 = new aws.S3();
        let path_folder = path.resolve(__dirname, "..", "database", "music");
        for (let i = 0; i < musics_not_syncronization.length; i++) {
            const params = { Bucket: 'uploadexample2703', Key: musics_not_syncronization[i].music_name };
            var file = fs.createWriteStream(`${path_folder}/${musics_not_syncronization[i].music_name}`);
            s3.getObject(params).createReadStream().pipe(file);
        }
    }
}