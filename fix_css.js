const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');
css = css.replace(/\.services-catalog\.app-style/g, '.services-catalog.left-panels-container');
fs.writeFileSync('styles.css', css);
console.log('CSS updated successfully');
