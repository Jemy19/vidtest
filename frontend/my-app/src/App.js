import React, { useState, useEffect } from "react";
import axios from "axios";

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true

function App() {  
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Fetch the list of available videos when the component mounts
    const fetchVideoList = async () => {
      try {
        const response = await axios.get("http://localhost:8000/videos");
        setVideoList(response.data);
      } catch (error) {
        console.error("Error fetching video list:", error);
      }
    };
    fetchVideoList();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { filename } = response.data;
      setVideoUrl(`http://localhost:8000/stream/${filename}`);
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  const handleVideoSelect = (e) => {
    setSelectedVideo(e.target.value);
    setVideoUrl(`http://localhost:8000/stream/${e.target.value}`);
  };

  return (
    <div className="App">
      <h1>Video Upload and Stream</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {uploadProgress > 0 && <div>Upload Progress: {uploadProgress}%</div>}
      <br />
      <label>Select Video:</label>
      <select value={selectedVideo} onChange={handleVideoSelect}>
        <option value="">Select a video...</option>
        {videoList.map((video, index) => (
          <option key={index} value={video}>{video}</option>
        ))}
      </select>
      {videoUrl && (
        <div>
          <h2>Video Stream</h2>
          <video controls width="400" src={videoUrl} type="video/mp4" />
        </div>
      )}
    </div>
  );
}

export default App;
