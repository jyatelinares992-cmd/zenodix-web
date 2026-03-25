const fs = require('fs');

try {
    // ----------------------------------------------------------------------
    // 1. UPDATE INDEX.HTML 
    // Inject missing IDs onto the mic buttons
    // ----------------------------------------------------------------------
    let html = fs.readFileSync('index.html', 'utf-8');

    // Panel SRS Mic
    html = html.replace('<button class="chat-icon-btn multimodal-btn" title="Grabar Audio"><span class="material-symbols-outlined">mic</span></button>',
                        '<button id="srsMicBtn" class="chat-icon-btn multimodal-btn" title="Grabar Audio"><span class="material-symbols-outlined">mic</span></button>');

    // Demo Interactive Mic
    // It is located under <div class="mini-chat-input srs-input-group">
    html = html.replace('<button class="chat-icon-btn multimodal-btn"><span class="material-symbols-outlined">mic</span></button>',
                        '<button id="demoMicBtn" class="chat-icon-btn multimodal-btn" title="Voz"><span class="material-symbols-outlined">mic</span></button>');

    // Float Chat Mic
    // Located under <div class="chat-input-area srs-input-group">
    // Wait, the replace above might replace BOTH since they are identical strings!
    // Since replace() only replaces the FIRST occurrence natively, we do it twice.
    // If it fails, we use a regex or while loop. Let's do it cleanly:
    
    // We will just do a global replace for the EXACT generic button string, but with incrementing IDs?
    // Better: split and replace carefully.
    html = fs.readFileSync('index.html', 'utf-8'); // reset
    
    // Explicit targeting by context:
    // SRS context: 
    html = html.replace('title="Grabar Audio"><span class="material-symbols-outlined">mic</span>', 'id="srsMicBtn" title="Grabar Audio"><span class="material-symbols-outlined">mic</span>');
    
    // Demo context: inside id="demoFileAlert" block, there is a generic button right after.
    const demoCtx = '<span class="material-symbols-outlined" id="demoFileAlert">attach_file</span>\n                        </label>\n                        <button class="chat-icon-btn multimodal-btn"><span class="material-symbols-outlined">mic</span></button>';
    const demoCtxRep = '<span class="material-symbols-outlined" id="demoFileAlert">attach_file</span>\n                        </label>\n                        <button id="demoMicBtn" class="chat-icon-btn multimodal-btn" title="Voz"><span class="material-symbols-outlined">mic</span></button>';
    html = html.replace(demoCtx, demoCtxRep);

    // Float context: inside id="floatFileAlert" block
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

    // Inject right after window.getBase64 ends
    js = js.replace('});\n\n    // 1. GSAP Scroll Animations', '});\n' + audioRecorderUtility + '\n    // 1. GSAP Scroll Animations');


    // 2.2 PATCH FLOAT CHAT
    js = js.replace(
        "if (fileInput && fileInput.files.length > 0) {\n                imageBase64 = await window.getBase64(fileInput.files[0]);\n            }",
        "if (fileInput && fileInput.files.length > 0) {\n                imageBase64 = await window.getBase64(fileInput.files[0]);\n            }\n            if (!imageBase64 && floatAudio.getBlob()) {\n                imageBase64 = await window.getBase64(floatAudio.getBlob());\n            }"
    );
    js = js.replace(
        "if (fileInput) {\n                fileInput.value = '';\n                window.handleFileSelect(fileInput, 'floatFileAlert');\n            }",
        "if (fileInput) {\n                fileInput.value = '';\n                window.handleFileSelect(fileInput, 'floatFileAlert');\n            }\n            floatAudio.clear();"
    );
    js = js.replace(
        "if (!messageText) return;",
        "if (!messageText && !floatAudio.getBlob() && !(document.getElementById('floatFileInput') && document.getElementById('floatFileInput').files.length>0)) return;"
    );

    // 2.3 PATCH DEMO CHAT
    js = js.replace(
        "if (fileInput && fileInput.files.length > 0) {\n                    imageBase64 = await window.getBase64(fileInput.files[0]);\n                }",
        "if (fileInput && fileInput.files.length > 0) {\n                    imageBase64 = await window.getBase64(fileInput.files[0]);\n                }\n                if (!imageBase64 && demoAudio.getBlob()) {\n                    imageBase64 = await window.getBase64(demoAudio.getBlob());\n                }"
    );
    js = js.replace(
        "if (fileInput) {\n                    fileInput.value = '';\n                    window.handleFileSelect(fileInput, 'demoFileAlert');\n                }",
        "if (fileInput) {\n                    fileInput.value = '';\n                    window.handleFileSelect(fileInput, 'demoFileAlert');\n                }\n                demoAudio.clear();"
    );
    js = js.replace(
        "if(!text) return;",
        "if (!text && !demoAudio.getBlob() && !(document.getElementById('demoFileInput') && document.getElementById('demoFileInput').files.length>0)) return;"
    );

    // 2.4 PATCH SRS CHAT
    js = js.replace(
        "if (fileInput && fileInput.files.length > 0) {\n                imageBase64 = await window.getBase64(fileInput.files[0]);\n            }",
        "if (fileInput && fileInput.files.length > 0) {\n                imageBase64 = await window.getBase64(fileInput.files[0]);\n            }\n            if (!imageBase64 && srsAudio.getBlob()) {\n                imageBase64 = await window.getBase64(srsAudio.getBlob());\n            }"
    );
    js = js.replace(
        "if (srsFileInput) {\n                srsFileInput.value = '';\n                window.handleFileSelect(srsFileInput, 'srsFileAlert');\n            }",
        "if (srsFileInput) {\n                srsFileInput.value = '';\n                window.handleFileSelect(srsFileInput, 'srsFileAlert');\n            }\n            srsAudio.clear();"
    );
    js = js.replace(
        "if (!text) return;",
        "if (!text && !srsAudio.getBlob() && !(document.getElementById('srsFileInput') && document.getElementById('srsFileInput').files.length>0)) return;"
    );

    // Write back. Note: ideaMicBtn already runs locally, but I should probably link its clear method or just leave it since it works internally independently.
    fs.writeFileSync('app.js', js);
    console.log("Global Audio patches successfully mapped to all Chats.");

} catch(e) {
    console.error(e);
}
