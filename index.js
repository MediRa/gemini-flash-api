const express = require('express');
const dotenv = require('dotenv');

const multer = require('multer');

const fs = require('fs');
const path = require('path');

const { GoogleGenerativeAI} = require('@google/generative-ai');
const imageToGenerativePart = require('@google/generative-ai');

dotenv.config();
const app = express();
app.use(express.json());

// Get the ai Model
const GenAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2_0_FLASH)
const model = GenAi.getGenerativeModel({
    model:'models/gemini-2.0-flash'
});

const upload = multer({dest: 'uploads/'});
const PORT = 3000;

app.listen(PORT, ()=> {
    console.log(`Gemini api server running at http://localhost:${PORT}`);
});

//add endpoint to generate text
app.post('/generate-text', async (req, res) => {
    const {prompt} = req.body;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;

        res.json({output: response.text()})
    } catch (error) {
        res.status(500).json(
            {error: error.message}
        );
    }
});

//add endpoint to generate image
app.post('/generate-from-image', upload.single('image'), async(req, res) => {
    const {prompt} = req.body.prompt || 'Describe the image';
    const image = imageToGenerativePart(req.file.path);

    try {
        const result = await model.generateContent([prompt, image]);
        const response = await result.response;
        res.json({output: response.text()});
    } catch (error) {
        res.status(500).json({error: error.message});
    } finally {
        fs.unlinkSync(req.file.path);
    }
});


// // add endpoint to generate document
app.post('/generate-audio'), upload.single('document'), async (req, res) => {
    const filepath = req.file.path;
    const buffer = fs.readFileSync(filepath);
    const base64Data = buffer.toString('base64');
    const mimeType = req.file.mimeType;

    try {
        const documentPart = {
            inlineData : { data: base64Data, mimeType}
        }

        const result = await model.generateContent([
            "Analyze the document",
            documentPart
        ]);

        const response = await result.response;
        res.json({output: response.text()});
    } catch (error) {
        res.status(500).json({error: error.message});
    } finally {
        fs.unlinkSync(filepath);
    }
}

