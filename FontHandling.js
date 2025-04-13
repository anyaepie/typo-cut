// --- FontHandling.js ---

/**
 * Loads fonts listed in the global existingFontFilenames array from the '/fonts' directory.
 * Populates the global existingFontCollection array.
 * MUST be called from within the global preload() function.
 * (Keep this function, but ensure it's called from preload in sketch.js or main file)
 */
function loadFontsFromArray() {
    if (!Array.isArray(existingFontFilenames) || existingFontFilenames.length === 0) {
        console.warn("FontHandling: Global 'existingFontFilenames' array is empty. Cannot load 'Existing' fonts.");
        return;
    }
    console.log(`FontHandling: Attempting to load ${existingFontFilenames.length} 'Existing' fonts...`);
    existingFontCollection = []; // Reset
    for (const filename of existingFontFilenames) {
        if (filename && typeof filename === 'string' && (filename.toLowerCase().endsWith('.ttf') || filename.toLowerCase().endsWith('.otf'))) {
            const filePath = `fonts/${filename}`;
            try {
                let loadedFont = loadFont(filePath); // Call p5's loadFont
                existingFontCollection.push({ name: filename, font: loadedFont });
                console.log(`FontHandling: Registered ${filename}.`);
            } catch (error) {
                console.error(`FontHandling: ERROR loading font from ${filePath}:`, error);
            }
        } else {
            console.warn(`FontHandling: Skipping invalid entry in existingFontFilenames array: ${filename}`);
        }
    }
    console.log(`FontHandling: Finished initiating loading for ${existingFontCollection.length} 'Existing' fonts.`);
    if (existingFontCollection.length === 0 && existingFontFilenames.length > 0) {
         console.error("FontHandling CRITICAL: No 'Existing' fonts registered. Check array/paths.");
    }
}


// --- Font Upload Input Setup ---

/**
 * Creates or gets the hidden file input element for FONT uploads.
 * Assigns handleFontUpload to its change event.
 * Should be called once during initialization (e.g., from initializeFileInputs).
 */
function setupFontFileInput() {
  if (fontFileInputElement) fontFileInputElement.remove(); // Clean up old one if exists
  fontFileInputElement = document.createElement('input');
  fontFileInputElement.type = 'file';
  fontFileInputElement.multiple = true;
  fontFileInputElement.accept = '.ttf,.otf'; // Font types
  fontFileInputElement.style.position = 'absolute';
  fontFileInputElement.style.left = '-10000px'; fontFileInputElement.style.top = '-10000px'; fontFileInputElement.style.zIndex = '-1';
  fontFileInputElement.id = 'fontUploadInput'; // Assign ID
  document.body.appendChild(fontFileInputElement);
  console.log("FontHandling: Created hidden font input.");
  fontFileInputElement.onchange = function(event) { // Event listener
    const files = event.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      // Ensure handleFontUpload (defined below) exists before calling
      if (typeof handleFontUpload === 'function') {
          handleFontUpload(filesArray); // Call FONT handler
      } else { console.error("FontHandling: handleFontUpload is not defined!"); }
    } else { console.warn("FontHandling: No font files were selected"); }
    // event.target.value = null; // Optional reset
  };
  return fontFileInputElement;
}


// --- Click Handler (Trigger hidden font input) ---

/**
 * Finds and clicks the hidden FONT file input. Called by the GUI button.
 */
function uploadFontsClicked() {
  console.log("FontHandling: Upload fonts button clicked");
  if (!fontFileInputElement) setupFontFileInput(); // Ensure input exists
  if (fontFileInputElement) fontFileInputElement.click(); // Click font input
  else console.error("FontHandling: Could not create/find font file input element");
}


// --- Font Upload Handler ---


