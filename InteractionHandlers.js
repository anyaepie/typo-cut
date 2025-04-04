// Interaction handling functions for Typocut

// Mouse press interaction handler
function mousePressed() {
    let guiBounds = gui.domElement.getBoundingClientRect();
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height ||
        (mouseX >= guiBounds.left && mouseX <= guiBounds.right && mouseY >= guiBounds.top && mouseY <= guiBounds.bottom) ) {
        return;
    }
    selectedLetterIndex = -1;
    for (let i = letters.length - 1; i >= 0; i--) {
        if (letters[i].contains(mouseX, mouseY)) {
            selectedLetterIndex = i;
            mouseDragging = true;
            dragOffsetX = mouseX - letters[i].x;
            dragOffsetY = mouseY - letters[i].y;
            redraw();
            break;
        }
    }
}

// Mouse drag interaction handler
function mouseDragged() {
    if (mouseDragging && selectedLetterIndex !== -1) {
        let letter = letters[selectedLetterIndex];
        letter.moveTo(mouseX - dragOffsetX, mouseY - dragOffsetY);
        redraw();
    }
}

// Mouse release interaction handler
function mouseReleased() {
    if (mouseDragging) {
        mouseDragging = false;
        selectedLetterIndex = -1;
        redraw();
    }
}

// Keyboard type interaction handler
function keyTyped() {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return; // Ignore if GUI input focused
    }
    let k = key;
    if (key.length === 1 && (key === ' ' || (key >= '!' && key <= '~'))) {
        let maxLen = calculateMaxTextLength();
        if (inputText.length < maxLen) {
            inputText += key.toUpperCase();
            // Update GUI text input field
            updateGUIWithCurrentText();
            updateLetterObjects();
        } else {
            // left for troubleshooting here
            console.log(`Maximum character limit reached (${maxLen})`);
        }
    }
}

// Keyboard press interaction handler
function keyPressed() {
     if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return; // Ignore if GUI input focused
    }
    if (keyCode === BACKSPACE) {
        if (inputText.length > 0) {
            inputText = inputText.substring(0, inputText.length - 1);
            // Update GUI text input field
            updateGUIWithCurrentText();
            updateLetterObjects();
        }
        return false; // Prevent browser back nav
    }
    if (keyCode === ENTER || keyCode === RETURN) {
        resetLetterLayout();
        return false;
    }
}
