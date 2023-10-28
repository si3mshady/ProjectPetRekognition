const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const app = express();
const bodyParser = require('body-parser')
const cors = require('cors'); // Import the cors middleware

app.use(bodyParser.json())
app.use(cors());



app.post('/upload', (req, res) => {
 console.log(req.body)
});

app.listen(5000, () => {
  console.log('Server started on port 5000');
});
