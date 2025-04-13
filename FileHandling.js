// File handling functions for Typocut
// --- Global Variables for File Inputs (Keep these outside functions) ---
let imageFileInputElement = null; // For image uploads

// --- Image Upload Input Setup ---

/**
 * Creates or gets the hidden file input element for IMAGE uploads.
 * Assigns handleImageUpload to its change event.
 */
function setupImageFileInput() { // Renamed for clarity
  // Remove any existing IMAGE file input
  if (imageFileInputElement) {
    imageFileInputElement.remove();
  }

  // Create a new native file input for IMAGES
  imageFileInputElement = document.createElement('input');
  imageFileInputElement.type = 'file';
  imageFileInputElement.multiple = true; // Enable multiple file selection
  imageFileInputElement.accept = 'image/jpeg,image/png,image/jpg'; // Restrict to image types
  imageFileInputElement.style.position = 'absolute';
  imageFileInputElement.style.left = '-10000px'; // Position off-screen reliably
  imageFileInputElement.style.top = '-10000px';
  imageFileInputElement.style.zIndex = '-1';
  imageFileInputElement.id = 'imageUploadInput'; // Assign ID

  document.body.appendChild(imageFileInputElement);
  console.log("Created hidden image input.");

  // Set up the change event handler for IMAGES
  imageFileInputElement.onchange = function(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log(`Selected ${files.length} image files`);
      const filesArray = Array.from(files);
      // *** Make sure handleImageUpload is defined elsewhere and accepts filesArray ***
      if (typeof handleImageUpload === 'function') {
           handleImageUpload(filesArray); // Call IMAGE handler
      } else {
           console.error("handleImageUpload function is not defined!");
      }
    } else {
      console.warn("No image files were selected");
    }
    // event.target.value = null; // Optional reset
  };

  return imageFileInputElement;
}

// --- Font Upload Input Setup ---

/**
 * Creates or gets the hidden file input element for FONT uploads.
 * Assigns handleFontUpload to its change event.
 */
function setupFontFileInput() { // NEW function for fonts
  // Remove any existing FONT file input
  if (fontFileInputElement) {
    fontFileInputElement.remove();
  }

  // Create a new native file input for FONTS
  fontFileInputElement = document.createElement('input');
  fontFileInputElement.type = 'file';
  fontFileInputElement.multiple = true; // Enable multiple file selection
  fontFileInputElement.accept = '.ttf,.otf'; // Restrict to FONT types
  fontFileInputElement.style.position = 'absolute';
  fontFileInputElement.style.left = '-10000px'; // Position off-screen reliably
  fontFileInputElement.style.top = '-10000px';
  fontFileInputElement.style.zIndex = '-1';
  fontFileInputElement.id = 'fontUploadInput'; // Assign ID

  document.body.appendChild(fontFileInputElement);
  console.log("Created hidden font input.");

  // Set up the change event handler for FONTS
  fontFileInputElement.onchange = function(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log(`Selected ${files.length} font files`);
      const filesArray = Array.from(files);
      // *** Calls the font handler function below ***
      handleFontUpload(filesArray); // Call FONT handler
    } else {
      console.warn("No font files were selected");
    }
     // event.target.value = null; // Optional reset
  };

  return fontFileInputElement;
}


// --- Click Handlers (Trigger hidden inputs) ---

/**
 * Finds and clicks the hidden IMAGE file input.
 */
function uploadImagesClicked() { // Your existing function name
  console.log("Upload images button clicked");
  if (!imageFileInputElement) {
    setupImageFileInput(); // Ensure it exists
  }
  if (imageFileInputElement) {
    imageFileInputElement.click();
  } else {
    console.error("Could not create/find image file input element");
  }
}

/**
 * Finds and clicks the hidden FONT file input.
 */
function uploadFontsClicked() { // NEW function name for clarity
  console.log("Upload fonts button clicked");
  if (!fontFileInputElement) {
    setupFontFileInput(); // Ensure it exists
  }
  if (fontFileInputElement) {
    fontFileInputElement.click();
  } else {
    console.error("Could not create/find font file input element");
  }
}

/**
 * Initializes both hidden file input elements.
 */
function initializeFileInputs() { // Renamed
  setupImageFileInput(); // Setup the image input
  setupFontFileInput();  // Setup the font input
}



// --- PNG Saving Function (Keep your existing savePNG function as is) ---
function savePNG() {
    statusMessage='Saving Canvas PNG....';
    // Create a temporary graphics buffer
    let buffer = createGraphics(width, height);
    if (!buffer) { console.error("Failed to create buffer for PNG saving."); return; }
    buffer.pixelDensity(savingPixelDensity); // Keep your settings
    buffer.smooth();
    buffer.clear(); // Use clear for transparency

    // Redraw letters onto the buffer
    for (let letter of letters) {
        randomSeed(letter.noiseSeed);

        // --- Determine fontToUse based on global fontType and letter ---
        let fontToUse = null;
        if (fontType === 'Built-in Fonts') {
            fontToUse = letter.assignedExistingFont;
        } else if (fontType === 'Uploaded Fonts') {
            fontToUse = letter.assignedUploadedFont;
        }

        // --- Call buffer-drawing function WITH new params ---
        drawLetterWithMaskOnBuffer( // Assuming this is the correct function name
            buffer,
            letter.character, letter.x, letter.y,
            letter.cellWidth, letter.cellHeight,
            letter.imageIndex, letter.imageSectionPos,
            isInvertedMask,
            // Pass font parameters
            fontType,
            fontToUse
        );
    }

    let timestamp = `${year()}${nf(month(), 2)}${nf(day(), 2)}_${nf(hour(), 2)}${nf(minute(), 2)}${nf(second(), 2)}`;
    let filename = `typocut_${timestamp}.png`;
    save(buffer, filename);
    console.log("Saved PNG:", filename);
    buffer.remove();
  setTimeout(() => { 
                statusMessage = ''; 
                redraw();
            }, 1300);
}