import React, { useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: "YOUR_ACCESS_KEY_ID",
  secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  region: "us-east-1",
});

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

const App = () => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [s3ImageUrl, setS3ImageUrl] = useState(null);

  // Function to validate the image format (PNG or JPEG)
  const isValidImageFormat = (imageData) => {
    // Assuming imageData is a data URI (e.g., 'data:image/png;base64,...')
    const format = imageData.split(";")[0].split(":")[1];
    return format === "image/png" || format === "image/jpeg";
  };

  function removeBase64Prefix(base64String) {
    // Check if the string starts with 'data:image/...' and a comma
    if (base64String.startsWith("data:image/") && base64String.includes(",")) {
      // Split the string at the comma and take the second part
      return base64String.split(",")[1];
    }
    // If the string doesn't have the expected prefix, return it as is
    return base64String;
  }

  const capture = async () => {
    const screenshot = webcamRef.current.getScreenshot();

    const clean = removeBase64Prefix(screenshot);

    if (isValidImageFormat(screenshot)) {
      setImages([...images, screenshot]);
      console.log(isImageSizeValid(screenshot));

      // Upload the captured image to S3
      uploadToS3(clean);

      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    } else {
      console.log("Invalid image format. Please capture a PNG or JPEG image.");
    }
  };

  // Function to check if the image Blob size is within the allowed limit
  const isImageSizeValid = (imageBlob) => {
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB in bytes

    return imageBlob.size <= maxSizeInBytes;
  };

  // Function to upload the image to Amazon S3
  const uploadToS3 = async (imageData) => {
    const imageBuffer = Buffer.from(decodeURIComponent(imageData), "base64");

    const s3Params = {
      Bucket: "YOUR_S3_BUCKET",
      Key: `captured-image-${new Date().getTime()}.jpg`,
      Body: imageBuffer,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    };

    try {
      await s3.upload(s3Params).promise();
      const s3ImageUrl = s3.getSignedUrl("getObject", {
        Bucket: "YOUR_S3_BUCKET",
        Key: s3Params.Key,
        Expires: 600, // Link expiration time in seconds (adjust as needed)
      });
      setS3ImageUrl(s3ImageUrl);
    } catch (error) {
      console.error("Error uploading to S3:", error);
    }
  };

  return (
    <div className="app-container">
      <h1>Photo Capture App</h1>
      <div className="container">
        <div className="webcam-container">
          <Webcam
            audio={false}
            screenshotFormat="image/jpeg"
            height={100}
            width={100}
            ref={webcamRef}
          />
          <button onClick={capture}>Capture</button>
        </div>
      </div>
      {location && (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      )}
      <div className="image-container">
        {images.map((image, index) => (
          <div key={index}>
            <img src={image} alt={`Captured ${index}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
