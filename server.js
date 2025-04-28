// server.js

const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');
const cors = require('cors');
const fetch = require('node-fetch'); 
require('dotenv').config();

const app = express();
const upload = multer();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors()); // Allow CORS so your React frontend can call it

// app.use(express.json());


// Set up OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST endpoint to receive a PDF
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const dataBuffer = req.file.buffer;
    const data = await pdf(dataBuffer);
    const text = data.text;

    const message = `
Respond only with valid JSON (do not include any explanations or extra text).
`;

    const userPrompt = text + message;

    const responseFromAI = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const reply = responseFromAI.choices[0].message.content;
    const parsed = JSON.parse(reply);

    res.json(parsed); // Send parsed JSON array back to the frontend

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

// app.post('/generate-image', async (req, res) => {
//     const OPENAI_API_KEY = 'here'
//     const { instruction } = req.body;

//     try {
//         const response = await fetch('https://api.openai.com/v1/images/generations', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 model: 'dall-e-2',
//                 prompt: `Create a visual representation of this instruction without any text: ${instruction}`,
//                 n: 1,
//                 size: '512x512'
//             })
//         });

//         const result = await response.json();
//         console.log("DALL-E 2 API Response:", result);

//         if (result.data && result.data.length > 0) {
//             res.json({ imageUrl: result.data[0].url });
//         } else {
//             res.status(500).json({ error: "No image returned" });
//         }

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to generate image" });
//     }
// });



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});