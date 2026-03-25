const fs = require('fs');

try {
    // ----------------------------------------------------------------------
    // 1. UPDATE INDEX.HTML 
    // Inject missing IDs onto the mic buttons
    // ----------------------------------------------------------------------
    let html = fs.readFileSync('index.html', 'utf-8');
    
    // Explicit targeting by context:
    html = html.replace('title="Grabar Audio"><span class="material-symbols-outlined">mic</span>', 'id="srsMicBtn" title="Grabar Audio"><span class="material-symbols-outlined">mic</span>');
    
    const demoCtx = '<span class="material-symbols-outlined" id="demoFileAlert">attach_file</span>\n                        </label>\n                        <button class="chat-icon-btn multimodal-btn"><span class="material-symbols-outlined">mic</span></button>';
    const demoCtxRep = '<span class="material-symbols-outlined" id="demoFileAlert">attach_file</span>\n                        </label>\n                        <button id="demoMicBtn" class="chat-icon-btn multimodal-btn" title="Voz"><span class="material-symbols-outlined">mic</span></button>';
    html = html.replace(demoCtx, demoCtxRep);

    const floatCtx = '<span class="material-symbols-outlined" id="floatFileAlert">attach_file</span>\n                </label>\n                <button class="chat-icon-btn multimodal-btn"><span class="material-symbols-outlined">mic</span></button>';
    const floatCtxRep = '<span class="material-symbols-outlined" id="floatFileAlert">attach_file</span>\n                </label>\n                <button id="floatMicBtn" class="chat-icon-btn multimodal-btn" title="Voz"><span class="material-symbols-outlined">mic</span></button>';
    html = html.replace(floatCtx, floatCtxRep);

    fs.writeFileSync('index.html', html);


    // ----------------------------------------------------------------------
    // 2. UPDATE APP.JS 
    // Standardize Global Recorder and inject into fetch payloads
    // ----------------------------------------------------------------------
    let js = fs.readFileSync('app.js', 'utf-8');

    // 2.1 INJECT GLOBAL AUDIO RECORDER (After handleFileSelect)
    const audioRecorderUtility = `
    // Audio Recorder Factory
    window.initAudioRecorder = function(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return { getBlob: () => null, clear: () => {} };
        
        let mediaRecorder = null;
        let audioChunks = [];
        let isRecording = false;
        let audioBlob = null;
        
        btn.addEventListener('click', async () => {
            if (isRecording) {
                if(mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
                btn.style.backgroundColor = '';
                btn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
                isRecording = false;
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    audioChunks = [];
                    isRecording = true;
                    
                    btn.style.backgroundColor = '#ef4444';
                    btn.innerHTML = '<span class="material-symbols-outlined" style="color:white;">stop_circle</span>';
                    
                    mediaRecorder.ondataavailable = e => {
                        audioChunks.push(e.data);
                    };
                    
                    mediaRecorder.onstop = () => {
                        audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        stream.getTracks().forEach(track => track.stop());
                        
                        btn.style.backgroundColor = '#10b981'; // Green (success)
                        btn.innerHTML = '<span class="material-symbols-outlined" style="color:white;">check</span>';
                    };
                } catch(err) {
                    alert("Acepta los permisos de micrófono para enviar notas de voz.");
                }
            }
        });
        
        return {
            getBlob: () => audioBlob,
            clear: () => {
                audioBlob = null;
                if(isRecording && mediaRecorder) {
                    mediaRecorder.stop();
                    isRecording = false;
                }
                btn.style.backgroundColor = '';
                btn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
            }
        };
    };

    const floatAudio = window.initAudioRecorder('floatMicBtn');
    const demoAudio = window.initAudioRecorder('demoMicBtn');
    const srsAudio = window.initAudioRecorder('srsMicBtn');
    `;

    // Only inject if it's not already there
    if (!js.includes('window.initAudioRecorder')) {
        js = js.replace('});\n\n    // 1. GSAP Scroll Animations', '});\n' + audioRecorderUtility + '\n    // 1. GSAP Scroll Animations');
    }

    // 2.2 UPDATE `appendMessage` to innerHTML so we can render <img> and <audio> tags
    js = js.replace("msgDiv.textContent = text;", "msgDiv.innerHTML = text;");

    // 2.3 PATCH FLOAT CHAT
    // We rewrite the sendMessage block entirely for clarity and precision
    const floatRegex = /const sendMessage = async \(\) => \{([\s\S]*?)\/\/ Hello, World!/g; // Using string indexOf instead
    const startFloat = js.indexOf("const sendMessage = async () => {");
    const endFloat = js.indexOf("const appendMessage = (text, className) => {", startFloat);
    if(startFloat > -1) {
        let replacementFloatMap = `const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        const fileInput = document.getElementById('floatFileInput');
        const file = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
        const audio = floatAudio ? floatAudio.getBlob() : null;

        if (!messageText && !file && !audio) return;

        let userContent = messageText;
        if (file) {
            const url = URL.createObjectURL(file);
            userContent += \`<br><img src="\${url}" style="max-width:200px; border-radius:8px; display:block; margin-top:8px;">\`;
        }
        if (audio) {
            const url = URL.createObjectURL(audio);
            userContent += \`<br><audio controls src="\${url}" style="height:35px; width:200px; margin-top:8px;"></audio>\`;
        }

        // 1. Append User Message
        appendMessage(userContent, 'user-message');
        chatInput.value = '';

        // 2. CLEAR Inputs
        if (fileInput) {
            fileInput.value = '';
            window.handleFileSelect(fileInput, 'floatFileAlert');
        }
        if (floatAudio) floatAudio.clear();

        // 3. Send to Webhook
        try {
            const loadingId = appendMessage('...', 'ai-message');
            
            let imageBase64 = null;
            if (file) imageBase64 = await window.getBase64(file);
            else if (audio) imageBase64 = await window.getBase64(audio);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: messageText || "Analizar archivo",
                    ...(imageBase64 && { imageBase64: imageBase64 })
                })
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            const loadingMsg = document.getElementById(loadingId);
            if(loadingMsg) loadingMsg.remove();

            const aiResponse = data.response || data.message || "Recibido. Estamos procesando tus requerimientos...";
            appendMessage(aiResponse, 'ai-message');

        } catch (error) {
            console.error('Error in chatbot fetch:', error);
            const loadingMsg = document.querySelector('.ai-message:last-child');
            if(loadingMsg && loadingMsg.textContent === '...') loadingMsg.remove();
            appendMessage('Lo sentimos, ha ocurrido un error de conexión. Inténtalo de nuevo.', 'ai-message');
        }
    };

    //`;
        js = js.substring(0, startFloat) + replacementFloatMap + js.substring(endFloat + 6);
    }


    // 2.4 PATCH DEMO CHAT
    const startDemo = js.indexOf("const sendDemoMessage = async () => {");
    const endDemo = js.indexOf("demoSendBtn.addEventListener('click', sendDemoMessage);", startDemo);
    if(startDemo > -1) {
        let replacementDemoMap = `const sendDemoMessage = async () => {
            const text = demoChatInput.value.trim();
            const fileInput = document.getElementById('demoFileInput');
            const file = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
            const audio = demoAudio ? demoAudio.getBlob() : null;

            if(!text && !file && !audio) return;
            
            let userContent = text;
            if (file) userContent += \`<br><img src="\${URL.createObjectURL(file)}" style="max-width:180px; border-radius:8px; display:block; margin-top:8px;">\`;
            if (audio) userContent += \`<br><audio controls src="\${URL.createObjectURL(audio)}" style="height:35px; width:180px; margin-top:8px;"></audio>\`;

            demoChatArea.innerHTML += \`<div class="msg user-msg">\${userContent}</div>\`;
            demoChatInput.value = '';
            
            if (fileInput) {
                fileInput.value = '';
                window.handleFileSelect(fileInput, 'demoFileAlert');
            }
            if(demoAudio) demoAudio.clear();
            
            demoChatArea.scrollTop = demoChatArea.scrollHeight;
            
            const loadingId = 'load-' + Date.now();
            demoChatArea.innerHTML += \`<div class="msg ai-msg" id="\${loadingId}">Escribiendo...</div>\`;
            demoChatArea.scrollTop = demoChatArea.scrollHeight;
            
            try {
                let imageBase64 = null;
                if (file) imageBase64 = await window.getBase64(file);
                else if (audio) imageBase64 = await window.getBase64(audio);

                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: text || "Analizar archivo", 
                        source: 'demo_card',
                        sessionId: 'demo_session_' + Date.now(),
                        ...(imageBase64 && { imageBase64: imageBase64 })
                    })
                });
                
                const data = await response.json();
                document.getElementById(loadingId).remove();
                demoChatArea.innerHTML += \`<div class="msg ai-msg">\${data.response || data.message || "¡Conexión exitosa!"}</div>\`;
                demoChatArea.scrollTop = demoChatArea.scrollHeight;
            } catch (e) {
                document.getElementById(loadingId).remove();
                demoChatArea.innerHTML += \`<div class="msg ai-msg" style="color: red;">Error: Webhook no está disponible.</div>\`;
            }
        };

        `;
        js = js.substring(0, startDemo) + replacementDemoMap + js.substring(endDemo);
    }

    // 2.5 PATCH IDEA CHAT (Fixing User Message injection)
    // Replace the plain text attachment string with actual image/blob URLs 
    js = js.replace(
        "if (file) userContent += ` <br><small style=\"color:var(--color-accent); font-weight:600;\">[Adjunto: ${file.name}]</small>`;",
        "if (file) userContent += `<br><img src=\"\${URL.createObjectURL(file)}\" style=\"max-width:200px; border-radius:8px; display:block; margin-top:8px;\">`;\n            if (ideaAudioBlob) userContent += `<br><audio controls src=\"\${URL.createObjectURL(ideaAudioBlob)}\" style=\"height:35px; width:200px; margin-top:8px;\"></audio>`;"
    );

    // 2.6 PATCH SRS CHAT
    const startSrs = js.indexOf("const srsSendMessage = async () => {");
    const endSrs = js.indexOf("document.getElementById('srsChatInput').addEventListener('keypress', (e) => {", startSrs);
    if(startSrs > -1) {
        let replacementSrsMap = `const srsSendMessage = async () => {
        const text = document.getElementById('srsChatInput').value.trim();
        const srsFileInput = document.getElementById('srsFileInput');
        const file = srsFileInput && srsFileInput.files && srsFileInput.files.length > 0 ? srsFileInput.files[0] : null;
        const audio = srsAudio ? srsAudio.getBlob() : null;

        if (!text && !file && !audio) return;
        
        let userContent = text;
        if (file) userContent += \`<br><img src="\${URL.createObjectURL(file)}" style="max-width:200px; border-radius:8px; display:block; margin-top:8px;">\`;
        if (audio) userContent += \`<br><audio controls src="\${URL.createObjectURL(audio)}" style="height:35px; width:200px; margin-top:8px;"></audio>\`;

        const userMsg = document.createElement('div');
        userMsg.className = 'srs-msg srs-user';
        userMsg.innerHTML = userContent || '[Archivo Adjunto]';
        srsChatBody.appendChild(userMsg);
        
        document.getElementById('srsChatInput').value = '';
        if (srsFileInput) {
            srsFileInput.value = '';
            window.handleFileSelect(srsFileInput, 'srsFileAlert');
        }
        if(srsAudio) srsAudio.clear();
        
        srsChatBody.scrollTop = srsChatBody.scrollHeight;

        const typing = document.createElement('div');
        typing.className = 'srs-msg srs-ai';
        typing.innerHTML = '<span class="typing-indicator"><span>•</span><span>•</span><span>•</span></span>';
        srsChatBody.appendChild(typing);
        srsChatBody.scrollTop = srsChatBody.scrollHeight;

        try {
            let imageBase64 = null;
            if (file) imageBase64 = await window.getBase64(file);
            else if (audio) imageBase64 = await window.getBase64(audio);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    message: text || "Analizar archivo adjunto.",
                    action: "srs_consult",
                    imageBase64: imageBase64
                })
            });

            srsChatBody.removeChild(typing);

            if (response.ok) {
                const data = await response.json();
                const aiMsg = document.createElement('div');
                aiMsg.className = 'srs-msg srs-ai';
                
                let formattedResponse = typeof data === 'string' ? data : (data.response || data.output || "Requerimiento recibido.");
                formattedResponse = formattedResponse.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                
                aiMsg.innerHTML = formattedResponse;
                srsChatBody.appendChild(aiMsg);

                if (formattedResponse.includes('DOCUMENTO FINALIZADO') || formattedResponse.includes('enviar todo al WhatsApp')) {
                    document.getElementById('srsActionArea').style.display = 'block';
                }
            } else {
                const errUi = document.createElement('div');
                errUi.className = 'srs-msg srs-ai';
                errUi.style.color = '#ef4444';
                errUi.textContent = 'Hubo un error de conexión. Por favor, intenta de nuevo.';
                srsChatBody.appendChild(errUi);
            }
        } catch(e) {
            if (typing.parentElement) srsChatBody.removeChild(typing);
            const errUi = document.createElement('div');
            errUi.className = 'srs-msg srs-ai';
            errUi.style.color = '#ef4444';
            errUi.textContent = 'Error de red al conectar al orquestador AI.';
            srsChatBody.appendChild(errUi);
        }
        srsChatBody.scrollTop = srsChatBody.scrollHeight;
    };

    `;
        js = js.substring(0, startSrs) + replacementSrsMap + js.substring(endSrs);
    }

    fs.writeFileSync('app.js', js);
    console.log("Global Audio + Image Loading visually patched into User Messages for all chats.");

} catch(e) {
    console.error(e);
}
