const fs = require('fs');

try {
    // 1. UPDATE INDEX.HTML
    let html = fs.readFileSync('index.html', 'utf-8');

    // Replace Growth Partner Text and Pricing
    const oldGrowthPanelRegex = /<p style="font-size:0\.9rem; color:#666; margin-bottom:1rem; line-height:1\.5;">[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>)/;
    
    // The replacement for Growth Panel contents
    const newGrowthBody = `<p style="font-size:0.9rem; color:#666; margin-bottom:1rem; line-height:1.5;">
                                Implementación exclusiva de nuestro ecosistema de IA, desarrollo web y automatizaciones avanzadas. Incluye auditoría forense para definir la inversión operativa inicial y acordar el esquema de ganancias (RevShare) según tu industria. <br><strong style="color:var(--color-primary);"> (Solo por invitación).</strong>
                            </p>
                            <label class="tier-label">
                                <input type="radio" name="growth_tier" class="service-radio" value="Auditoría Forense & Setup" data-price="0">
                                <div class="tier-card premium-tier-card">
                                    <div class="tier-info">
                                        <strong>Auditoría Forense & Setup Inicial</strong>
                                        <span style="line-height:1.4;">Fase de inversión de inicio de operaciones + RevShare variable post-análisis.</span>
                                    </div>
                                    <div class="tier-price" style="font-size: 0.95rem; text-transform: uppercase;">Por Evaluación</div>
                                </div>
                            </label>
                        `;

    html = html.replace(oldGrowthPanelRegex, newGrowthBody);

    // Insert Chat Feature before id="precios"
    const chatHtml = `
    <!-- Embedded AI Consult Chat Section -->
    <section id="idea-chat" style="max-width: 800px; margin: 0 auto 5rem auto; padding: 0 1.5rem;">
        <div class="section-header center mb-8">
            <h2 style="font-size: 2rem; color: var(--color-primary); line-height: 1.2;">¿Tienes dudas de lo que estás buscando?</h2>
            <p style="font-size: 1.05rem; color: var(--color-text-secondary); line-height: 1.6; margin-top: 0.5rem;">Dime tu idea y juntos podemos aclararla para agendar una reunión y avanzar en tu proyecto.</p>
        </div>
        
        <div class="idea-chat-container">
            <div class="idea-chat-body" id="ideaChatBody">
                <div class="srs-msg srs-ai">
                    ¡Hola! Soy tu Consultor Estratégico AI de Zenodix. Escríbeme o sube un audio/imagen contándome de tu negocio y te guiaré hacia la mejor solución tecnológica.
                </div>
            </div>
            <div class="idea-chat-input-area">
                <label class="chat-icon-btn multimodal-btn" title="Adjuntar Archivo">
                    <input type="file" id="ideaFileInput" accept="image/*,audio/*" hidden onchange="window.handleFileSelect(this, 'ideaFileAlert')">
                    <span class="material-symbols-outlined" id="ideaFileAlert">attach_file</span>
                </label>
                <button class="chat-icon-btn multimodal-btn" id="ideaMicBtn" title="Voz (Próximamente)"><span class="material-symbols-outlined">mic</span></button>
                <input type="text" id="ideaChatInput" placeholder="Escribe tu idea aquí..." autocomplete="off">
                <button id="ideaSendBtn" class="send-btn"><span class="material-symbols-outlined">send</span></button>
            </div>
        </div>
    </section>

    <section id="precios" class="pricing">`;
    
    if (!html.includes('idea-chat')) {
        html = html.replace('<section id="precios" class="pricing">', chatHtml);
        fs.writeFileSync('index.html', html);
    } else {
        html = html.replace(/<section id="idea-chat"[\s\S]*?<section id="precios" class="pricing">/, chatHtml);
        fs.writeFileSync('index.html', html);
    }

    // 2. UPDATE STYLES.CSS
    let css = fs.readFileSync('styles.css', 'utf-8');
    if (!css.includes('.idea-chat-container')) {
        const chatCss = `
/* ==========================================================================
   Embedded Pre-Sales AI Chat
   ========================================================================== */
.idea-chat-container {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 12px 35px rgba(0,0,0,0.06);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.idea-chat-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 360px;
    overflow-y: auto;
    background: #fafbfc;
}
.idea-chat-input-area {
    display: flex;
    padding: 1rem;
    gap: 0.5rem;
    background: #ffffff;
    border-top: 1px solid rgba(0,0,0,0.05);
    align-items: center;
}
.idea-chat-input-area input[type="text"] {
    flex: 1;
    padding: 0.8rem 1.2rem;
    border: 1px solid #e5e7eb;
    border-radius: 24px;
    outline: none;
    font-size: 0.95rem;
    transition: all 0.2s;
}
.idea-chat-input-area input[type="text"]:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(0, 85, 255, 0.1);
}
`;
        css = css + '\n' + chatCss;
        fs.writeFileSync('styles.css', css);
    }

    // 3. UPDATE APP.JS
    let js = fs.readFileSync('app.js', 'utf-8');
    if (!js.includes('ideaChatInput')) {
        const chatJs = `
    // ==========================================================================
    // Embedded Pre-Sales Idea Consult Chat
    // ==========================================================================
    const ideaChatInput = document.getElementById('ideaChatInput');
    const ideaChatBody = document.getElementById('ideaChatBody');
    const ideaSendBtn = document.getElementById('ideaSendBtn');
    const ideaFileInput = document.getElementById('ideaFileInput');

    if (ideaSendBtn) {
        ideaSendBtn.addEventListener('click', async () => {
            const text = ideaChatInput.value.trim();
            const file = ideaFileInput && ideaFileInput.files && ideaFileInput.files.length > 0 ? ideaFileInput.files[0] : null;
            
            if (!text && !file) return;

            // User Message UI
            let userContent = text;
            if (file) userContent += \` <br><small style="color:var(--color-accent); font-weight:600;">[Adjunto: \${file.name}]</small>\`;
            
            const userMsg = document.createElement('div');
            userMsg.className = 'srs-msg srs-user';
            userMsg.innerHTML = userContent || '[Archivo Adjunto]';
            ideaChatBody.appendChild(userMsg);
            
            ideaChatInput.value = '';
            if (ideaFileInput) {
                ideaFileInput.value = '';
                if(window.handleFileSelect) window.handleFileSelect(ideaFileInput, 'ideaFileAlert');
            }
            ideaChatBody.scrollTop = ideaChatBody.scrollHeight;

            // Typing Indicator
            const typing = document.createElement('div');
            typing.className = 'srs-msg srs-ai';
            typing.innerHTML = '<span class="typing-indicator"><span>•</span><span>•</span><span>•</span></span>';
            ideaChatBody.appendChild(typing);
            ideaChatBody.scrollTop = ideaChatBody.scrollHeight;

            try {
                let base64Data = null;
                if (file && window.getBase64) {
                    base64Data = await window.getBase64(file);
                }

                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: currentSessionId,
                        message: text || "Analiza el archivo adjunto.",
                        action: "idea_consult",
                        imageBase64: base64Data
                    })
                });

                ideaChatBody.removeChild(typing);

                if (response.ok) {
                    const data = await response.json();
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'srs-msg srs-ai';
                    
                    let formattedResponse = typeof data === 'string' ? data : (data.response || data.output || "Recibido. Estamos procesando tus requerimientos...");
                    formattedResponse = formattedResponse.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                    
                    aiMsg.innerHTML = formattedResponse;
                    ideaChatBody.appendChild(aiMsg);
                } else {
                    const errUi = document.createElement('div');
                    errUi.className = 'srs-msg srs-ai';
                    errUi.style.color = '#ef4444';
                    errUi.textContent = 'Hubo un error de conexión con la IA. Por favor, intenta de nuevo.';
                    ideaChatBody.appendChild(errUi);
                }
            } catch(e) {
                if (typing.parentElement) ideaChatBody.removeChild(typing);
                const errUi = document.createElement('div');
                errUi.className = 'srs-msg srs-ai';
                errUi.style.color = '#ef4444';
                errUi.textContent = 'Error de red al conectar al orquestador AI.';
                ideaChatBody.appendChild(errUi);
            }
            ideaChatBody.scrollTop = ideaChatBody.scrollHeight;
        });

        // Press enter to send
        ideaChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ideaSendBtn.click();
        });
    }
`;
        // Inject right before the SRS generator logic
        js = js.replace('// App Development SRS Chat Generator Logic', chatJs + '\n    // App Development SRS Chat Generator Logic');
        
        const v = Date.now();
        js = js.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
        fs.writeFileSync('app.js', js);
        
        // Cache bump
        html = fs.readFileSync('index.html', 'utf-8');
        html = html.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
        fs.writeFileSync('index.html', html);
    }
    console.log('Idea Consult Chat & Refined Copy Added.');
} catch (e) {
    console.error(e);
}
