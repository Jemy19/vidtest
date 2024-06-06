const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const { GridFSBucket } = require('mongodb');
const app = express();

const mongoURI = 'mongodb+srv://jeremy19:qweasdzxc123@cluster0.ycodben.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Database Connected');
  const conn = mongoose.connection;
  const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });

  // Define routes
  app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
  }));
  app.use(express.json());

  const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return {
        filename: file.originalname,
        bucketName: 'uploads'
      };
    }
  });

  const upload = multer({ storage });

  app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const { filename } = req.file;
      res.status(201).send({ filename });
    } catch (err) {
      console.error("Error uploading video:", err);
      res.status(500).send("Upload failed");
    }
  });

  app.get("/videos", async (req, res) => {
    try {
      const files = await gfs.find().toArray();
      const filenames = files.map(file => file.filename);
      res.status(200).send(filenames);
    } catch (err) {
      console.error("Error getting video list:", err);
      res.status(500).send("Error getting video list");
    }
  });

  app.get("/videos/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const videoStream = gfs.openDownloadStreamByName(filename);

      // Set appropriate headers for video streaming
      res.setHeader("Content-Type", "video/mp4"); // Adjust content type based on video format
      res.setHeader("Accept-Ranges", "bytes"); // Allow for partial requests (optional)

      videoStream.pipe(res);
    } catch (err) {
      console.error("Error streaming video:", err);
      res.status(500).send("Error streaming video");
    }
  });

  const port = 8000;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
})
.catch((err) => console.log('Database not Connected', err));

