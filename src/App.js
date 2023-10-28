import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";
import "./App.css";
import AWS from "aws-sdk";
import axios from "axios";

AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-east-1",
});

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const BUCKET = "dog-recognition-app-us-east-1";

const App = () => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [s3ImageUrl, setS3ImageUrl] = useState(null);
  const [image, setImage] = useState(null);
  // Define a state variable to keep track of the last uploaded image key
  const [lastImageKey, setLastImageKey] = useState(null);


  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' }); // Adjust the type based on your image type
  }
  
  const handleUpload = () => {
    // Convert base64 image to Blob
    const blobImage = dataURItoBlob(image);
  
    // Create a FormData object and append the Blob to it
    const formData = new FormData();
    formData.append('image', blobImage, 'image.jpg');
  
    // Send the FormData to your Node.js server using Axios
    console.log( {base64Data: image});
    const data = {base64Data: image}
    
    fetch('http://localhost:5000/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
});


  }

  const capture = async () => {
    const screenshot = webcamRef.current.getScreenshot();
    // const clean = removeBase64Prefix(screenshot);

    if (screenshot) {
      setImage(screenshot)

      // setImages([...images, screenshot]);
      // console.log(isImageSizeValid(clean));

      // Upload the captured image to S3
      // await uploadToS3(clean);

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

  const isImageSizeValid = (imageData) => {
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB in bytes
    return imageData.length <= maxSizeInBytes;
  };

  const uploadToS3 = async (imageData) => {
    try {
      const key = `captured-image-${new Date().getTime()}.jpeg`;

      const uploadParams = {
        Bucket: BUCKET,
        Key: key,
        Body: imageData,
      
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      const response = await s3.upload(uploadParams).promise();
      const imageUrl = response.Location;

      // Set the last image key to the key of the uploaded image
      setLastImageKey(key);

      setS3ImageUrl(imageUrl);

      // Analyze the image using Amazon Rekognition
      await analyzeImage(key); // Pass the key to analyzeImage
    } catch (error) {
      console.error("Error uploading to S3:", error);
    }
  };

  const analyzeImage = async (imageKey) => {
    console.log(imageKey)
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: BUCKET,
            Name: "captured-image-1698492997910.jpeg",
          },
        },
        MaxLabels: 10,
        MinConfidence: 50,
      };

      const response = await rekognition.detectLabels(params).promise();
      const labels = response.Labels;
      setAnalysisResults([...analysisResults, labels]);
    } catch (error) {
      console.error("Error analyzing image with Rekognition:", error);
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
          <button onClick={handleUpload}>Upload</button>
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



            {analysisResults[index] && (
              <div>
                <h2>Analysis Results:</h2>
                <ul>
                  {analysisResults[index].map((label, labelIndex) => (
                    <li key={labelIndex}>{label.Name}</li>
                  ))}
                </ul>
              </div>
            )}




          </div>
        ))}
      </div>
    </div>
  );
  
};

export default App;
