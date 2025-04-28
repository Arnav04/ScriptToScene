import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useState } from "react";
import "./App.css";
import { GoogleGenAI, Modality } from "@google/genai";

import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

// Load environment variables
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const App = ({ addOnUISdk, sandboxProxy }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");

    async function handleClick() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.click();

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            setIsLoading(true);
            setUploadStatus("Uploading PDF...");
            console.log("Uploading file:", file.name);

            // Prepare FormData
            const formData = new FormData();
            formData.append('pdf', file);

            try {
                // Replace this URL with your ngrok URL or deployed server URL
                const response = await fetch('https://ea2b-129-210-115-231.ngrok-free.app/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const parsedJson = await response.json();
                console.log("Parsed instructions array:", parsedJson);

                // Now you have your parsed instructions array
                // You can use it however you want!
                console.log("Sandbox proxy is:", sandboxProxy);
                const instructions = parsedJson.recipe.instructions;
                
                setUploadStatus(`Processing ${instructions.length} instructions...`);
                
                for (let i = 0; i < instructions.length; i++) {
                    setUploadStatus(`Processing step ${i+1} of ${instructions.length}...`);
                    
                    const instructionText = instructions[i];
                    // const instruction = typeof instructionText === "string" ? instructionText : JSON.stringify(instructionText);
                    const instruction = typeof instructionText === "string" ? instructionText : instructionText.description;

                    await sandboxProxy.createTextElement({
                        content: String(instruction),
                        bounds: {
                            x: 1080,
                            y: 150 + i * 950, // Move each instruction lower down
                            width: 300,
                            height: 1000,
                        },
                        style: {
                            fontFamily: "Adobe Clean",     // (you can change this)
                            fontSize: 16,                  // 🔥 14 pt font (smaller)
                            textAlign: "right",              // "left", "center", or "right"
                            fill: {
                                red: 1,
                                green: 0,
                                blue: 0,
                                alpha: 1
                            }
                        }
                    });

                    //image generation
                    setUploadStatus(`Generating image for step ${i+1}...`);
                    const base64Image = await generateImage(instruction);
                    console.log("Base64 image:", base64Image);
                    
                    setUploadStatus(`Uploading image for step ${i+1}...`);
                    const uploadedImageUrl = await uploadToImgbb(base64Image);

                    if (uploadedImageUrl) {
                        const response = await fetch(uploadedImageUrl);
                        const blob = await response.blob();
                    
                        await addOnUISdk.ready;
                        await addOnUISdk.app.document.addImage(blob, {
                            title: "Step Image",
                            author: "Your App",
                        });
                    }

                    // Optionally wait a little between creations (for smoother UI)
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
                
                setUploadStatus("All steps completed successfully!");
                
            } catch (error) {
                console.error("Error uploading PDF:", error);
                setUploadStatus(`Error: ${error.message}`);
            } finally {
                setIsLoading(false);
            }

            console.log("done")
        };
    }

    async function uploadToImgbb(base64Image) {
        const formData = new FormData();
        formData.append('image', base64Image.split(',')[1]); // Remove "data:image/png;base64,"
    
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
    
        const result = await response.json();
        console.log("Imgbb upload result:", result);
    
        if (result.success) {
            return result.data.url;  // <-- ✅ This is the PUBLIC URL you can use
        } else {
            throw new Error('Failed to upload image');
        }
    }
    
    async function generateImage(instruction) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`;
      
        const payload = {
          contents: [{
            role: "user",
            parts: [{
              text: `Create a visual representation of this instruction without text and make one image for each step only: ${instruction}`
            }]
          }],
          generationConfig: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          }
        };
      
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
      
          const result = await response.json();
          console.log("Gemini RAW RESPONSE:", result);
      
          const parts = result?.candidates?.[0]?.content?.parts;
          if (parts && parts.length > 0) {
            const imageData = parts[0]?.inlineData?.data;
            if (imageData) {
              const imageUrl = `data:image/png;base64,${imageData}`;
              return imageUrl;
            }
          }
      
          console.error("No image found.");
          return null;
      
        } catch (error) {
          console.error("Error generating image:", error);
          return null;
        }
      }

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="container">
                <div className="header">
                    <h1 className="title">Script-to-Scene</h1>
                    <p className="description">
                        Transform confusing instructions into clear visual aids with AI-generated imagery.
                        Upload your PDF recipe or instructions and watch them come to life!
                    </p>
                </div>
                
                <div className="upload-section">
                    <Button size="m" variant="cta" onClick={handleClick} disabled={isLoading}>
                        Upload PDF Instructions
                    </Button>
                    
                    {isLoading && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>{uploadStatus}</p>
                        </div>
                    )}
                </div>
                
                <div className="info-section">
                    <h2>How it works:</h2>
                    <ol>
                        <li>Upload your PDF with instructions or recipe steps</li>
                        <li>Our AI extracts and processes each step</li>
                        <li>Visual aids are generated for each instruction</li>
                        <li>Everything is placed on your canvas automatically</li>
                    </ol>
                </div>
            </div>
        </Theme>
    );
};

export default App;
