# Typocut: Generative Typography Tool

## About

Typocut is an interactive tool that mixes collages, typography and randomness. Born from a passion for collage and creative coding, this web-based tool creates typographic designs with noise, randomized image masking and configurable gradients. 

Created as a capstone project for the [Werkstatt Creative Coding course](https://werkstatt.school/creative-coding), Typocut explores how analogue could be emulated by digital and then converted back to analogue.

Try it at [typocut.online](https://typocut.online)
(if this one doesn't work, try the direct one at [https://anyaepie.github.io/typo-cut/](https://anyaepie.github.io/typo-cut/)) 

Each letter is a canvas, randomly cropped from configurable gradients or uploaded images, with adjustable noise and style parameters. Letters are built using strict 3x3 grid with primitives (rectange, triangle, cut-out rectangles, half-circles) that are flipped and rotated as needed - all with noise applied, combining pixel and parametric fonts.

Check out my other creative art projects at [mixedmeanings.lol/digital](https://www.mixedmeanings.lol/digital).

## Inspiration

Notable [Coding Train](https://thecodingtrain.com/) tutorials leveraged in this project include:

[P5JS framework](https://p5js.org/) used to write the logic

GUI is created using [lil-gui](https://lil-gui.georgealways.com/#) by (George Michael Brower)[https://georgealways.com/]

## Key Features

The user can type their own text (note that there is a limit of characters dynamically calculated depending on the canvas size, letter size and spacing, line spacing). Direct cut-out is applied by default - the user can choose the inverted mask, when the letters are cut-out from underlying rectangles.

Letters can be repositioned with a mouse and saved as transparent PNG.

Cutting out letters from the gradients is a default option, gradients could be configured in the GUI. To use custom images, the user needs to upload the images first (not more than 15, JPG, JPEG, PNG each less than 2MB) and chose "Uploaded Images" in the dropdown menu.

A4 alphabet sheet can be previewed and saved separately, with letter configuration picked up from the main screen, yet the letter sequence is defined based on the standard frequency distribution for the English alphabet. This transparent PNG could be later printed out to be used for analogue collages.

## Notable creative and technology decisions

## Screenshots

*Screenshots coming soon*


