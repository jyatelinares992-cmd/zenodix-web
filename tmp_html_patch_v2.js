const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Move Grid
const gridHtmlMatch = html.match(/<div class=\"app-grid\">[\s\S]*?<\/div>(\s*)<div class=\"app-panels\">/);
if (gridHtmlMatch) {
    let extractedGrid = gridHtmlMatch[0].replace(/<div class=\"app-panels\">/, '').trim();
    
    // remove it from where it is
    html = html.replace(extractedGrid, '');
    
    // inject before checkout-grid
    html = html.replace('<div class="checkout-grid">', `<div class="app-grid-container" style="max-width: 1200px; margin: 0 auto 3rem auto; padding: 0 1.5rem;">\n${extractedGrid}\n</div>\n<div class="checkout-grid">`);
}

// 2. Remove all accordion headers safely by matching exact signature block
html = html.replace(/<div class=\"accordion-header\">[\s\S]*?<span class=\"material-symbols-outlined accordion-icon\">expand_more<\/span>\s*<\/div>/g, '');

// 3. Transition classes
html = html.replace(/<div class=\"services-catalog app-style\">/g, '<div class=\"services-catalog left-panels-container\">');

// 4. Force styles and app js version cache bumps
const v = Date.now();
html = html.replace(/styles\.css\?v=\d+/g, 'styles.css?v=' + v);
html = html.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);

fs.writeFileSync('index.html', html);
console.log('Done!');
