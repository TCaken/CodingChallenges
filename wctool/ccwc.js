const fs = require('fs');

const args = process.argv.slice(2);
const hasFlag = args[0]?.startsWith('-');
const flag = hasFlag ? args[0] : null;
const filename = hasFlag ? args[1] : args[0];
const fromStdin = !filename;

function isWhitespace(byte) {
    return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d || byte === 0x0c || byte === 0x0b;
}

function countLines(buffer) {
    let lines = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0x0a) lines++;
    }
    return lines;
}

function countWords(buffer) {
    let words = 0;
    let inWord = false;
    for (let i = 0; i < buffer.length; i++) {
        if (isWhitespace(buffer[i])) {
            inWord = false;
        } else if (!inWord) {
            words++;
            inWord = true;
        }
    }
    return words;
}

function countAll(buffer) {
    let lines = 0;
    let words = 0;
    let inWord = false;
    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte === 0x0a) lines++;
        if (isWhitespace(byte)) {
            inWord = false;
        } else if (!inWord) {
            words++;
            inWord = true;
        }
    }
    return { byteCount: buffer.length, lineCount: lines, wordCount: words };
}

function readBuffer() {
    return fromStdin ? fs.readFileSync(0) : fs.readFileSync(filename);
}

try {
    const suffix = fromStdin ? '' : ` ${filename}`;

    if (flag === '-c') {
        const byteCount = fromStdin ? readBuffer().length : fs.statSync(filename).size;
        console.log(`${String(byteCount).padStart(8)}${suffix}`);
    } else if (flag === '-l') {
        const lineCount = countLines(readBuffer());
        console.log(`${String(lineCount).padStart(8)}${suffix}`);
    } else if (flag === '-w') {
        const wordCount = countWords(readBuffer());
        console.log(`${String(wordCount).padStart(8)}${suffix}`);
    } else if (flag === '-m') {
        const charCount = readBuffer().toString('utf8').length;
        console.log(`${String(charCount).padStart(8)}${suffix}`);
    } else if (flag === null) {
        const { lineCount, wordCount, byteCount } = countAll(readBuffer());
        console.log(`${String(lineCount).padStart(8)} ${String(wordCount).padStart(7)} ${String(byteCount).padStart(7)}${suffix}`);
    } else {
        console.log("Unsupported flag or missing arguments!");
    }
} catch (error) {
    console.error(`Error reading file: ${error.message}`);
}
