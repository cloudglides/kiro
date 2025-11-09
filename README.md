# Kiru

A cool, native Linux screenshot editor app using GJS (GNOME JavaScript) with GTK bindings.

## Nix Setup

This project includes a `flake.nix` for NixOS users, providing all dependencies via direnv.

## Features

- Take screenshots via button click
- Modern GTK UI with header bar
- Draw on screenshots with customizable brush
- Upload edited images to ImgBB

## Setup

1. Enter the directory and allow direnv: `direnv allow`
2. If prompted about insecure libsoup, allow it: `export NIXPKGS_ALLOW_INSECURE=1` then `direnv allow` again
3. Get an ImgBB API key from https://api.imgbb.com/
4. Replace 'YOUR_IMGBB_KEY' in main.js with your key
5. Run: `gjs main.js`

## Usage

- Launch the app with `gjs main.js`
- Click "Take Screenshot" to capture screen
- In the editor: Use header bar controls (Upload, Clear, Color picker, Brush size slider)
- Draw by dragging mouse on the image
- Upload shows a dialog with the link on success

## TypeScript Support

The code is written in JavaScript, but can be adapted to TypeScript by adding type annotations and compiling with tsc targeting ES6.
