import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";


// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start() {
    // APIs to be exposed to the UI runtime
    // i.e., to the `index.html` file of this add-on.
    const sandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();

            // Define rectangle dimensions.
            rectangle.width = 240;
            rectangle.height = 180;

            // Define rectangle position.
            rectangle.translation = { x: 10, y: 10 };

            // Define rectangle color.
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };

            // Fill the rectangle with the color.
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Add the rectangle to the document.
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        // createTextElement: async ({ content, bounds, style }) => {
        //     console.log("Creating text element with content:", content);
        
        //     const text = await editor.createText();
        
        //     await editor.queueAsyncEdit(() => {
        //         // text.text = content ?? "Default Text";
        //         text.fullContent.text = String(content ?? "Default Text");
        //         text.width = bounds?.width ?? 300;
        //         text.height = bounds?.height ?? 100;
        //         text.translation = {
        //             x: bounds?.x ?? 50,
        //             y: bounds?.y ?? 50
        //         };

        //         // ✅ Now add font styles
        //         text.fontFamily = style?.fontFamily ?? "Adobe Clean";
        //         text.fontSize = style?.fontSize ?? 10;  // 🔥 SMALLER FONT (default 18pt)
        //         text.textAlign = style?.textAlign ?? "center";

        //         if (style?.fill) {
        //             const fillBrush = editor.makeColorFill(style.fill);
        //             text.fill = fillBrush;
        //         }

        
        //         editor.context.insertionParent.children.append(text);
        //     });
        // },
        createTextElement: async ({ content, bounds, style }) => {
            console.log("Creating text element with content:", content);
        
            await editor.queueAsyncEdit(() => {
                // Create a new text node
                const textNode = editor.createText();
                textNode.fullContent.text = String(content ?? "Default Text");
        
                // Apply font styles directly
                textNode.fullContent.applyCharacterStyles({fontSize: 56,
                    fontFamily: "Adobe Clean",
                    textAlign: "right",
                });
        
                // Set position and size
                textNode.translation = {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                };
                // textNode.bounds = {
                //     width: 100,
                //     height: 100,
                // };

                // Set fill (color) if provided
                if (style?.fill) {
                    const fillBrush = editor.makeColorFill(style.fill);
                    textNode.fill = fillBrush;
                }
        
                // Append to the current insertion parent (current page)
                editor.context.insertionParent.children.append(textNode);
            });
        }
          
        
        
        
    };



    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
