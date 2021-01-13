import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import connection from "../database/connection";
import bytes from "bytes";
import aws from "aws-sdk";

interface I_Music_Data {
    music_name: string,
    music_url: string,
    music_extension: string
}

let musics_not_syncronization: I_Music_Data[] = [];
const s3 = new aws.S3();

export default {
    async music_upload(req: Request, res: Response) {
        const { originalname: music_title, key, size, location: music_url } = req.file;
        const music_extension = music_title.split(".")[1];
        const { music_duration } = req.body;

        try {
            await connection("musics")
                .insert({
                    music_title: music_title.split('.')[0],
                    music_duration,
                    music_name: key.split('.')[0],
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

    async music_stream(req: Request, res: Response) {
        const music_name = req.params.music_name;

        const getStat = promisify(fs.stat);
        const content_Type = `audio/${music_name.split('.')[1]}`;

        try {
            if (!fs.existsSync(path.resolve(__dirname, "..", "database", "music", music_name))) {
                const params = {
                    Bucket: process.env.BUCKET,
                    Key: music_name,
                };

                const streamS3 = s3.getObject(params);
                return streamS3.createReadStream()
                    .pipe(res)
                    .on("finish", () => res.status(200).json({
                        msg: "Music stream complete",
                    }));
            }

            let path_folder_music = path.resolve(__dirname, "..", "database", "music", music_name);

            const stat = await getStat(path_folder_music);

            res.writeHead(200, {
                'Content-Type': content_Type,
                'Content-Length': bytes(stat.size)
            });

            const music_stream = fs.createReadStream(path_folder_music, {});
            return music_stream.pipe(res);

        } catch (err) {
            const aws_file_link = `https://${process.env.BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${music_name}`;

            res.status(200).json({
                msg: "Stream music error to the play.",
                err: err.message,
            }).redirect(aws_file_link);
        }
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
        musics_not_syncronization = [];
        try {
            const musics_in_the_database = await connection("musics")
                .select("music_name")
                .select("music_url")
                .select("music_extension")
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
                    restore: "http://localhost:3000/music_restore",
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

    async music_restore(req: Request, res: Response) {
        let path_folder = path.resolve(__dirname, "..", "database", "music");
        await download_music_for_restore(musics_not_syncronization.length - 1);

        async function download_music_for_restore(index: number) {

            if (index < 0) {
                console.log("Finish download for all musics");
                return res.status(200).send("All music restore!");
            }
            const key = `${musics_not_syncronization[index].music_name}.${musics_not_syncronization[index].music_extension}`;
            const params = { Bucket: process.env.BUCKET, Key: key };
            const path_file = `${path_folder}/${key}`;
            const stream_file = fs.createWriteStream(path_file, {});
            s3.getObject(params)
                .createReadStream()
                .pipe(stream_file)
                .on("error", err => {
                    res.status(400).json({
                        msg: "Error in process the download music from database",
                        err: err.message
                    });
                })
                .on("open", () => console.log(`Starting download ${musics_not_syncronization[index].music_name}`))
                .on("close", () => {
                    console.log(`Finish downlaod the music ${musics_not_syncronization[index].music_name}`);
                    musics_not_syncronization.pop();
                    download_music_for_restore(index - 1);
                });
        }
    }
}