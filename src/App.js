import React, { useState } from "react";
import Webcam from "react-webcam";
import "./App.css";

const App = () => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);

  const capture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImages([...images, screenshot]);

    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  };

  const webcamRef = React.useRef(null);

  return (
    <div className="app-container">
      <h1>Photo Capture App</h1>
      <div className="container">
        <div className="webcam-container">
          <Webcam audio={false} ref={webcamRef} />
        </div>
        <button onClick={capture}>Capture</button>
      </div>
      {location && (
        <p>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </p>
      )}
      <div className="image-container">
        {images.map((image, index) => (
          <img key={index} src={image} alt={`Captured ${index}`} />
        ))}
      </div>
    </div>
  );
};

export default App;
