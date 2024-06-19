// Express server
import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import * as qrcode from 'qrcode';
import { configDotenv } from 'dotenv';
configDotenv();
const app = express();
app.use(cors());
app.use(express.json());

const connect = mysql.createConnection({
  host:process.env.DB_HOST,
  user:process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connect.connect((err) => {
  if (!err) {
    console.log('db connection successful');
  }
});

app.post('/generate', (req, res) => {
    const { data } = req.body; 
    qrcode.toDataURL(data, (err, url) => {
      if (err) return res.status(500).json({ error: "Error generating QR code" });
  
      const insertQuery = 'INSERT INTO qr_data (data,qrcode) VALUES (?,?)';
      connect.query(insertQuery, [url,data], (insertErr, results) => {
        if (insertErr) {
          console.error("Error inserting data into qr_data table:", insertErr);
          return res.status(500).json({ error: "Database insertion failed" });
        }
        res.json({ qrCode: url });
      });
    });
  });
  
  app.post('/validate', (req, res) => {
    const { qrCodeData } = req.body;
  
    // Perform database lookup/validation here
    const query = 'SELECT * FROM qr_data WHERE qrcode = ?';
    connect.query(query, [qrCodeData], (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).json({ error: "Database query failed" });
      }
  
      if (results.length > 0) {
        // QR code exists in the database
        res.json({ isValid: true });
      } else {
        // QR code not found in the database
        res.json({ isValid: false });
      }
    });
  });

app.listen(3001, () => {
  console.log("server is running");
});
