 ESM in Node.js requires explicit file extensions when importing local modules.
 so when importing anytning from files, you should have the .js file extension.
When using ts-node/esm, you still need .js (not .ts) in the import path because Node runs the transpiled JavaScript version in memory.

you can skip this headache of using file extensions everywhere if you already have a big app, by this dev script
"dev": "nodemon --watch . --ext ts --exec \"node --loader ts-node/esm --experimental-specifier-resolution=node index.ts\""
but for production - build the app into a dist folder and run with node command = node index.js
