import multer, { diskStorage } from "multer";
import path from "path";

export default multer({
    dest: path.resolve(__dirname, "..", "database", "music"),
    storage: diskStorage({
        destination: (req, file, callback) => {
            callback(null, path.resolve(__dirname, "..", "database", "music"))
        },
        filename: (req, file, callback) => {
            callback(null, `${Date.now()}-${file.originalname}`);
        },
    })
});