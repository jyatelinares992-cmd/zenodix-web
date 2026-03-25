const fs = require('fs');
const file = 'd:/Proyectos Antigravity/Pagina Web Zenodix/index.html';
let html = fs.readFileSync(file, 'utf8');

const tStartStr = '<!-- Pricing Section -->';
const ts1 = html.indexOf(tStartStr);
const ts2 = html.indexOf('<!-- FAQ Section -->', ts1);

if (ts1 > -1 && ts2 > -1) {
    const preciosHtml = html.substring(ts1, ts2);
    html = html.replace(preciosHtml, '');
    
    // find where to insert: right after the Node Ecosystem Section
    // That section is ID 'servicios' ends with </section>
    const servStart = html.indexOf('<section id="servicios" class="services">');
    const servEnd = html.indexOf('</section>', servStart) + 10;
    
    // insert
    html = html.substring(0, servEnd) + '\n\n    ' + preciosHtml + html.substring(servEnd);
    
    fs.writeFileSync(file, html);
    console.log("Moved pricing section successfully!");
} else {
    console.log("Could not find sections");
}
