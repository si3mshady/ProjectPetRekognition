import React, { useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-east-1",
});

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const BUCKET = "dog-recognition-app-us-east-1"

const App = () => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [s3ImageUrl, setS3ImageUrl] = useState(null);
  const BUCKET = "dog-recognition-app-us-east-1"

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
      // Upload the captured image to S3
      uploadToS3(clean);

      setImages([...images, screenshot]);

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
 // Function to upload the image to Amazon S3
const uploadToS3 = async (imageData) => {
  const byteCharacters = atob(decodeURIComponent(imageData));
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const imageBlob = new Blob([new Uint8Array(byteNumbers)], { type: "image/jpeg" });

  // Create an ObjectURL for the blob
  const objectURL = URL.createObjectURL(imageBlob);

  const s3Params = {
    Bucket: BUCKET,
    Key: `captured-image-${new Date().getTime()}.jpg`,
  
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
  };

  try {
    await s3.upload({
      ...s3Params,
      Body: imageBlob,
    }).promise();

    // Set the S3 image URL to be used in your component
    setS3ImageUrl(objectURL);

  } catch (error) {
    console.error("Error uploading to S3:", error);
  }
};

  const webcamRef = React.useRef(null);

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
    </div> // <---- Missing closing parenthesis for the map function
  ))}
</div>
    </div>
  );
};

export default App;
