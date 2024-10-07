# Figma Copier
Figma Copier is a plugin that allows users to easily copy and paste frame nodes along with their child properties directly within Figma. The plugin provides a simple UI for selecting a frame, copying its structure, and pasting it into the clipboard for reuse.

## How to Use
1. Select a node on your Figma canvas.
2. Click the **Copy Node** button to copy the selected node's structure.
3. Use the **Paste Node** button to paste the copied structure elsewhere or for future use.

## Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Use Figma's plugin UI to load the code and start using the tool.

## Development
To work on this plugin:
1. Modify the React component for the UI in `App.tsx`.
2. Update the handlers for copying and pasting logic in `handlers/handleCopy.ts` and `handlers/handlePaste.ts`.
3. Create the build - run `npm run build` and use the plugin in Figma by running the local build.
