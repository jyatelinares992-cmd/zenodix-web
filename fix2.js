const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

let newSaveBlock = `if (saveLeadBtn) {
            saveLeadBtn.addEventListener('click', async () => {
                const nameVal = leadNameInput.value.trim();
                const phoneVal = leadPhoneInput.value.trim();
                
                if(!nameVal || !phoneVal) {
                    alert('Por favor ingresa tu nombre y WhatsApp para poder atenderte.');
                    return;
                }
                
                capturedLeadData.name = nameVal;
                capturedLeadData.phone = phoneVal;
                localStorage.setItem('zenodix_ai_lead_name', nameVal);
                localStorage.setItem('zenodix_ai_lead_phone', phoneVal);
                
                // Bloquear inputs temporalmente
                leadNameInput.disabled = true;
                leadPhoneInput.disabled = true;
                saveLeadBtn.disabled = true;
                saveLeadBtn.innerText = "Registrando...";
                initialAiGreeting.innerHTML = 'Conectando con Consultor AI...';
                
                try {
                    const messageText = \`Mis datos de registro son: Nombre: \${nameVal}, WhatsApp: \${phoneVal}\`;
                    const sessionId = typeof currentSessionId !== 'undefined' ? currentSessionId : localStorage.getItem('zenodix_ai_session') || ('session_' + Math.random().toString(36).substr(2, 9));
                    localStorage.setItem('zenodix_ai_session', sessionId);
                    
                    const response = await fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: sessionId,
                            message: messageText,
                            action: "idea_consult",
                            clientName: nameVal,
                            clientWhatsApp: phoneVal
                        })
                    });

                    if (!response.ok) throw new Error('Network error');

                    const data = await response.json();
                    
                    const aiResponse = data.response || data.message || data.output || \`¡Excelente <strong>\${nameVal}</strong>! Tus datos han sido recibidos. Dime, ¿en qué te puedo ayudar hoy?\`;
                    
                    initialAiGreeting.innerHTML = aiResponse;
                    activateIdeaChatInputs(true);
                    
                    // Asegurar que ocultamos el form o algo si es necesario
                    const leadCaptureDiv = document.querySelector('.idea-lead-capture');
                    if(leadCaptureDiv) {
                       leadCaptureDiv.style.display = 'none';
                    }

                    if(ideaChatInput) ideaChatInput.focus();

                } catch (e) {
                    console.error("Error al guardar datos en n8n:", e);
                    initialAiGreeting.innerHTML = \`Ocurrió un error (n8n no responde). Guardado local. ¿En qué te ayudo?\`;
                    activateIdeaChatInputs(true);
                }
            });
        }`;

let regexSaveBtn = /if\s*\(saveLeadBtn\)\s*\{\s*saveLeadBtn\.addEventListener\('click',\s*\(\)\s*=>\s*\{[\s\S]*?initialAiGreeting\.innerHTML\s*=\s*.*?;\s*activateIdeaChatInputs\(true\);\s*if\(ideaChatInput\)\s*ideaChatInput\.focus\(\);\s*\}\);\s*\}/;

code = code.replace(regexSaveBtn, newSaveBlock);

// For the mock hook, we replace it with just the true fetch block
let trueFetchBlock = `
            try {
                let base64Image = "";
                let base64Audio = "";
                
                if (file && window.getBase64) base64Image = await window.getBase64(file);
                if (audioToSend && window.getBase64) base64Audio = await window.getBase64(audioToSend);
                
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: typeof currentSessionId !== 'undefined' ? currentSessionId : localStorage.getItem('zenodix_ai_session'),
                        message: text || "Analiza el archivo adjunto.",
                        action: "idea_consult",
                        clientName: capturedLeadData.name,
                        clientWhatsApp: capturedLeadData.phone,
                        imageBase64: base64Image,
                        audioBase64: base64Audio
                    })
                });

                if (typing.parentElement) ideaChatBody.removeChild(typing);

                if (response.ok) {
                    const data = await response.json();
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'srs-msg srs-ai';
                    
                    let formattedResponse = typeof data === 'string' ? data : (data.response || data.output || "Recibido. Estamos procesando...");
                    formattedResponse = formattedResponse.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                    
                    aiMsg.innerHTML = formattedResponse;
                    ideaChatBody.appendChild(aiMsg);
                } else {`;

code = code.replace(/\/\/\s*80\/20\s*Fast\s*Mock\s*Response\s*Hook[\s\S]*?if\s*\(\s*response\.ok\s*\)\s*\{/g, trueFetchBlock + '\n                if (true) {');

fs.writeFileSync('app.js', code);
console.log('Fixed app.js locally mock responses!');
