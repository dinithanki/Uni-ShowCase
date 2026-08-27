const multer = require("multer");

// Use memoryStorage so uploads work in serverless environments (Vercel)
// where there is no writable filesystem. Files are available as file.buffer.
const storage = multer.memoryStorage();

const isSupportedImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer
    .subarray(0, 8)
    .equals(Buffer.from("\x89PNG\r\n\x1a\n", "binary"));
  const isGif =
    buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
    buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isGif || isWebp;
};

const fileFilter = (req, file, cb) => {
  if (
    ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
      file.mimetype,
    )
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadProjectImagesFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "additionalImages", maxCount: 5 },
]);

const uploadProjectImages = (req, res, next) => {
  uploadProjectImagesFields(req, res, (error) => {
    if (error) return next(error);

    const files = Object.values(req.files || {}).flat();
    if (files.some((file) => !isSupportedImage(file.buffer))) {
      return res
        .status(400)
        .json({ message: "Uploaded file content is not a supported image" });
    }

    return next();
  });
};

module.exports = { uploadProjectImages };
