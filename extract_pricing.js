const fs = require('fs');

try {
    const html = fs.readFileSync('index.html', 'utf-8');
    let output = "# Portafolio Master de Servicios y Precios - Zenodix\n\n";
    output += "A continuación se desglosan todos los niveles, categorías y adiciones con sus respectivos precios base mapeados en el cotizador interactivo actual.\n\n";

    const panelRegex = /<!-- Category \d+:\s*(.+?)\s*-->[\s\S]*?<div id="([^"]+)"/g;
    let match;
    let anyFound = false;

    while ((match = panelRegex.exec(html)) !== null) {
        anyFound = true;
        const catName = match[1].trim();
        output += `## ${catName}\n`;
        output += `| Paquete / Servicio | Inversión (COP) |\n`;
        output += `| :--- | :--- |\n`;
        
        // Find the panel text boundary
        const nextRegex = /<!-- Category \d+:/g;
        nextRegex.lastIndex = panelRegex.lastIndex;
        let endIdx = html.length;
        let nextMatch = nextRegex.exec(html);
        if(nextMatch) {
            endIdx = nextMatch.index;
        }
        
        const panelContent = html.substring(match.index, endIdx);
        
        const inputRegex = /<input[^>]+value="([^"]+)"[^>]+data-price="([^"]+)"/g;
        let inputMatch;
        let foundTiers = false;
        
        while((inputMatch = inputRegex.exec(panelContent)) !== null) {
            foundTiers = true;
            let name = inputMatch[1];
            let rawPrice = parseInt(inputMatch[2]);
            let priceFormatted = rawPrice.toLocaleString('es-CO');
            output += `| ${name} | $${priceFormatted} |\n`;
        }
        
        if(!foundTiers) {
            output += `| *Cotización a Medida (Análisis de Requerimientos)* | *Sujeto a Evaluación* |\n`;
        }
        output += `\n`;
    }
    
    // Guardar el artefacto en el Brain directory.
    const dest = "C:\\Users\\jhonh\\.gemini\\antigravity\\brain\\7f621c9b-ad0d-4616-96f4-3e59009ed89b\\zenodix_pricing_catalog.md";
    fs.writeFileSync(dest, output);
    console.log('Artifact Created:', dest);
} catch (e) {
    console.error(e);
}