// --- Font Upload Handler (Simplified version) ---
function handleFontUpload(filesArray) {
    // --- Input Check ---
    if (!filesArray) {
        console.error("FONT UPLOAD ERROR: handleFontUpload called with undefined filesArray!");
        return;
    }
    console.log(`FONT UPLOAD: Processing ${filesArray.length} files...`);

    // --- Reset Collection & Update GUI State ---
    uploadedFontCollection = [];
    if (typeof updateFontTypeDropdown === 'function') {
        updateFontTypeDropdown(); // Ensure 'Uploaded' option is potentially removed/disabled initially
    } else {
        console.warn("FONT UPLOAD: updateFontTypeDropdown function not found. GUI dropdown state may be incorrect during/after load.");
    }

    // --- Validate Files ---
    let validFiles = [];
    const maxFontFileCount = 10;
    const maxFontFileSize = 1 * 1024 * 1024; // 1MB limit

    console.log("FONT UPLOAD: Validating files...");
    for (let i = 0; i < filesArray.length && validFiles.length < maxFontFileCount; i++) {
        let file = filesArray[i];
        let fileName = file.name.toLowerCase();
        let isValidExtension = fileName.endsWith('.ttf') || fileName.endsWith('.otf');
        let isValidSize = file.size <= maxFontFileSize;

        if (isValidExtension && isValidSize) {
            validFiles.push(file);
        } else {
            let reason = !isValidExtension ? `invalid extension` : `exceeds size limit`;
            console.warn(`  Skipping font file "${file.name}" (${reason})`);
        }
    }
    if (filesArray.length > validFiles.length && validFiles.length === maxFontFileCount) {
        console.warn(`FONT UPLOAD: Reached max files (${maxFontFileCount}). Skipping extras.`);
    }

    // --- Handle No Valid Files ---
    if (validFiles.length === 0) {
        console.warn("FONT UPLOAD: No valid font files found in upload.");
        // No need to call updateFontTypeDropdown again, was called at the start.
        return; // Stop processing
    }

    // --- Load Valid Files using createObjectURL ---
    let loadedAttemptCount = 0;
    let successCount = 0;
    console.log(`FONT UPLOAD: Attempting to load ${validFiles.length} valid fonts using createObjectURL...`);

    validFiles.forEach(file => {
        let fileURL = null; // Variable to store the temporary URL

        try {
            // 1. Create a temporary URL for the font File object
            fileURL = URL.createObjectURL(file);
            // console.log(`  Created URL for ${file.name}: ${fileURL}`); // Optional: Log URL

            // 2. Call p5.loadFont with the URL string
            loadFont(
                fileURL, // *** Pass the URL string ***

                // --- Success Callback ---
                (loadedFont) => {
                    console.log(`  Success: Loaded ${file.name} via URL`);
                    uploadedFontCollection.push({ name: file.name, font: loadedFont });
                    successCount++;
                    loadedAttemptCount++;
                    // --- Revoke the URL *after* successful load ---
                    if (fileURL) {
                         URL.revokeObjectURL(fileURL);
                         // console.log(`  Revoked URL for ${file.name}`);
                    }
                    checkCompletion(); // Check if all are done
                },

                // --- Error Callback ---
                (err) => {
                    console.error(`  ERROR loading font "${file.name}" via URL:`, err);
                    loadedAttemptCount++;
                    // --- Revoke the URL *on error* too ---
                    if (fileURL) {
                         URL.revokeObjectURL(fileURL);
                         // console.log(`  Revoked URL for ${file.name} after error`);
                    }
                    checkCompletion(); // Check if all are done
                }
            );
        } catch (error) {
            // Catch errors during createObjectURL or synchronous part of loadFont
            console.error(`  ERROR processing or initiating load for "${file.name}":`, error);
            loadedAttemptCount++;
            // --- Revoke URL if it was created before the error ---
            if (fileURL) {
                URL.revokeObjectURL(fileURL);
                // console.log(`  Revoked URL for ${file.name} after catch block`);
            }
            // Check completion if this was the last file or only file
             if (loadedAttemptCount === validFiles.length) {
                 checkCompletion();
             }
        }
    }); // End forEach loop

    // --- Function to run when all attempts are complete ---
    function checkCompletion() {
        // This function only runs when an individual load attempt finishes (success or fail)
        if (loadedAttemptCount === validFiles.length) {
            // This block runs only ONCE when the *last* file is processed
            console.log(`FONT UPLOAD: Finished all attempts. Successfully loaded ${successCount} / ${validFiles.length} fonts.`);

            // --- Update GUI based on final result ---
            if (typeof updateFontTypeDropdown === 'function') {
                updateFontTypeDropdown(); // Update dropdown state based on uploadedFontCollection
                 console.log("FONT UPLOAD: Updated mask type options in GUI after completion.");
            } else {
                console.warn("FONT UPLOAD: updateFontTypeDropdown function not found. GUI may not reflect final state.");
            }

             // Optional redraw if needed
             // if (typeof redraw === 'function') redraw();
        }
    } // End checkCompletion

} // End handleFontUpload
