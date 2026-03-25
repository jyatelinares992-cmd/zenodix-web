const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(targetPath, 'utf-8');

const appGridHTML = `
    <div class="app-grid">
        <button type="button" class="app-icon-btn active" onclick="openAppPanel('panel-landing', 'landing_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">web</span></div>
            <span class="app-label">Landing Pages</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-corp', 'corp_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">domain</span></div>
            <span class="app-label">Web Corporativa</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-ecom', 'ecom_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">shopping_cart</span></div>
            <span class="app-label">E-commerce Pro</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-social', 'social_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">campaign</span></div>
            <span class="app-label">Redes IA</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-voice', 'voice_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">record_voice_over</span></div>
            <span class="app-label">Voice AI</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-data', 'data_tier')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">query_stats</span></div>
            <span class="app-label">Data Analytics</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-srs', '')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">smart_toy</span></div>
            <span class="app-label">Cotizar Apps</span>
        </button>
        <button type="button" class="app-icon-btn" onclick="openAppPanel('panel-powerups', 'power_ups')">
            <div class="app-icon shadow-neon"><span class="material-symbols-outlined">bolt</span></div>
            <span class="app-label">Power-Ups</span>
        </button>
    </div>
    <div class="app-panels">
`;

// Inject grid at top of services-catalog
html = html.replace('<div class="services-catalog">', '<div class="services-catalog app-style">\n' + appGridHTML);

// Replace the accordion items to have IDs.
html = html.replace('<!-- Category 1: Landing Pages -->\n                <div class="accordion-item card-base">', '<!-- Category 1: Landing Pages -->\n                <div id="panel-landing" class="accordion-item card-base active">');
html = html.replace('<!-- Category 2: Web Corporativa (Informativa/B2B) -->\n                <div class="accordion-item card-base">', '<!-- Category 2: Web Corporativa (Informativa/B2B) -->\n                <div id="panel-corp" class="accordion-item card-base">');
html = html.replace('<!-- Category 3: E-commerce Pro -->\n                <div class="accordion-item card-base">', '<!-- Category 3: E-commerce Pro -->\n                <div id="panel-ecom" class="accordion-item card-base">');
html = html.replace('<!-- Category: App Development (Custom AI UI) -->\n                <div class="accordion-item card-base">', '<!-- Category: App Development (Custom AI UI) -->\n                <div id="panel-srs" class="accordion-item card-base">');
html = html.replace('<!-- Category 4: Gestión de Redes & Contenido IA (Mensual) -->\n                <div class="accordion-item card-base">', '<!-- Category 4: Gestión de Redes & Contenido IA (Mensual) -->\n                <div id="panel-social" class="accordion-item card-base">');
html = html.replace('<!-- Category 5: Voice AI & Agentes Telefónicos -->\n                <div class="accordion-item card-base">', '<!-- Category 5: Voice AI & Agentes Telefónicos -->\n                <div id="panel-voice" class="accordion-item card-base">');
html = html.replace('<!-- Category 6: Data Analytics & Business Intelligence -->\n                <div class="accordion-item card-base">', '<!-- Category 6: Data Analytics & Business Intelligence -->\n                <div id="panel-data" class="accordion-item card-base">');
html = html.replace('<!-- Category 7: Power-Ups (Checkbox) -->\n                <div class="accordion-item card-base">', '<!-- Category 7: Power-Ups (Checkbox) -->\n                <div id="panel-powerups" class="accordion-item card-base">');

// Close app-panels div
html = html.replace('            </div>\n            <!-- Right Column: Cart Summary -->', '            </div>\n            </div>\n            <!-- Right Column: Cart Summary -->');

fs.writeFileSync(targetPath, html);
console.log('DOM Rewritten');
