const fs = require('fs');

// Grab the arguments from the command line
const args = process.argv.slice(2); 
const flag = args[0];
const filename = args[1];

console.log(process.argv);
console.log(args);
console.log(flag);
console.log(filename);

// Step 1: Handle the -c flag (Byte Count)
if (flag === '-c') {
    try {
        // fs.statSync gets file details without reading the entire contents into memory
        const stats = fs.statSync(filename);
        const byteCount = stats.size;
        
        // Print the result matching the challenge's exact format
        console.log(`  ${byteCount} ${filename}`);
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
    }
} else {
    console.log("Unsupported flag or missing arguments!");
}