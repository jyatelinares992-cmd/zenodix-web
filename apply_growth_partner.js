const fs = require('fs');

try {
    // 1. UPDATE STYLES.CSS
    let css = fs.readFileSync('styles.css', 'utf-8');
    if (!css.includes('.premium-tier-card')) {
        const customCss = `
.premium-tier-card {
    border: 2px solid #eab308 !important;
    box-shadow: 0 4px 20px rgba(234, 179, 8, 0.15) !important;
    background: linear-gradient(145deg, #ffffff, #fffbeb) !important;
}
.service-radio:checked + .premium-tier-card {
    border-color: #ca8a04 !important;
    background: linear-gradient(145deg, #fffbeb, #fef3c7) !important;
    box-shadow: 0 8px 30px rgba(202, 138, 4, 0.25) !important;
}
`;
        css = css.replace('.tier-card:hover {', customCss + '\n.tier-card:hover {');
        fs.writeFileSync('styles.css', css);
    }

    // 2. UPDATE INDEX.HTML
    let html = fs.readFileSync('index.html', 'utf-8');

    const newButton = `
                <!-- Growth Partner Button -->
                <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-growth', 'growth_tier')">
                    <div class="app-icon shadow-neon" style="border-color: #eab308; box-shadow: 0 8px 16px rgba(234, 179, 8, 0.15);"><span class="material-symbols-outlined" style="color: #eab308; animation: none;">workspace_premium</span></div>
                    <span class="app-label" style="font-weight: 700; color: #ca8a04;">Growth Partner</span>
                </button>`;
    
    if (!html.includes('panel-growth')) {
        // Insert button at the beginning of app-grid
        html = html.replace('<div class="app-grid">', '<div class="app-grid">' + newButton);
        
        // Insert panel at the beginning of app-panels
        const newPanel = `
                <!-- Category Growth -->
                <div id="panel-growth" class="app-panel accordion-item card-base">
                    <div class="accordion-content">
                        <div class="tier-options">
                            <p style="font-size:0.9rem; color:#666; margin-bottom:1rem; line-height:1.5;">
                                No somos proveedores, somos tus socios tecnológicos. Instalamos todo nuestro ecosistema de IA, automatización y ventas a cambio de un porcentaje de tus resultados. <br><strong style="color:var(--color-primary);"> (Solo por invitación).</strong>
                            </p>
                            <label class="tier-label">
                                <input type="radio" name="growth_tier" class="service-radio" value="Auditoría & Aplicación (Setup Inicial)" data-price="5000000">
                                <div class="tier-card premium-tier-card">
                                    <div class="tier-info">
                                        <strong>Auditoría & Aplicación (Setup Inicial)</strong>
                                        <span style="line-height:1.4;">Implementación total (Web, IA, n8n, Datos) + Retainer + 15% de RevShare sobre el crecimiento neto.</span>
                                    </div>
                                    <div class="tier-price">$5.000.000 COP</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>`;
                
        html = html.replace('<div class="app-panels">', '<div class="app-panels">' + newPanel);
        fs.writeFileSync('index.html', html);
    }

    // 3. UPDATE APP.JS
    let js = fs.readFileSync('app.js', 'utf-8');
    if (!js.includes('growth_tier')) {
        // Map the category
        js = js.replace('if(input.name === "landing_tier")', 'if(input.name === "growth_tier") categoryName = "👑 Growth Partner";\n                else if(input.name === "landing_tier")');
        
        // Handle the WhatsApp string marker
        js = js.replace('let waText = "Hola Zenodix, quiero este ecosistema de ventas:\\n\\n";', 'let waText = "Hola Zenodix, quiero este ecosistema de ventas:\\n\\n";\n        let hasGrowth = false;');
        js = js.replace("const billingType = s.inputName === 'social_tier' ? ", "if (s.inputName === 'growth_tier') hasGrowth = true;\n            const billingType = s.inputName === 'social_tier' ? ");
        
        // Add WhatsApp specific sentence
        const finalWaTextTarget = 'waText += `\\n*Total estimado a Invertir:* $${formatter.format(finalTotal)} ${currency}.\\n\\nQuiero iniciar mi desarrollo con ustedes.`;';
        const finalWaTextReplacement = `waText += \`\\n*Total estimado a Invertir:* $\${formatter.format(finalTotal)} \${currency}.\\n\\n\`;
        if (hasGrowth) {
            waText += "Me interesa aplicar al modelo Growth Partner con RevShare.\\n\\n";
        }
        waText += \`Quiero iniciar mi desarrollo con ustedes.\`;`;
            
        js = js.replace(finalWaTextTarget, finalWaTextReplacement);
        
        // Bump cache
        const v = Date.now();
        js = js.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
        
        fs.writeFileSync('app.js', js);
        
        // Update index cache block
        html = fs.readFileSync('index.html', 'utf-8');
        html = html.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
        fs.writeFileSync('index.html', html);
    }

    console.log('Growth Partner Tier integrated seamlessly');
} catch (err) {
    console.error(err);
}
