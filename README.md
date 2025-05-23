# Typocut: Generative Typography Tool

Typocut is an interactive tool that mixes collages, typography and randomness. Born from a passion for collage and creative coding, it produces typographic designs with noise, randomized image masking and configurable gradients. 

Try it at [typocut.online](https://typocut.online)
(or [https://anyaepie.github.io/typo-cut/](https://anyaepie.github.io/typo-cut/)) 

![Interface](og-image.png)

Created as a capstone project for [Werkstatt Creative Coding course](https://werkstatt.school/creative-coding), Typocut explores how analogue could be emulated by digital and then converted back to analogue.

There are three choices for letters: 

- “Typocut Default“ is when letters are built using strict 3x3 grid with primitives (rectange, triangle, cut-out rectangles, half-circles) that are flipped & rotated and distorted with noise, combining pixel and parametric fonts feel.

- “Buiilt-in Fonts“ is an array of eight free (both commercial and personal use) fonts that I find aesthetically pleasing for cut-outs needs, you can check out fonts in the fonts folder or by clicking About link on the website.

- “User Fonts“ (you can upload up to 10) is an array of user-uploaded fonts that are used in a similar fashion to built-in fonts (randomly assigned). I recommend to test the tool with [Cut Out The Jams](https://www.behance.net/gallery/12330303/Cut-Out-The-Jams-A-Free-Font)(free for personal, student and non-profit use).

Check out additional details about the process [here](https://www.mixedmeanings.lol/code/typo-cut) and my other creative coding projects at [mixedmeanings.lol/code](https://www.mixedmeanings.lol/code).

## Table of Contents
- [Inspiration](#inspiration)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
  - [Core Files](#core-files)
  - [Image Management](#image-management)
  - [Letter Management & Rendering](#letter-management--rendering)
  - [User Interface & Interaction](#user-interface--interaction)
  - [Export Features](#export-features)
- [Application Flow](#application-flow)
- [Where I've had the most fun](#where-ive-had-the-most-fun)
  - [Consistent Random Noise with Seeds](#consistent-random-noise-with-seeds)
  - [Mask Inversion System](#mask-inversion-system)
  - [Hidden File Upload Implementation](#hidden-file-upload-implementation)
  - [Primitive Drawing Reuse](#primitive-drawing-reuse)
  - [A4 Sticker Sheet Letter Distribution Algorithm](#a4-sticker-sheet-letter-distribution-algorithm)
- [Technical Debt](#technical-debt)
  - [Crisp Cut-outs](#crisp-cut-outs)
  - [Duplicate Masking Functions](#duplicate-masking-functions)
- [AI-Assisted Development](#ai-assisted-development)
- [Contacts](#contacts)

## Inspiration

Notable [Coding Train](https://thecodingtrain.com/) tutorials leveraged in this project include:
- [masking images](https://www.youtube.com/watch?v=V-8FE_IQONY)
- [uploading images](https://www.youtube.com/watch?v=rO6M5hj0V-o)
- [hosting p5js on github pages](https://www.youtube.com/watch?v=ZneWjyn18e8)
- [instance mode](https://www.youtube.com/watch?v=Su792jEauZg) - after watching this video I decided not to go there :)

GUI is created using [lil-gui](https://lil-gui.georgealways.com/#) by [George Michael Brower](https://georgealways.com/).

## Key Features

<div align="center">
    
![Demo](quickdemo.gif)

*(quick demo gif - click on the file to watch the animation if not working automatically)*

</div>

The user can type their own text (note the dynamically calculated character limit depending on the canvas size, letter size and line spacing). Direct cut-out is applied by default, yet the user can choose the inverted mask, when the letters are cut-out from the underlying rectangles.

Letters can be repositioned with a mouse and saved as transparent PNG.

Cutting out letters from the gradients is a default option, gradients could be configured in the GUI. To use custom images, the user needs to upload the images first (not more than 15, JPG, JPEG, PNG each less than 2MB) and chose "Uploaded Images" in the dropdown menu.

A4 alphabet sheet can be previewed and saved as PNG separately, with letter configuration picked up from the main screen. The alphabet letter quantities are defined based on the standard frequency distribution for the English alphabet ([wiki](https://en.wikipedia.org/wiki/Letter_frequency)). Saved transparent PNG could be used to print out the sticker sheet.

## Architecture Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#ff0000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#ffffff' }}}%%
graph LR
    Setup[Setup Canvas] --> GUI[Initialize GUI] --> Fonts[Load Fonts] --> Images[Load/Generate Images] --> Letters[Create Letter Objects] --> Draw[Draw to Canvas]
    User[User Interaction] --> |Text/Parameters| GUI
    User --> |Mouse/Keyboard| Letters
    User --> |Upload Images| Images
    User --> |Upload Fonts| Fonts
    Draw --> Export[Export PNG/Sticker Sheet]
    Letters --> |Font Selection| Draw
    Fonts --> |Built-in/Uploaded| Letters
    
    classDef flow fill:#e8daef,stroke:#333,stroke-width:1px;
    classDef user fill:#d5f5e3,stroke:#333,stroke-width:1px;
    classDef output fill:#fdebd0,stroke:#333,stroke-width:1px;
    
    class Setup,GUI,Images,Fonts,Letters,Draw flow;
    class User user;
    class Export output;
```
Typocut is built with p5.js (single sketch - for multiple sketches running in parallel you can explore "instance mode", but I didn't) and follows a modular design pattern, here are the modules at a glance:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#ff0000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#ffffff' }}}%%
graph TB
    %% Core Components
    subgraph Core[Core Components]
        direction LR
        Constants[Constants.js\nGlobal variables] -.-> CoreFunctions[CoreFunctions.js\nUtility functions]
        Sketch[sketch.js\nInitialization & loop]
    end
    
    %% Image Processing
    subgraph Image[Image Handling]
        direction TB
        ImgHandling[ImageHandling.js] --> Gradients[Create gradients]
        ImgHandling --> ProcessUploads[Process images]
        FileHandling[FileHandling.js] --> FileInput[Hidden file input]
        FileHandling --> SaveOutput[Save PNG]
    end
    
    %% Font Processing
    subgraph Font[Font Handling]
        direction TB
        FontHandling[FontHandling.js] --> LoadFonts[Load built-in fonts]
        FontHandling --> ProcessFonts[Process uploaded fonts]
        FontHandling --> FontInput[Hidden font input]
    end
    
    %% Letter Processing 
    subgraph Letter[Letter Processing]
        direction TB
        LetterObj[LetterObject.js] --> Properties[Position & dimensions]
        LetterRender[LetterRendering.js] --> LetterDef[Letter definitions]
        LetterRender --> Masking[Pixel masking]
        LetterManage[LetterManagement.js] --> Layout[Calculate layout]
        LetterMaskDraw[LetterDrawWithMask.js] --> CanvasMasking[Canvas rendering]
        LetterBufferDraw[LetterDrawWithMaskOnBuffer.js] --> BufferMasking[Buffer rendering]
    end
    
    %% User Interaction
    subgraph UI[User Interface]
        direction TB
        GUISetup[GUI.js] --> Controls[Parameter controls]
        GUISetup --> SourceType[Image source toggle]
        GUISetup --> FontType[Font type toggle]
        Interaction[InteractionHandlers.js] --> Mouse[Drag letters]
    end
    
    %% Export Features
    subgraph Export[Export Features]
        direction TB
        Sticker[StickerSheet.js] --> Distribution[Letter distribution]
        Sticker --> SaveSheet[Save sticker sheet]
    end
    
    %% Connections between components
    Constants -.-> All[All modules]
    Core --> Image
    Core --> Font
    Core --> Letter
    Core --> UI
    Core --> Export
    GUISetup --> ImgHandling
    GUISetup --> FontHandling
    Interaction --> LetterManage
    LetterObj --> LetterRender
    LetterObj --> LetterMaskDraw
    LetterRender --> LetterMaskDraw
    LetterRender --> LetterBufferDraw
    FontHandling --> LetterObj
    ImgHandling --> LetterManage
    FileHandling --> ImgHandling
    FileHandling --> FontHandling
    LetterManage --> Sticker
    LetterBufferDraw --> SaveOutput
    LetterBufferDraw --> SaveSheet
    
    classDef core fill:#f9d5e5,stroke:#000000,stroke-width:1px,color:#000000;
    classDef image fill:#e6f2ff,stroke:#000000,stroke-width:1px,color:#000000;
    classDef font fill:#fce2c4,stroke:#000000,stroke-width:1px,color:#000000;
    classDef letter fill:#d3f0ee,stroke:#000000,stroke-width:1px,color:#000000;
    classDef ui fill:#d5f5e3,stroke:#000000,stroke-width:1px,color:#000000;
    classDef export fill:#fdebd0,stroke:#000000,stroke-width:1px,color:#000000;
    classDef default fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000;
    
    class Constants,CoreFunctions,Sketch,Core core;
    class ImgHandling,FileHandling,Gradients,ProcessUploads,FileInput,SaveOutput,Image image;
    class FontHandling,LoadFonts,ProcessFonts,FontInput,Font font;
    class LetterObj,LetterRender,LetterManage,LetterMaskDraw,LetterBufferDraw,Properties,LetterDef,Masking,Layout,CanvasMasking,BufferMasking,Letter letter;
    class GUISetup,Interaction,Controls,SourceType,FontType,Mouse,UI ui;
    class Sticker,Distribution,SaveSheet,Export export;
```
Here's how the main components work together:

## Project Structure

### Core Files
* **Constants.js**: Contains global settings, state variables, and utility functions used throughout the application.
* **sketch.js**: The main p5.js sketch file that initializes the canvas and handles the drawing loop.
* **CoreFunctions.js**: Houses utility functions for calculating layout and debugging image sources.

### Image Management
* **ImageHandling.js**: Responsible for creating gradient placeholders and processing uploaded images.
* **FileHandling.js**: Handles file uploads, input setup, and saving PNG output.

### Font Management
* **FontHandling.js**: Manages both built-in and user-uploaded fonts, including loading, validation, and registration.

### Letter Management & Rendering
* **LetterObject.js**: Class definition for letter objects with positioning, dimensions, rendering properties, and font assignments.
* **LetterRendering.js**: Contains letter definitions as cell codes and primitive drawing functions.
* **LetterDrawWithMask.js**: Handles the main rendering process for letters on the canvas with masking effects.
* **LetterDrawWithMaskOnBuffer.js**: Specialized version for drawing to offscreen buffers (used for exports).
* **LetterManagement.js**: Handles creating, updating, and organizing letter objects on the canvas.

### User Interface & Interaction
* **GUI.js**: Sets up the control panel using lil-gui library and manages GUI state, including font type dropdown.
* **InteractionHandlers.js**: Manages mouse and keyboard interactions for manipulating letters.

### Export Features
* **StickerSheet.js**: Handles generating sticker sheets for printing on A4 paper.

## Application Flow

1. **Initialization**:
   * Canvas setup in the browser window
   * Loading of built-in fonts from the fonts directory
   * GUI controls initialization
   * Initial gradient images are generated
   * Letter objects created based on default text

2. **User Interaction Loop**:
   * User inputs text or modifies parameters via GUI
   * User can upload custom images and fonts
   * Letters are updated with new parameters
   * Mouse interaction allows for direct manipulation of letter positions
   * Image source can be toggled between gradients and uploaded files
   * Font type can be switched between Typocut Default, Built-in Fonts, and Uploaded Fonts

3. **Rendering Process**:
   * Each letter is rendered using either primitive shapes or font glyphs depending on the selected font type
   * Images are applied through masking technique
   * Random noise is applied to letter shapes and font characters for visual interest
   * Canvas is redrawn when parameters change
   * Each letter maintains its individual image section, noise seed, and font assignment

4. **Export Options**:
   * Export as PNG with current layout
   * Generate A4 sticker sheet with optimized letter distribution
   * Exports preserve all styling, masking, and font choices

## Where I've had the most fun

### Consistent Random Noise with Seeds

Each letter is an object that maintains its unique distortion pattern using a technique called "seeded randomness." Every letter stores its own `noiseSeed` value that gets applied before calling any function that draws a letter:

```javascript
randomSeed(this.noiseSeed);
```
This ensures that when I reposition letters, adjust parameters, or export design, each letter's unique "character" stays consistent rather than regenerating with every frame. It's like giving each letter its own DNA that controls how randomness affects its shape - making your designs reproducible and stable while still maintaining that handcrafted aesthetic.

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

I didn't like  the look of the system upload file button, so a hidden file input element is triggered by a (nicely looking) GUI button, providing a seamless user experience while maintaining full control over the upload process:

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

Overall, each letter is defined by a sequence of the predefined codes in a 3×3 grid, allowing for complex letter shapes with minimal definition data. 

When prototyping, I initially wrote all primitive drawing functions independently, yet after refactored into four patterns (half-arc, rectangle, rectangle with a triangle cut-out, rectangle with a half-arc cut-out, traingle). Functions intake rotation, noise (defined globally, per letter), flipping.

As letter's width and height are independent, I switch length and width for rectangles with the half-circle cut-out, if they are rotated 90 degrees. 
Noise calculations for all the primitives aim to make outer dimensions of the primitives bigger/smaller without impacting the inner pars to avoid holes as I didn't like the effect.

A simple broker function converts each letter definition into a relevant primitive drawing function:

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

## Where I've had the most fun (2) - tackling meaningful technical debt & introducing new features

### Crisp Cut-outs
My initial hypothesis for the rough edges on the cut-outs was the fact that instead of standart mask() function I've used direct pixel manipulation:

```javascript
// From LetterRendering.js - previous version
// Apply Manual Mask via Pixel Manipulation
letterMask.loadPixels();
resultSection.loadPixels();

for (let i = 0; i < letterMask.pixels.length; i += 4) {
    let maskValue = letterMask.pixels[i]; // Mask brightness (0 or 255)
    resultSection.pixels[i]     = imgSection.pixels[i];
    resultSection.pixels[i + 1] = imgSection.pixels[i + 1];
    resultSection.pixels[i + 2] = imgSection.pixels[i + 2];
    resultSection.pixels[i + 3] = maskValue; // Alpha from mask
}
resultSection.updatePixels();
```
In the end, the issue was in pixelDensity which I needed to meticolously correct throughout the code to ensure that the masks and underlying images are of the same size. Additionally, I later decided to introduce greater pixel density for saving needs as I just wanted that extra-crispiness for the outputs:
![Before and After Pixel Density Changes](before-after-pixel-density.png)

### New fonts
Adding bult-in fonts and providing an option for the user to upload theirs has been made possible by re-use of logic I've introduced for images (hidden upload system button, storing files in memory), re-using conditional hide/show for the images sub-menus and introducing decision forks in both masking functions.

![Impact of Legacy letter box on other fonts](legacy-letter-box-fonts-impact.png)

The drawback of this late addition is that I'm re-using letter grid size as a container (as then all the line, and sticker calculations will be preserved) and the font size would is decided dynamically to fit each letter inside that container.

## Moving forward

There are multiple areas that could be done in a more scalable way (ditching global variables -> encapsulating related stated into objects; externalising error handling to be visible to the user; using enum or something else for more descriptive letter mapping; better separation of concerns). Additionally, after increasing pixelDensity, the tool became slower - and performance optimisation is always a possibility. I don't know yet if I have the discipline needed to work on these, but let's see!

### Duplicate Masking Functions
The codebase currently contains two nearly identical functions for letter masking: drawLetterWithMask and drawLetterWithMaskOnBuffer. This duplication occurred during feature expansion - the original function handled on-screen rendering, while the second was added to support rendering to offscreen buffers for PNG exports and sticker sheets (as I didn't want to lose the progress with the first function and I was working in p5js, so no versioning and branches).

A cleaner approach would be a unified function with a target parameter with an extra-function responsible for drawing the canvas (as the original one draws letter by letter and the on-buffer draws on the canvas):
```javascript
function drawLetterWithMask(char, x, y, cw, ch, imageIndex, imageSectionPos, inverted, targetBuffer = null) {
  // Use targetBuffer if provided, otherwise use main canvas
  const target = targetBuffer || window;  // Use window/global context for main canvas
  
  // Same masking logic but use target for drawing operations
}
```
While I initially planned to tackle this after solving pixelDensity issue, I've decided to add a new feature - built-in and user uploaded fonts and decided not to work on code duplication, it's a pet project after all. Maybe I come back to it later if the new features would strongly call for that.
 
## AI-Assisted Development

This is [p5js framework](https://p5js.org/) port from the original [Processing Java](https://processing.org/) code I've developed locally by combining several homework assignments from the course. 

I've used [Google Gemini 2.5 @ Google AI studio](https://aistudio.google.com) with 1M tokens [long context](https://cloud.google.com/vertex-ai/generative-ai/docs/long-context) to conduct the port from Processing Java into p5js. This model was used mainly because of the longest context window available at the market for free (ha-ha!) at that point of time and the fact that I was aiming mainly for syntaxis-only changes.

NB! I've used "chain of thought"-like approach to work with Gemini:
- asked the model to analyse the code and outline the code flow as it sees it and ask any questions that are not clear
- confirmed the flow understanding from my side, asked how the code structure could look like, aiming for readability, [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and clear "blast radius" for code changes, providing context that it's: a) a capstone project, b) some functionality is yet to be developed (with examples); c) the finar result will be hosted on GitHub Pages; d) I know nothing about front-end and not willing to invest in that now.
- iterated on the code structure, and updated project documents and overall system prompts with the agreed context when was satisfied to bring the model to the final context
- asked the model to start converting the code from Processing Java to P5JS as per agreed code structure, file by file, without changing any logic, just the syntaxis and provide me both the new code file and explanation of the changes introduced so I can monitor. My "rule of thumb" was to have 250 lines or less per file.

I manually copied code files converted by the model to p5js.org to keep iterating on gui and file upload. Alternative option was to copy all files on github, sync the repo locally and use VSCode + Copilot to keep iterating, yet I really liked ability to quickly iterate (save-play-stop) available through web-intefrace on p5js.org.

Website (index.html) is responsibly (?) vibe-coded with Claude 3.7 (and cross evaluated with Gemini) as I'm an absolute noob when it comes to front-end.

This documentation, especially diagramms are produced by Claude based on the code files uploaded and edited by hand after.

## Contacts

You can contact me on [LinkedIn](https://www.linkedin.com/in/epanya/) or through the [contacts form on my website](https://www.mixedmeanings.lol/contact)
