const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const regex = /<div class=\"accordion-header\">[\s\S]*?<div class=\"accordion-content\">/g;
html = html.replace(regex, '<div class=\"accordion-content\">');

// One more update, we need to enforce that the .app-panel has no padding so the inner content looks right, but we will leave CSS alone for now.
// Let's bump CSS to ?v=7 just in case
html = html.replace(/styles\.css\?v=\d+/g, 'styles.css?v=' + Date.now());

fs.writeFileSync('index.html', html);
console.log('Headers removed successfully!');
