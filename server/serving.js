const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const app = express();
const bodyParser = require('body-parser')
const cors = require('cors'); // Import the cors middleware
const fs = require('fs');
const AWS = require('aws-sdk');
const { Bucket } = require('react-bootstrap-icons');


app.use(bodyParser.json())
app.use(cors());

// Configure the AWS SDK with your region
AWS.config.update({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
  });

// Create an S3 instance
const s3 = new AWS.S3();

const rekognition = new AWS.Rekognition();

// Function to detect labels in an image stored in S3
async function detectLabelsInS3Image(bucketName, objectKey) {
  const params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: objectKey,
      },
    },
    MaxLabels: 10, // You can adjust this based on your requirements
    MinConfidence: 50, // You can adjust this confidence threshold
  };

  rekognition.detectLabels(params, (err, data) => {
    if (err) {
      console.error('Error detecting labels:', err);
    } else {
    //   console.log('Detected labels:', data.Labels);
      // You can handle the label detection results here

      return data.Labels
    }
  });
}


// Function to upload a file to an S3 bucket
function uploadFileToS3(bucketName, fileName, filePath) {
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: bucketName,
    Key: fileName, // Specify the desired key (object name) in the S3 bucket
    Body: fileStream,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading file to S3:', err);
    } else {
      console.log('File uploaded successfully:', data.Location);
    }
  });




}


// Example usage
const BUCKET = "dog-recognition-app-us-east-1"
const fileName = 'image.jpeg'; // The desired object name in S3
const PATH = "./image.jpeg"





// Function to save Base64 image data to a file
function saveBase64ImageToFile(base64Data, filePath) {
    // Remove the data URL prefix (e.g., 'data:image/png;base64,')
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
    // Decode the Base64 data to binary
    const binaryData = Buffer.from(base64Image, 'base64');
  
    // Save the binary data to a file
    fs.writeFile(filePath, binaryData, 'binary', (err) => {
      if (err) {
        console.error('Error saving the image:', err);
      } else {
        console.log('Image saved to:', PATH);
      }
    });
    
  }

app.post('/upload', (req, res) => {
//  console.log(req.body)

 const base64ImageData = req.body.base64Data

 saveBase64ImageToFile(base64ImageData,PATH)
 uploadFileToS3(BUCKET, fileName,PATH )


 const rekognitionParams = {
    Image: {
      S3Object: {
        Bucket: BUCKET,
        Name: fileName,
      },
    },
    MaxLabels: 10,
    MinConfidence: 50,
  };

 rekognition.detectLabels(rekognitionParams, (rekognitionErr, rekognitionData) => {
    if (rekognitionErr) {
      console.error('Error detecting labels:', rekognitionErr);
      res.status(500).json({ success: false, message: 'Error detecting labels' });
    } else {
      console.log('Detected labels:', rekognitionData.Labels);
      res.status(200).json({ success: true, message: 'Upload and label detection successful', labels: rekognitionData.Labels });
    }
  });

});

app.listen(5000, () => {
  console.log('Server started on port 5000');
});
