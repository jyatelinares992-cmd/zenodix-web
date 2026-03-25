const fs = require('fs');

try {
    // 1. UPDATE INDEX.HTML class mapping for CSS inheritance
    let html = fs.readFileSync('index.html', 'utf-8');

    // Make idea-chat inherit srs-input-group styles
    html = html.replace('<div class="idea-chat-input-area">', '<div class="idea-chat-input-area srs-input-group">');
    
    // Add same fix to mini chat demo input area if it has the same bug
    html = html.replace('<div class="chat-input-area">', '<div class="chat-input-area srs-input-group">');
    html = html.replace('<div class="mini-chat-input">', '<div class="mini-chat-input srs-input-group">');

    fs.writeFileSync('index.html', html);

    // 2. UPDATE APP.JS logic
    let js = fs.readFileSync('app.js', 'utf-8');

    // A. Visual Feedback update for handleFileSelect
    const oldHandleFileSelect = `window.handleFileSelect = function(inputEl, iconId) {
        const icon = document.getElementById(iconId);
        const label = inputEl.closest('.multimodal-btn');
        if (inputEl.files && inputEl.files[0]) {
            if (icon) icon.style.color = 'var(--color-accent)';
            if (label) label.classList.add('file-attached');
        } else {
            if (icon) icon.style.color = '';
            if (label) label.classList.remove('file-attached');
        }
    };`;

    const newHandleFileSelect = `window.handleFileSelect = function(inputEl, iconId) {
        const icon = document.getElementById(iconId);
        const label = inputEl.closest('.multimodal-btn');
        if (inputEl.files && inputEl.files[0]) {
            if (icon) {
                icon.style.color = 'var(--color-accent)';
                icon.textContent = 'check_circle';
            }
            if (label) label.classList.add('file-attached');
        } else {
            if (icon) {
                icon.style.color = '';
                icon.textContent = 'attach_file';
            }
            if (label) label.classList.remove('file-attached');
        }
    };`;

    js = js.replace(oldHandleFileSelect, newHandleFileSelect);

    // B. Wiring up ideaMicBtn
    if (!js.includes('ideaMicBtn')) {
        const chatJsTarget = "const ideaFileInput = document.getElementById('ideaFileInput');";
        const chatJsReplacement = `const ideaFileInput = document.getElementById('ideaFileInput');
    const ideaMicBtn = document.getElementById('ideaMicBtn');
    
    // Mic logic placeholders
    let ideaMediaRecorder;
    let ideaAudioChunks = [];
    let isIdeaRecording = false;
    let ideaAudioBlob = null;

    if (ideaMicBtn) {
        ideaMicBtn.addEventListener('click', async () => {
            if (isIdeaRecording) {
                ideaMediaRecorder.stop();
                ideaMicBtn.style.backgroundColor = '';
                ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
                isIdeaRecording = false;
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    ideaMediaRecorder = new MediaRecorder(stream);
                    ideaMediaRecorder.start();
                    ideaAudioChunks = [];
                    isIdeaRecording = true;
                    
                    ideaMicBtn.style.backgroundColor = '#ef4444';
                    ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">stop_circle</span>';
                    
                    ideaMediaRecorder.ondataavailable = e => {
                        ideaAudioChunks.push(e.data);
                    };
                    
                    ideaMediaRecorder.onstop = () => {
                        ideaAudioBlob = new Blob(ideaAudioChunks, { type: 'audio/webm' });
                        stream.getTracks().forEach(track => track.stop());
                        
                        ideaMicBtn.style.backgroundColor = '#10b981'; // Green for loaded
                        ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';
                    };
                } catch(err) {
                    alert("Acepta los permisos de micrófono para enviar notas de voz.");
                }
            }
        });
    }
`;
        js = js.replace(chatJsTarget, chatJsReplacement);

        // Adjust ideaSendBtn block to also read ideaAudioBlob
        const beforeSendTarget = "let base64Data = null;\n                if (file && window.getBase64) {\n                    base64Data = await window.getBase64(file);\n                }";
        
        const afterSendTarget = `let base64Data = null;
                if (file && window.getBase64) {
                    base64Data = await window.getBase64(file);
                } else if (ideaAudioBlob && window.getBase64) {
                    base64Data = await window.getBase64(ideaAudioBlob);
                }`;
        js = js.replace(beforeSendTarget, afterSendTarget);
        
        // Adjust the click handler check
        const beforeCheck = "if (!text && !file) return;";
        const afterCheck = "if (!text && !file && !ideaAudioBlob) return;";
        js = js.replace(beforeCheck, afterCheck);
        
        // Reset audio blob on send
        const beforeReset = "if (ideaFileInput) {";
        const afterReset = "ideaAudioBlob = null;\n            if (ideaMicBtn) {\n                ideaMicBtn.style.backgroundColor = '';\n                ideaMicBtn.innerHTML = '<span class=\"material-symbols-outlined\">mic</span>';\n            }\n            if (ideaFileInput) {";
        js = js.replace(beforeReset, afterReset);
    }

    const v = Date.now();
    js = js.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
    fs.writeFileSync('app.js', js);
    
    html = fs.readFileSync('index.html', 'utf-8');
    html = html.replace(/app\.js\?v=\d+/g, 'app.js?v=' + v);
    fs.writeFileSync('index.html', html);

    console.log('Multimodal UI and Event Handlers perfectly fixed.');
} catch (e) {
    console.error(e);
}
