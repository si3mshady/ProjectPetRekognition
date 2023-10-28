import React, { useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'us-east-1',
});

const rekognition = new AWS.Rekognition();

const App = () => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);



  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };
  

  // Function to validate the image format (PNG or JPEG)
const isValidImageFormat = (imageData) => {
  // Assuming imageData is a data URI (e.g., 'data:image/png;base64,...')
  const format = imageData.split(';')[0].split(':')[1];
  return format === 'image/png' || format === 'image/jpeg';
};

const isImageSizeValid = (imageBlob) => {
  const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB in bytes

  // Check if the image Blob size is within the allowed limit
  return imageBlob.size <= maxSizeInBytes;
};


function removeBase64Prefix(base64String) {
  // Check if the string starts with 'data:image/...' and a comma
  if (base64String.startsWith('data:image/') && base64String.includes(',')) {
    // Split the string at the comma and take the second part
    return base64String.split(',')[1];
  }
  // If the string doesn't have the expected prefix, return it as is
  return base64String;
}


const capture = () => {
  const screenshot = webcamRef.current.getScreenshot();

  const clean =removeBase64Prefix(screenshot)

  

  // Check the image format
 
    // Log the image data
    console.log("Captured Image Data:", screenshot);

    if (isValidImageFormat(screenshot)) {
      setImages([...images, screenshot]);

     console.log(isImageSizeValid(screenshot))
  

    analyzeImage(screenshot);

    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  } else {
    console.log("Invalid image format. Please capture a PNG or JPEG image.");
  };
};
  const webcamRef = React.useRef(null);

  function isBase64(str) {
    // Regular expression to validate Base64 format
    const base64Regex = /^(data:image\/[a-zA-Z+-.]+;base64,)/;
  
    return base64Regex.test(str);
  }

  const analyzeImage = (imageData) => {

    if (!isBase64(imageData)) {
      console.error('Invalid Base64 Image Format');
      return;
    }
  
    const params = {
      Image: {
        Bytes: imageData,
      },
    };

    rekognition.detectLabels(params, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        const narrowList = data.Labels.slice(0, 3);
        console.log(data);
        console.log(narrowList);

        // Update the analysis results
        setAnalysisResults([...analysisResults, narrowList]);
      }
    });
  };

  return (
    <div className="app-container">
      <h1>Photo Capture App</h1>
      <div className="container">
        <div className="webcam-container">
          <Webcam audio={false} 
           screenshotFormat="image/jpeg"
           height={100}
           width={100}
        
           
          
          ref={webcamRef} />
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
