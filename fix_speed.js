const fs = require('fs');

try {
    let html = fs.readFileSync('index.html', 'utf-8');

    // 1. Swap Synchronous Google Fonts with Async Media Print + Preload
    html = html.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="preload" as="style" onload="this.onload=null;this.rel=\\\'stylesheet\\\'">\n    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"></noscript>'
    );
    
    html = html.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="preload" as="style" onload="this.onload=null;this.rel=\\\'stylesheet\\\'">\n    <noscript><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"></noscript>'
    );

    // 2. Add Preload command for the main stylesheet before loading it
    if (!html.includes('<link rel="preload" as="style" href="styles.css">')) {
        html = html.replace(
            '<link rel="stylesheet" href="styles.css?v=1774060689784">',
            '<link rel="preload" as="style" href="styles.css">\n    <link rel="stylesheet" href="styles.css">'
        );
    }
    
    // Clean out the old explicit preloads if we replaced them to avoid duplication
    html = html.replace('<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">', "");
    html = html.replace('<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap">', "");

    // 3. Preload Large Hero Image (Logo) to force high priority LCP download
    if (!html.includes('<link rel="preload" as="image" href="zenodix-logo-center.jpg">')) {
        html = html.replace(
            '</head>',
            '    <link rel="preload" as="image" href="zenodix-logo-center.jpg">\n</head>'
        );
    }

    fs.writeFileSync('index.html', html);
    console.log("CWV (Core Web Vitals) Header Patch Applied successfully. Render-blocking fonts deferred.");
} catch(e) {
    console.error(e);
}
