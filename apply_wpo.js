const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf-8');

    // 1. Defer scripts
    // Replaces: <script src="app.js?v=..."></script> with <script src="..." defer></script>
    // and GSAP scripts as well.
    html = html.replace(/<script src="([^"]+)"( defer)?>\s*<\/script>/g, '<script src="$1" defer></script>');
    
    // Some GSAP CDNs might already have it or we overwrite
    // Check if the script tags got double defers
    html = html.replace(/(defer defer>)/g, 'defer>');
    html = html.replace(/(defer\s+defer>)/g, 'defer>');

    // 2. LCP Preloading
    const preloadLinks = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap">\n`;
    
    if(!html.includes('rel="preconnect"')) {
        html = html.replace('    <link rel="icon"', preloadLinks + '    <link rel="icon"');
    }

    // 3. Lazy Load Images (Excluding the ones inside Hero or Navbar)
    // The only image in navbar/hero is:
    // <img src="zenodix-logo-center.jpg" alt="Zenodix Logo" class="brand-logo" style="border-radius: 6px;">
    
    html = html.replace(/<img([^>]+)>/g, (match, attrs) => {
        // Exclude logo
        if(attrs.includes('class="brand-logo"')) {
            let newA = attrs;
            // Add dimensions to logo
            if(!newA.includes('width=')) newA += ' width="120" height="32"';
            return `<img${newA}>`;
        }
        
        let newA = attrs;
        // Add loading="lazy" if not present
        if(!newA.includes('loading=')) newA += ' loading="lazy"';
        
        // Add default width/height if missing to prevent CLS
        if(!newA.includes('width=')) {
            if(attrs.includes('mockup')) {
                newA += ' width="800" height="500"';
            } else if(attrs.includes('icon')) {
                newA += ' width="48" height="48"';
            } else if(attrs.includes('preview')) {
                 newA += ' width="600" height="400"';
            } else {
                 newA += ' width="400" height="300"';
            }
        }
        
        return `<img${newA}>`;
    });

    fs.writeFileSync('index.html', html);
    console.log('WPO Applied successfully.');
} catch (e) {
    console.error(e);
}
