const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
const { GridFSBucket } = require('mongodb');
const app = express();

const mongoURI = 'mongodb+srv://jeremy19:qweasdzxc123@cluster0.ycodben.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors(
    {
        credentials: true,
        origin: 'http://localhost:3000'
    }
));
app.use(express.json());

// Create mongo connection
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Database Connected');
  const conn = mongoose.connection;
  let gfs;

  conn.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: "uploads"
    });
    console.log('gfs initialized:', gfs); // Log to verify initialization
  });

  // Create storage engine
  const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      const fileInfo = {
        filename: file.originalname,
        bucketName: 'uploads'
      };
      if (file.id) {
        fileInfo._id = file.id;
      }
      return fileInfo;
    }
  });

  const upload = multer({ storage });

  // Route for uploading videos
  app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const { filename } = req.file;
      res.status(201).send({ filename });
    } catch (err) {
      console.error("Error uploading video:", err);
      res.status(500).send("Upload failed");
    }
  });

  // Route for fetching a list of videos
  app.get("/videos", async (req, res) => {
    try {
      const gfs = await conn.db.collection('uploads.files'); // Await gfs initialization
      console.log(gfs); // Log to check gfs value
      if (!gfs) {
        return res.status(500).send("GridFS not initialized");
      }
      const files = await gfs.find().toArray();
      const filenames = files.map(file => file.filename);
      res.status(200).send(filenames);
    } catch (err) {
      console.error("Error getting video list:", err);
      res.status(500).send("Error getting video list");
    }
  });

  // Route for streaming videos
  app.get("/videos/:filename", async (req, res) => {
    try {
      console.log(gfs); // Log to check gfs value
      if (!gfs) {
        return res.status(500).send("GridFS not initialized");
      }
      const filename = req.params.filename;
      const videoStream = await gfs.openDownloadStream(filename);

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
