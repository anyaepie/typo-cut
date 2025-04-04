// File handling functions for Typocut

// Function to create or get the hidden file input element (reset every time when a bunch of images is uploaded)
function setupFileInput() {
  // Remove any existing file input
  if (fileInputElement) {
    fileInputElement.remove();
  }
  
  // Create a new native file input
  fileInputElement = document.createElement('input');
  fileInputElement.type = 'file';
  fileInputElement.multiple = true; // Enable multiple file selection
  fileInputElement.accept = 'image/jpeg,image/png,image/jpg'; // Restrict to image types
  fileInputElement.style.position = 'absolute';
  fileInputElement.style.top = '-1000px'; // Position off-screen
  fileInputElement.style.opacity = '0';
  fileInputElement.style.pointerEvents = 'none';
  
  // Add to the document body
  document.body.appendChild(fileInputElement);
  
  // Set up the change event handler
  fileInputElement.onchange = function(event) {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      console.log(`Selected ${files.length} files`);
      
      // Convert FileList to array
      const filesArray = Array.from(files);
      
      // Process files
      handleImageUpload(filesArray);
    } else {
      console.warn("No files were selected");
    }
  };
  
  return fileInputElement;
}

// Function to handle the upload button click
function uploadImagesClicked() {
  console.log("Upload images button clicked");
  
  // Make sure we have a file input element
  if (!fileInputElement) {
    setupFileInput();
  }
  
  // Trigger the file dialog
  if (fileInputElement) {
    fileInputElement.click();
  } else {
    console.error("Could not create file input element");
  }
}

// Initialize file input on page load
function initializeFileInput() {
  setupFileInput();
}

// Function to save the current canvas as a PNG
function savePNG() {
    // Create a temporary graphics buffer
    let buffer = createGraphics(width, height);
    if (!buffer) { 
        console.error("Failed to create buffer for PNG saving."); 
        return; 
    }
    buffer.pixelDensity(2); // Set same pixel density as main sketch
    buffer.smooth(); // Enable antialiasing for sharper edges
    buffer.clear();

    // Redraw letters onto the buffer
    for (let letter of letters) {
        // Set seed for consistent rendering
        randomSeed(letter.noiseSeed);
        
        // Call buffer-drawing function
        drawLetterWithMaskOnBuffer(
            buffer,
            letter.character, letter.x, letter.y,
            letter.cellWidth, letter.cellHeight,
            letter.imageIndex, letter.imageSectionPos,
            isInvertedMask
        );
    }

    // Generate timestamp for unique filename
    let timestamp = `${year()}${nf(month(), 2)}${nf(day(), 2)}_${nf(hour(), 2)}${nf(minute(), 2)}${nf(second(), 2)}`;
    let filename = `typocut_${timestamp}.png`;
    
    // Save the buffer
    save(buffer, filename);
    console.log("Saved PNG:", filename);
    
    // Remove the temporary buffer
    buffer.remove();
}
