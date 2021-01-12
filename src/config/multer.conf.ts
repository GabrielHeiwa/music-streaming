import multer, { diskStorage } from "multer";
import path from "path";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const storages = {
    S3: multerS3({
        s3: new aws.S3(),
        bucket: "uploadexample2703",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: "public-read",
        key: (req, file, callback) => {
            callback(null, `${Date.now()}-${file.originalname}`);
            
        },
    }),

    local: multer.diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.resolve(__dirname, "..", "database", "music"));

        },
        filename: (req, file, callback) => {
            file.key = `${Date.now()}-${file.originalname}`
            callback(null, file.key);

        },
    }),
}

export default multer({
    dest: path.resolve(__dirname, "..", "database", "music"),
    storage: storages.S3,
});