# Typocut: Generative Typography Tool

## About

Typocut is an interactive tool that mixes collages, typography and randomness. Born from a passion for collage and creative coding, it creates typographic designs with noise, randomized image masking and configurable gradients. 

Created as a capstone project for the [Werkstatt Creative Coding course](https://werkstatt.school/creative-coding), Typocut explores how analogue could be emulated by digital and then converted back to analogue.

Try it at [typocut.online](https://typocut.online)
(if this one doesn't work, try the direct one at [https://anyaepie.github.io/typo-cut/](https://anyaepie.github.io/typo-cut/)) 

Each letter is a canvas, randomly cropped from configurable gradients or uploaded images, with adjustable noise and style parameters. Letters are built using strict 3x3 grid with primitives (rectange, triangle, cut-out rectangles, half-circles) that are flipped and rotated as needed - all with noise applied, combining pixel and parametric fonts.

Check out my other creative art projects at [mixedmeanings.lol/digital](https://www.mixedmeanings.lol/digital).

## Inspiration

This is [P5JS framework](https://p5js.org/) port from the original Processing code I've worked on locally. I've used [Google Gemini 2.5 @ Google AI studio](https://aistudio.google.com) with 1M tokens [long context](https://cloud.google.com/vertex-ai/generative-ai/docs/long-context) to conduct the port from Processing Java into P5JS. This model was used mainly because of the longest context window available at the market for free and the fact that I was aiming mainly for syntaxis-only changes.

NB! I've used "chain of thought"-like approach to work with Gemini:
- asked the model to analyse the code and outline the code flow as it sees it and ask any questions that are not clear
- confirmed flow understanding from my side, asked how the code structure could look like, aiming for readability, [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and clear "blast radius" for code changes, providing context that it's a capstone project aimed to be hosted on GitHub Pages.
- iterated on the code structure and updated project documents and overall system prompts with the agreed context
-  asked the model to start converting the code from Processing Java to P5JS as agreed code structure, file by file, without changing any logic, just the syntaxis and provide me both the new code file and explanation of the changes introduced so I can monitor

I manually copied code files converted by the model on p5js.org to keep iterating on gui and file upload. Alternative option was to copy all files on github, sync the repo locally and use VSCode to keep iterating, yet I really like ability to quickly iterate (save-play-stop) available through web-intefrace on p5js.org.

GUI is created using [lil-gui](https://lil-gui.georgealways.com/#) by [George Michael Brower](https://georgealways.com/)

Notable [Coding Train](https://thecodingtrain.com/) tutorials leveraged in this project include:
- [masking images](https://www.youtube.com/watch?v=V-8FE_IQONY)
- [uploading images](https://www.youtube.com/watch?v=rO6M5hj0V-o)
- [hosting p5js on github pages](https://www.youtube.com/watch?v=ZneWjyn18e8)
- [instance mode](https://www.youtube.com/watch?v=Su792jEauZg) - after watching this video I decided not to go there :)

## Key Features

The user can type their own text (note that there is a limit of characters dynamically calculated depending on the canvas size, letter size and spacing, line spacing). Direct cut-out is applied by default - the user can choose the inverted mask, when the letters are cut-out from underlying rectangles.

Letters can be repositioned with a mouse and saved as transparent PNG.

Cutting out letters from the gradients is a default option, gradients could be configured in the GUI. To use custom images, the user needs to upload the images first (not more than 15, JPG, JPEG, PNG each less than 2MB) and chose "Uploaded Images" in the dropdown menu.

A4 alphabet sheet can be previewed and saved separately, with letter configuration picked up from the main screen, yet the letter sequence is defined based on the standard frequency distribution for the English alphabet. This transparent PNG could be later printed out to be used for analogue collages.

## Architecture Overview

Typocut is built with p5.js (single sketch - for multiple sketches running in parallel you can explore "instance mode", but I didn't) and follows a modular design pattern. Here's how the main components work together:

### Core Files

- **Constants.js**: Contains global settings, state variables, and utility functions used throughout the application.
- **sketch.js**: The main p5.js sketch file that initializes the canvas and handles the drawing loop.
- **CoreFunctions.js**: Houses utility functions for calculating layout and debugging image sources.

### Image Management

- **ImageHandling.js**: Responsible for creating gradient placeholders and processing uploaded images.
- **FileHandling.js**: Handles file uploads, input setup, and saving PNG output.

### Letter Management & Rendering

- **LetterObject.js**: Class definition for letter objects with positioning, dimensions, and rendering properties.
- **LetterRendering.js**: Contains letter definitions as cell codes and masking/rendering functions.
- **LetterManagement.js**: Handles creating, updating, and organizing letter objects on the canvas.

### User Interface & Interaction

- **GUI.js**: Sets up the control panel using lil-gui library and manages GUI state.
- **InteractionHandlers.js**: Manages mouse and keyboard interactions for manipulating letters.

### Export Features

- **StickerSheet.js**: Handles generating sticker sheets for printing on A4 paper.

## Application Flow

1. **Initialization**:
   - Canvas setup in the browser window
   - GUI controls initialization
   - Initial gradient images are generated
   - Letter objects created based on default text

2. **User Interaction Loop**:
   - User inputs text or modifies parameters via GUI
   - Letters are updated with new parameters
   - Mouse interaction allows for direct manipulation of letter positions
   - Image source can be toggled between gradients and uploaded files

3. **Rendering Process**:
   - Each letter is rendered using its character definition
   - Images are applied through masking technique
   - Random noise is applied to letter shapes for visual interest
   - Canvas is redrawn when parameters change

4. **Export Options**:
   - Export as PNG with current layout
   - Generate A4 sticker sheet with optimized letter distribution

## Where I've had the most fun

### Mask Inversion System

When initially starting with a single (direct) mask, I realised that it would be cool to have an inverse mask. Initially I've wrote two separate functions, yet after seeing almost all the code being repeated, I've introduced a single function with boolean "inverted" parameter:

```javascript
// From LetterRendering.js
function drawLetterWithMask(char, x, y, cw, ch, imageIndex, imageSectionPos, inverted) {
    // ...
    letterMask = createGraphics(totalWidth, totalHeight);
    letterMask.noStroke();
    if (inverted) { 
        letterMask.background(255); letterMask.fill(0);
    } else {
        letterMask.background(0); letterMask.fill(255);
    }
    // ...
}
```

### Hidden File Upload Implementation

I didn't like the system upload file button as it was ruining my fantasy, really. Based on one of the videos referenced above, a hidden file input element is triggered by a (nicely looking) GUI button, providing a seamless user experience while maintaining full control over the upload process:

```javascript
// From FileHandling.js
function setupFileInput() {
  fileInputElement = document.createElement('input');
  fileInputElement.type = 'file';
  fileInputElement.multiple = true;
  fileInputElement.accept = 'image/jpeg,image/png,image/jpg';
  fileInputElement.style.position = 'absolute';
  fileInputElement.style.top = '-1000px'; // Position off-screen
  fileInputElement.style.opacity = '0';
  fileInputElement.style.pointerEvents = 'none';
  document.body.appendChild(fileInputElement);
  
  fileInputElement.onchange = function(event) {
    // Process selected files...
  };
}
```

### Primitive Drawing Reuse

When prototyping, I've initially just wrote all primitive drawing functions as independent, yet after refactored into four patterns (half-arc, rectangle, rectangle with a triangle cut-out, rectangle with a half-arc cut-out, traingle) - all rotated and flipped as needed. As generally letter width and height are independent, I switch lenght and width for rectangles with the half-circle cut-out if needed. Additionally, calculations for all the primitives aim to make outer dimensions of the primitives bigger/smaller without impacting the inner pars to avoid holes (I didn't like that effect).

Overall, each letter is defined by a sequence of these codes in a 3×3 grid, allowing for complex letter shapes with minimal definition data. Many primitives reuse the same drawing functions with different parameters to maximize code efficiency:

```javascript
// From LetterRendering.js
function drawCellPrimitive(code, x, y, w, h, pg) {
    if (code === "00") return;
    let noise = noiseAmount;

    if (code === "01") { drawArcPrimitive(x, y, w, h, noise, 0, pg); }
    else if (code === "02") { drawArcPrimitive(x, y, w, h, noise, PI, pg); }
    else if (code === "10") { drawRectanglePrimitive(x, y, w, h, noise, pg); }
    // ...and so on
}
```

### A4 Sticker Sheet Letter Distribution Algorithm

The sticker sheet generator uses a simple frequency-based algorithm to determine which letters should appear more often based on typical English usage as per [Wikipedia](https://en.wikipedia.org/wiki/Letter_frequency). This ensures that when creating stickers, the most commonly used letters in English appear more frequently, making the sticker set more practical for real-world use:

```javascript
// From StickerSheet.js
function generateLetterSequence(maxLetters) {
    const freqLetters = ["E", "T", "A", "O", "I", "N", "S", "H", "R", "D", "L", "C", "U", "M", "W", "F", "G", "Y", "P", "B", "V", "K", "J", "X", "Q", "Z"];
    const frequency = [12, 9, 8, 8, 7, 7, 6, 6, 6, 4, 4, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1];
    // ...

    // Ensure all letters appear at least once
    let counts = new Array(26).fill(0);
    for (let i = 0; i < 26; i++) counts[i] = 1;
    
    // Distribute remaining slots proportionally to letter frequency
    let remaining = maxLetters - 26;
    // ...

    // Build the final sequence
    let sequence = "";
    for (let i = 0; i < 26; i++) {
        let letter = String.fromCharCode('A'.charCodeAt(0) + i);
        sequence += letter.repeat(counts[i]);
    }
    
    return sequence.substring(0, maxLetters);
}
```


