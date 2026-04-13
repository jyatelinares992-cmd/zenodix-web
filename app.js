document.addEventListener('DOMContentLoaded', () => {
    const N8N_WEBHOOK_URL = 'https://zenodixapp.app.n8n.cloud/webhook/zenodix-b2b-sales';
    
    // 0. Base64 Helpers for Multimodal Chats
    window.handleFileSelect = function(inputEl, iconId) {
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
    };
    
    window.getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // Global function to capture AI-generated registration forms
    window.submitAIChatRegistration = async function(btn) {
        try {
            const container = btn.parentElement;
            const messagesContainer = btn.closest('.chat-messages, .mini-chat-messages, .idea-chat-body, .srs-chat-body');
            const inputs = container.querySelectorAll('input');
            if (inputs.length < 2) return;
            
            const name = inputs[0].value.trim();
            const phone = inputs[1].value.trim();
            
            if (!name || !phone) {
                alert("Por favor completa tu Nombre y WhatsApp para continuar.");
                return;
            }
            
            inputs.forEach(i => { i.disabled = true; i.style.opacity = '0.7'; });
            btn.disabled = true;
            btn.innerText = "Registrando...";
            btn.style.opacity = '0.7';
            
            const messageText = `Mis datos de registro son: Nombre: ${name}, WhatsApp: ${phone}`;
            
            const printMsg = (text, cls) => {
                const msgEl = document.createElement('div');
                msgEl.classList.add('chat-message', cls);
                msgEl.innerHTML = text;
                if(messagesContainer) {
                    messagesContainer.appendChild(msgEl);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                return msgEl;
            };
            
            printMsg(messageText, 'user-message');
            const loadingMsg = printMsg('...', 'ai-message');
            
            const N_URL = 'https://zenodixapp.app.n8n.cloud/webhook/zenodix-b2b-sales';
            const sessionId = localStorage.getItem('zenodix_ai_session') || ('session_' + Math.random().toString(36).substr(2, 9));
            localStorage.setItem('zenodix_ai_session', sessionId); 
            
            const response = await fetch(N_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    message: messageText
                })
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            if(loadingMsg) loadingMsg.remove();

            const aiResponse = data.response || data.message || "Éxito. Recibido en nuestro sistema.";
            printMsg(aiResponse, 'ai-message');
            
            container.style.display = 'none';

        } catch (e) {
            console.error("Error submitting AI registration:", e);
        }
    };

    // Audio Recorder Factory (REPARADO: Auto-Stop y Promesas)
    window.initAudioRecorder = function(btnId) {
        const btn = document.getElementById(btnId);
        if (!btn) return { getBlob: async () => null, clear: () => {} };
        
        let mediaRecorder = null;
        let audioChunks = [];
        let isRecording = false;
        let audioBlob = null;
        let resolveBlob = null; // Promesa para esperar el audio si se envía rápido
        
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
                    audioBlob = null;
                    
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
                        
                        if(resolveBlob) {
                            resolveBlob(audioBlob);
                            resolveBlob = null;
                        }
                    };
                } catch(err) {
                    alert("Acepta los permisos de micrófono para enviar notas de voz.");
                }
            }
        });
        
        return {
            getBlob: async () => {
                if (isRecording && mediaRecorder) {
                    // Si sigue grabando, detenemos y esperamos a que se genere el Blob
                    const p = new Promise(r => resolveBlob = r);
                    mediaRecorder.stop();
                    isRecording = false;
                    btn.style.backgroundColor = '';
                    btn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
                    return await p;
                }
                return audioBlob;
            },
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
    
    // 1. GSAP Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // 2. Interactive Constellation Canvas (Hero Section)
    const heroSection = document.getElementById('hero-section');
    const canvas = document.getElementById('hero-canvas');
    
    if (heroSection && canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: null, y: null, radius: 150 };
        
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        const resize = () => {
            width = heroSection.offsetWidth;
            height = heroSection.offsetHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 1; 
                this.speedX = Math.random() * 0.8 - 0.4;
                this.speedY = Math.random() * 0.8 - 0.4;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > width || this.x < 0) this.speedX *= -1.0;
                if (this.y > height || this.y < 0) this.speedY *= -1.0;

                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouse.radius - distance) / mouse.radius;
                        this.speedX -= forceDirectionX * force * 0.05;
                        this.speedY -= forceDirectionY * force * 0.05;
                    }
                }
                
                const maxSpeed = 1.5;
                this.speedX = Math.max(-maxSpeed, Math.min(maxSpeed, this.speedX));
                this.speedY = Math.max(-maxSpeed, Math.min(maxSpeed, this.speedY));
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 85, 255, 0.6)';
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            let numberOfParticles = (width * height) / 10000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i; j < particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 110) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 85, 255, ${0.15 - distance/750})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                
                if (mouse.x != null) {
                    let dx = particles[i].x - mouse.x;
                    let dy = particles[i].y - mouse.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 255, 204, ${0.8 - distance/mouse.radius})`; 
                        ctx.lineWidth = 1.2;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();
    }

    // 3. Node Ecosystem Canvas Connections
    const setupNodeCanvas = () => {
        const canvas = document.getElementById('nodeConnections');
        const container = document.querySelector('.node-container');
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let animationFrameId;

        let hoveredNodeIndex = -1; 
        
        const centerNode = container.querySelector('.center-hub');
        const satellites = Array.from(container.querySelectorAll('.satellite'));
        
        centerNode.addEventListener('mouseenter', () => hoveredNodeIndex = 0);
        centerNode.addEventListener('mouseleave', () => hoveredNodeIndex = -1);
        if (centerNode) centerNode.dataset.baseTransform = 'translate(-50%, -50%)';
        
        satellites.forEach((sat, idx) => {
            sat.addEventListener('mouseenter', () => hoveredNodeIndex = idx + 1);
            sat.addEventListener('mouseleave', () => hoveredNodeIndex = -1);
            sat.dataset.baseTransform = 'translate(-50%, -50%)';
        });

        const wrapper = document.querySelector('.node-network-wrapper');
        
        const resizeCanvas = () => {
            width = wrapper.offsetWidth;
            height = wrapper.offsetHeight;
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        };

        let time = 0;
        const drawConnections = () => {
            ctx.clearRect(0, 0, width, height);
            
            if (!centerNode) return;

            const timeJS = Date.now() * 0.001;
            
            if (centerNode) {
                const offsetX = Math.sin(timeJS) * 5;
                const offsetY = Math.cos(timeJS * 1.2) * 5;
                centerNode.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            }

            satellites.forEach((sat, index) => {
                const offsetX = Math.sin(timeJS + index) * 10;
                const offsetY = Math.cos(timeJS * 1.1 + index) * 10;
                sat.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
            });

            const canvasRect = canvas.getBoundingClientRect();
            
            const allNodes = [centerNode, ...satellites];
            const coords = allNodes.map((node, i) => {
                const icon = node.querySelector('.node-icon');
                const iRect = icon.getBoundingClientRect();
                return {
                    x: (iRect.left - canvasRect.left) + (iRect.width / 2),
                    y: (iRect.top - canvasRect.top) + (iRect.height / 2),
                    index: i
                };
            });

            const globalFlow = (Math.sin(time * 0.05) + 1) / 2;

            if (hoveredNodeIndex !== -1) {
                const origin = coords[hoveredNodeIndex];
                const originDataNode = allNodes[hoveredNodeIndex].dataset.node;
                
                const excludedConnections = [
                    ['shopify', 'woocommerce'],
                    ['woocommerce', 'shopify'] 
                ];

                coords.forEach((dest, i) => {
                    if (i === hoveredNodeIndex) return;

                    const destDataNode = allNodes[i].dataset.node;
                    const isExcluded = excludedConnections.some(pair => 
                        (pair[0] === originDataNode && pair[1] === destDataNode)
                    );

                    if (isExcluded) return; 
                    
                    ctx.beginPath();
                    ctx.moveTo(origin.x, origin.y);
                    ctx.lineTo(dest.x, dest.y);
                    
                    ctx.strokeStyle = '#0055FF';
                    ctx.lineWidth = 2.5;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#0055FF';
                    ctx.stroke();

                    let progress = ((time * 2.5 + (i * 15)) % 100) / 100;
                    const px = origin.x + (dest.x - origin.x) * progress;
                    const py = origin.y + (dest.y - origin.y) * progress;

                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#00FFCC';
                    ctx.fill();
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00FFCC';
                });
            } else {
                const cx = coords[0].x;
                const cy = coords[0].y;
                const satCoords = coords.slice(1);

                satCoords.forEach((coord, index) => {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(coord.x, coord.y);
                    
                    ctx.strokeStyle = `rgba(0, 85, 255, ${0.15 + (globalFlow * 0.15)})`;
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 0;
                    ctx.stroke();

                    let progress1 = ((time + (index * 20)) % 100) / 100;
                    const px1 = cx + (coord.x - cx) * progress1;
                    const py1 = cy + (coord.y - cy) * progress1;

                    ctx.beginPath();
                    ctx.arc(px1, py1, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 85, 255, 0.8)';
                    ctx.fill();
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#0055ff';
                });

                satCoords.forEach((coord, index) => {
                    const next1 = (index + 1) % satCoords.length;
                    const next2 = (index + 2) % satCoords.length;
                    
                    ctx.beginPath();
                    ctx.moveTo(coord.x, coord.y);
                    ctx.lineTo(satCoords[next1].x, satCoords[next1].y);
                    
                    const flow = (Math.sin(time * 0.05 + index) + 1) / 2;
                    ctx.strokeStyle = `rgba(0, 85, 255, ${0.08 + (flow * 0.12)})`;
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 0;
                    ctx.stroke();

                    let progress2 = ((time + (index * 35)) % 100) / 100;
                    if (index % 2 === 0) progress2 = 1 - progress2;

                    const px2 = coord.x + (satCoords[next1].x - coord.x) * progress2;
                    const py2 = coord.y + (satCoords[next1].y - coord.y) * progress2;

                    ctx.beginPath();
                    ctx.arc(px2, py2, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 255, 170, 0.6)';
                    ctx.fill();
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#00ffaa';
                    
                    ctx.beginPath();
                    ctx.moveTo(coord.x, coord.y);
                    ctx.lineTo(satCoords[next2].x, satCoords[next2].y);
                    
                    const flow2 = (Math.sin(time * 0.04 + index) + 1) / 2;
                    ctx.strokeStyle = `rgba(0, 85, 255, ${0.04 + (flow2 * 0.08)})`;
                    ctx.lineWidth = 0.5;
                    ctx.shadowBlur = 0;
                    ctx.stroke();
                });
            }

            time += 0.5;
            animationFrameId = requestAnimationFrame(drawConnections);
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            drawConnections();
        });

        resizeCanvas();
        drawConnections();
    };
    
    window.addEventListener('load', setupNodeCanvas);

    gsap.from('.pricing-card', {
        scrollTrigger: {
            trigger: '.pricing-grid',
            start: "top 85%",
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out"
    });

    gsap.utils.toArray('.animate-on-scroll').forEach(element => {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out"
        });
    });

    let mm = gsap.matchMedia();
    mm.add("(min-width: 769px)", () => {
        gsap.to('.timeline-progress', {
            scrollTrigger: { 
                trigger: '.timeline-container', 
                start: "top 65%", 
                end: "bottom 45%", 
                scrub: 1,
                onUpdate: (self) => {
                    document.querySelectorAll('.timeline-step').forEach((step, index) => {
                        if (self.progress >= index / 3) step.classList.add('active');
                        else step.classList.remove('active');
                    });
                }
            },
            width: "100%", ease: "none"
        });
    });
    mm.add("(max-width: 768px)", () => {
        gsap.to('.timeline-progress', {
            scrollTrigger: { 
                trigger: '.timeline-container', 
                start: "top 75%", 
                end: "bottom 25%", 
                scrub: 1,
                onUpdate: (self) => {
                    document.querySelectorAll('.timeline-step').forEach((step, index) => {
                        if (self.progress >= index / 3) step.classList.add('active');
                        else step.classList.remove('active');
                    });
                }
            },
            height: "100%", ease: "none"
        });
    });

    const observerCounters = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetEl = entry.target;
                const targetNum = parseFloat(targetEl.getAttribute('data-target'));
                const prefix = targetEl.getAttribute('data-prefix') || '';
                const suffix = targetEl.getAttribute('data-suffix') || '';

                let startObj = { val: 0 };
                gsap.to(startObj, {
                    val: targetNum,
                    duration: 2.5,
                    ease: "power2.out",
                    onUpdate: () => {
                        targetEl.textContent = prefix + (targetNum % 1 !== 0 ? startObj.val.toFixed(1) : Math.floor(startObj.val)) + suffix;
                    }
                });
                observer.unobserve(targetEl);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.metric-number').forEach(el => observerCounters.observe(el));

    // 2. Chatbot Logic (n8n Integration)
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatArea = document.getElementById('chatArea');

    const toggleChat = () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    };

    chatToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);

    const sendMessage = async () => {
        const messageText = chatInput.value.trim();
        const fileInput = document.getElementById('floatFileInput');
        const file = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
        // REPARADO: Se espera a que el audio se empaquete
        const audio = floatAudio ? await floatAudio.getBlob() : null;

        if (!messageText && !file && !audio) return;

        let userContent = messageText;
        if (file) {
            const url = URL.createObjectURL(file);
            userContent += `<br><img src="${url}" style="max-width:200px; border-radius:8px; display:block; margin-top:8px;">`;
        }
        if (audio) {
            const url = URL.createObjectURL(audio);
            userContent += `<br><audio controls src="${url}" style="height:35px; width:200px; margin-top:8px;"></audio>`;
        }

        appendMessage(userContent, 'user-message');
        chatInput.value = '';

        if (fileInput) {
            fileInput.value = '';
            window.handleFileSelect(fileInput, 'floatFileAlert');
        }
        if (floatAudio) floatAudio.clear();

        try {
            const loadingId = appendMessage('...', 'ai-message');
            
            let base64Image = "";
            let base64Audio = "";
            
            // REPARADO: Ahora pueden enviarse archivos y audios a la vez
            if (file) base64Image = await window.getBase64(file);
            if (audio) base64Audio = await window.getBase64(audio);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: localStorage.getItem('zenodix_ai_session') || ('session_' + Math.random().toString(36).substr(2, 9)),
                    message: messageText || "Analizar archivo adjunto.",
                    imageBase64: base64Image,
                    audioBase64: base64Audio
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

    const appendMessage = (text, className) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', className);
        msgDiv.innerHTML = text;
        const id = 'msg-' + Date.now();
        msgDiv.id = id;
        
        chatArea.appendChild(msgDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
        return id;
    };

    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    const demoChatInput = document.getElementById('demoChatInput');
    const demoSendBtn = document.getElementById('demoSendBtn');
    const demoChatArea = document.getElementById('demoChatArea');

    if(demoSendBtn && demoChatInput && demoChatArea) {
        const sendDemoMessage = async () => {
            const text = demoChatInput.value.trim();
            const fileInput = document.getElementById('demoFileInput');
            const file = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;
            // REPARADO
            const audio = demoAudio ? await demoAudio.getBlob() : null;

            if(!text && !file && !audio) return;
            
            let userContent = text;
            if (file) userContent += `<br><img src="${URL.createObjectURL(file)}" style="max-width:180px; border-radius:8px; display:block; margin-top:8px;">`;
            if (audio) userContent += `<br><audio controls src="${URL.createObjectURL(audio)}" style="height:35px; width:180px; margin-top:8px;"></audio>`;

            demoChatArea.innerHTML += `<div class="msg user-msg">${userContent}</div>`;
            demoChatInput.value = '';
            
            if (fileInput) {
                fileInput.value = '';
                window.handleFileSelect(fileInput, 'demoFileAlert');
            }
            if(demoAudio) demoAudio.clear();
            
            demoChatArea.scrollTop = demoChatArea.scrollHeight;
            
            const loadingId = 'load-' + Date.now();
            demoChatArea.innerHTML += `<div class="msg ai-msg" id="${loadingId}">Escribiendo...</div>`;
            demoChatArea.scrollTop = demoChatArea.scrollHeight;
            
            try {
                let base64Image = "";
                let base64Audio = "";
                
                // REPARADO
                if (file) base64Image = await window.getBase64(file);
                if (audio) base64Audio = await window.getBase64(audio);

                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: text || "Analizar archivo adjunto.", 
                        source: 'demo_card',
                        sessionId: localStorage.getItem('zenodix_ai_session') || ('session_' + Date.now()),
                        imageBase64: base64Image,
                        audioBase64: base64Audio
                    })
                });
                
                const data = await response.json();
                document.getElementById(loadingId).remove();
                demoChatArea.innerHTML += `<div class="msg ai-msg">${data.response || data.message || "¡Conexión exitosa!"}</div>`;
                demoChatArea.scrollTop = demoChatArea.scrollHeight;
            } catch (e) {
                document.getElementById(loadingId).remove();
                demoChatArea.innerHTML += `<div class="msg ai-msg" style="color: red;">Error: Webhook no está disponible.</div>`;
            }
        };

        demoSendBtn.addEventListener('click', sendDemoMessage);
        demoChatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendDemoMessage(); });
    }

    const quickReplyBtns = document.querySelectorAll('.quick-reply-btn');
    const quickRepliesContainer = document.getElementById('quickRepliesContainer');

    quickReplyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent;
            
            if (quickRepliesContainer) {
                quickRepliesContainer.remove();
            }

            appendMessage(text, 'user-message');

            const id = appendMessage('Escribiendo...', 'ai-message');
            
            setTimeout(() => {
                const msgEl = document.getElementById(id);
                if (text === 'Cotizar Ecosistema' || text === 'Hablar con Asesor') {
                    if(msgEl) msgEl.textContent = "¡Excelente! Te llevaré a nuestro canal seguro de WhatsApp para configurar tu cotización y agendar tu cita.";
                    setTimeout(() => {
                        window.open("https://wa.me/573214741783?text=Hola%20Zenodix%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20ecosistemas.", "_blank");
                    }, 2000);
                } else if (text === 'Ver Portafolio') {
                    if(msgEl) msgEl.textContent = "Claro, puedes ver nuestros casos de éxito y ecosistemas creados en la sección de Servicios de nuestra web.";
                    setTimeout(() => {
                        window.location.href = "#servicios";
                    }, 1500);
                }
            }, 1000);
        });
    });

    window.openAppPanel = function(panelId, inputName) {
        const buttons = document.querySelectorAll('.app-icon-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes(panelId));
        if (activeBtn) activeBtn.classList.add('active');

        const panels = document.querySelectorAll('.app-panel');
        panels.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
            const content = p.querySelector('.accordion-content');
            if (content) {
                content.style.maxHeight = '0';
                content.style.display = 'none';
            }
        });

        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.style.display = 'block';
            
            const content = targetPanel.querySelector('.accordion-content');
            if (content) {
                content.style.display = 'block';
                content.style.opacity = '1';
                content.style.visibility = 'visible';
                content.style.maxHeight = 'none';
                content.style.overflow = 'visible';
            }
            
            const staticContent = targetPanel.querySelector('.service-card-content');
            if (staticContent) {
                staticContent.style.display = 'flex';
                staticContent.style.opacity = '1';
            }
        }
    };

    const accordionHeaders = document.querySelectorAll('.accordion-header');
    const serviceInputs = document.querySelectorAll('.service-radio, .service-checkbox');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cartTotalDisplay');
    const btnCheckoutWa = document.getElementById('btn-checkout-wa');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const content = accordionItem.querySelector('.accordion-content');
            
            accordionItem.classList.toggle('active');
            
            if (accordionItem.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = "0";
            }
        });
    });

    const updateCart = () => {
        let totalCOP = 0;
        const selectedServices = [];

        serviceInputs.forEach(input => {
            if (input.checked) {
                const price = parseFloat(input.getAttribute('data-price'));
                totalCOP += price;
                
                let categoryName = "";
                if(input.name === "growth_tier") categoryName = "👑 Growth Partner";
                else if(input.name === "landing_tier") categoryName = "Landing Pages";
                else if(input.name === "corp_tier") categoryName = "Web Corporativa";
                else if(input.name === "ecom_tier") categoryName = "E-commerce Pro";
                else if(input.name === "social_tier") categoryName = "Redes IA";
                else if(input.name === "voice_tier") categoryName = "Voice AI & Agentes";
                else if(input.name === "data_tier") categoryName = "Data Analytics";
                else if(input.name === "power_ups") categoryName = "Power-Ups";

                selectedServices.push({ 
                    category: categoryName,
                    name: input.value, 
                    price: price,
                    inputName: input.name
                });
            }
        });

        const currency = activeCurrency;
        const rates = {
            COP: 1,
            USD: 1 / 4000,
            MXN: 1 / 235,
            CLP: 1 / 4.2,
            ARS: 1 / 4
        };
        const rate = rates[currency] || 1;
        const subtotalLocal = totalCOP * rate;
        
        const formatter = new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: (currency === 'COP' || currency === 'CLP') ? 0 : 2,
            maximumFractionDigits: (currency === 'COP' || currency === 'CLP') ? 0 : 2
        });

        const distinctCategories = new Set(selectedServices.filter(s => s.inputName !== 'power_ups').map(s => s.category)).size;
        
        let discountPercent = 0;
        if (distinctCategories === 2) discountPercent = 0.10; 
        else if (distinctCategories >= 3) discountPercent = 0.15; 
        
        const discountAmount = subtotalLocal * discountPercent;
        const finalTotal = subtotalLocal - discountAmount;

        serviceInputs.forEach(input => {
            const basePriceCOP = parseFloat(input.getAttribute('data-price'));
            const localPrice = basePriceCOP * rate;
            const tierCard = input.nextElementSibling;
            if (tierCard) {
                const priceDiv = tierCard.querySelector('.tier-price');
                if (priceDiv) {
                    const prefix = input.type === 'checkbox' ? '+' : '';
                    priceDiv.textContent = `${prefix}$${formatter.format(localPrice)} ${currency}`;
                }
            }
        });

        if (selectedServices.length === 0) {
            cartItemsList.innerHTML = '<li class="empty-cart-msg">Aún no has seleccionado ningún servicio.</li>';
        } else {
            cartItemsList.innerHTML = selectedServices.map(s => {
                const itemLocalPrice = s.price * rate;
                return `<li>
                            <div style="display:flex; align-items:flex-start; gap: 0.5rem; justify-content:space-between; width:100%;">
                                <span style="display:flex; flex-direction:column; flex:1;">
                                    <small style="color:var(--color-text-secondary); font-size:0.75rem;">${s.category}</small>
                                    <strong>${s.name}</strong>
                                    ${s.inputName === 'social_tier' ? '<span style="font-size:0.7rem; color:#8B5CF6; font-weight:600; margin-top:0.2rem;">Suscripción Mensual</span>' : '<span style="font-size:0.7rem; color:#10b981; margin-top:0.2rem;">Pago Único</span>'}
                                </span> 
                                <span style="display:flex; align-items:center; gap: 10px;">
                                    <span>$${formatter.format(itemLocalPrice)}</span>
                                    <button class="cart-item-remove" data-input-name="${s.inputName}" data-input-val="${s.name}" style="background:none; border:none; padding:4px; margin:0; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:4px; transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.backgroundColor='transparent'" title="Quitar item">
                                        <span class="material-symbols-outlined" style="font-size:18px; color:#ef4444;">close</span>
                                    </button>
                                </span>
                            </div>
                        </li>`;
            }).join('');
        }

        if (discountPercent > 0) {
            cartTotalDisplay.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; text-align:right;">
                    <span style="font-size:0.85rem; color:var(--color-text-secondary); text-decoration:line-through;">$${formatter.format(subtotalLocal)} ${currency}</span>
                    <span style="font-size:0.85rem; color:#10b981; font-weight:600; margin-bottom:0.25rem;">-${(discountPercent*100)}% Dto (Paquete Nivel ${distinctCategories})</span>
                    <strong>$${formatter.format(finalTotal)} ${currency}</strong>
                </div>
            `;
        } else {
            cartTotalDisplay.innerHTML = `<strong>$${formatter.format(finalTotal)} ${currency}</strong>`;
        }

        let waText = "Hola Zenodix, quiero este ecosistema de ventas:\n\n";
        let hasGrowth = false;
        selectedServices.forEach(s => {
            if (s.inputName === 'growth_tier') hasGrowth = true;
            const billingType = s.inputName === 'social_tier' ? '(Suscripción Mensual)' : '(Pago Único)';
            waText += `- ${s.category}: ${s.name} ($${formatter.format(s.price*rate)} ${billingType})\n`;
        });
        
        if (discountPercent > 0) {
            waText += `\nSubtotal: $${formatter.format(subtotalLocal)}\nDescuento Paquete: -$${formatter.format(discountAmount)}`;
        }
        waText += `\n*Total estimado a Invertir:* ${formatter.format(finalTotal)} ${currency}.\n\n`;
        if (hasGrowth) {
            waText += "Me interesa aplicar al modelo Growth Partner con RevShare.\n\n";
        }
        waText += `Quiero iniciar mi desarrollo con ustedes.`;
        
        const encodedText = encodeURIComponent(waText);
        if (btnCheckoutWa) btnCheckoutWa.href = `https://wa.me/573214741783?text=${encodedText}`;
    };

    if (serviceInputs.length > 0) {
        serviceInputs.forEach(input => {
            input.addEventListener('click', function(e) {
                if(this.type === 'radio') {
                    if (this.wasChecked) {
                        this.checked = false;
                        this.wasChecked = false;
                        updateCart();
                    } else {
                        serviceInputs.forEach(r => {
                            if (r.name === this.name) r.wasChecked = false;
                        });
                        this.wasChecked = true;
                    }
                }
            });
            input.addEventListener('change', updateCart);
        });
    }

    const customSelectWrapper = document.getElementById('currencySelectWrapper');
    let activeCurrency = 'USD'; 
    
    const setCurrency = (value) => {
        if (!customSelectWrapper) return;
        const options = customSelectWrapper.querySelectorAll('.custom-option');
        const customValueSpan = document.getElementById('customSelectValue');
        
        options.forEach(opt => {
            if (opt.getAttribute('data-value') === value) {
                activeCurrency = value;
                customValueSpan.textContent = opt.textContent;
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            }
        });
        updateCart();
    };

    if (customSelectWrapper) {
        const trigger = customSelectWrapper.querySelector('.custom-select-trigger');
        const options = customSelectWrapper.querySelectorAll('.custom-option');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelectWrapper.classList.toggle('open');
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                setCurrency(value);
                customSelectWrapper.classList.remove('open');
            });
        });
        
        document.addEventListener('click', () => {
            customSelectWrapper.classList.remove('open');
        });
    }

    fetch('https://get.geojs.io/v1/ip/country.json')
        .then(res => res.json())
        .then(data => {
            const countryCode = data.country;
            let defaultCurr = 'USD';
            if(countryCode === 'CO') defaultCurr = 'COP';
            else if(countryCode === 'MX') defaultCurr = 'MXN';
            else if(countryCode === 'CL') defaultCurr = 'CLP';
            else if(countryCode === 'AR') defaultCurr = 'ARS';
            
            setCurrency(defaultCurr);
        })
        .catch(err => {
            setCurrency('COP'); 
        });

    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const removeIcon = e.target.closest('.cart-item-remove');
            if (removeIcon) {
                e.preventDefault();
                e.stopPropagation();
                
                const iName = removeIcon.getAttribute('data-input-name');
                const iVal = removeIcon.getAttribute('data-input-val');
                const inputsGroup = document.querySelectorAll(`input[name="${iName}"]`);
                
                if (inputsGroup && inputsGroup.length > 0) {
                    inputsGroup.forEach(r => {
                        if(r.type === 'radio') {
                            r.checked = false;
                            r.wasChecked = false;
                        } else if(r.type === 'checkbox' && r.value === iVal) {
                            r.checked = false;
                        }
                    });
                    updateCart();
                }
            }
        });
    }

    const ideaChatInput = document.getElementById('ideaChatInput');
    const ideaChatBody = document.getElementById('ideaChatBody');
    const ideaSendBtn = document.getElementById('ideaSendBtn');
    const ideaFileInput = document.getElementById('ideaFileInput');
    const ideaMicBtn = document.getElementById('ideaMicBtn');
    
    // Lead Capture Logic
    const leadNameInput = document.getElementById('leadName');
    const leadPhoneInput = document.getElementById('leadPhone');
    const saveLeadBtn = document.getElementById('saveLeadBtn');
    const initialAiGreeting = document.getElementById('initialAiGreeting');

    let capturedLeadData = {
        name: localStorage.getItem('zenodix_ai_lead_name') || '',
        phone: localStorage.getItem('zenodix_ai_lead_phone') || ''
    };

    const activateIdeaChatInputs = (isActive) => {
        if(ideaChatInput) ideaChatInput.disabled = !isActive;
        if(ideaSendBtn) ideaSendBtn.disabled = !isActive;
        if(ideaFileInput) ideaFileInput.disabled = !isActive;
        if(ideaMicBtn) ideaMicBtn.disabled = !isActive;
        
        if(!isActive) {
            if(ideaChatInput) ideaChatInput.placeholder = 'Regístrate arriba primero...';
        } else {
            if(ideaChatInput) ideaChatInput.placeholder = 'Escribe tu idea aquí...';
        }
    };

    if (capturedLeadData.name && capturedLeadData.phone) {
        if(initialAiGreeting) {
            initialAiGreeting.innerHTML = `¡Hola de nuevo, <strong>${capturedLeadData.name}</strong>! Soy tu Consultor AI. Escríbeme o sube un audio contándome qué quieres construir hoy.`;
        }
        activateIdeaChatInputs(true);
    } else {
        activateIdeaChatInputs(false);
        if (saveLeadBtn) {
            saveLeadBtn.addEventListener('click', () => {
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
                
                initialAiGreeting.innerHTML = `¡Excelente <strong>${nameVal}</strong>! Ya tengo tu contacto guardado. Dime, ¿en qué te puedo ayudar hoy?`;
                activateIdeaChatInputs(true);
                if(ideaChatInput) ideaChatInput.focus();
            });
        }
    }
    
    let ideaMediaRecorder;
    let ideaAudioChunks = [];
    let isIdeaRecording = false;
    let ideaAudioBlob = null;
    let resolveIdeaBlob = null; // REPARADO: Añadido manejador de promesas

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
                    ideaAudioBlob = null; // REPARADO: Resetear blob anterior
                    
                    ideaMicBtn.style.backgroundColor = '#ef4444';
                    ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">stop_circle</span>';
                    
                    ideaMediaRecorder.ondataavailable = e => {
                        ideaAudioChunks.push(e.data);
                    };
                    
                    ideaMediaRecorder.onstop = () => {
                        ideaAudioBlob = new Blob(ideaAudioChunks, { type: 'audio/webm' });
                        stream.getTracks().forEach(track => track.stop());
                        
                        ideaMicBtn.style.backgroundColor = '#10b981'; 
                        ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';
                        
                        if(resolveIdeaBlob) {
                            resolveIdeaBlob(ideaAudioBlob);
                            resolveIdeaBlob = null;
                        }
                    };
                } catch(err) {
                    alert("Acepta los permisos de micrófono para enviar notas de voz.");
                }
            }
        });
    }

    if (ideaSendBtn) {
        ideaSendBtn.addEventListener('click', async () => {
            const text = ideaChatInput.value.trim();
            const file = ideaFileInput && ideaFileInput.files && ideaFileInput.files.length > 0 ? ideaFileInput.files[0] : null;
            
            // REPARADO: Auto-Stop para chat de ideas
            if (isIdeaRecording && ideaMediaRecorder) {
                const p = new Promise(resolve => { resolveIdeaBlob = resolve; });
                ideaMediaRecorder.stop();
                isIdeaRecording = false;
                ideaMicBtn.style.backgroundColor = '';
                ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
                await p;
            }

            if (!text && !file && !ideaAudioBlob) return;

            let userContent = text;
            if (file) userContent += `<br><img src="${URL.createObjectURL(file)}" style="max-width:200px; border-radius:8px; display:block; margin-top:8px;">`;
            if (ideaAudioBlob) userContent += `<br><audio controls src="${URL.createObjectURL(ideaAudioBlob)}" style="height:35px; width:200px; margin-top:8px;"></audio>`;
            
            const userMsg = document.createElement('div');
            userMsg.className = 'srs-msg srs-user';
            userMsg.innerHTML = userContent || '[Archivo Adjunto]';
            ideaChatBody.appendChild(userMsg);
            
            ideaChatInput.value = '';
            
            // Limpiar variables temporales tras enviar a UI
            const audioToSend = ideaAudioBlob;
            ideaAudioBlob = null;
            
            if (ideaMicBtn) {
                ideaMicBtn.style.backgroundColor = '';
                ideaMicBtn.innerHTML = '<span class="material-symbols-outlined">mic</span>';
            }
            if (ideaFileInput) {
                ideaFileInput.value = '';
                if(window.handleFileSelect) window.handleFileSelect(ideaFileInput, 'ideaFileAlert');
            }
            ideaChatBody.scrollTop = ideaChatBody.scrollHeight;

            const typing = document.createElement('div');
            typing.className = 'srs-msg srs-ai';
            typing.innerHTML = '<span class="typing-indicator"><span>•</span><span>•</span><span>•</span></span>';
            ideaChatBody.appendChild(typing);
            ideaChatBody.scrollTop = ideaChatBody.scrollHeight;

            // 80/20 Fast Mock Response Hook
            if (!localStorage.getItem('zenodix_ai_interacted')) {
                localStorage.setItem('zenodix_ai_interacted', 'true');
                const mockText = `¡Excelente ${capturedLeadData.name ? '<b>'+capturedLeadData.name+'</b>' : ''}! Veo que estás operando al límite. El 80% de ese tiempo se puede automatizar con flujos en n8n conectados a tu CRM y WhatsApp. He preparado una auditoría técnica rápida. ¿Me compartes la URL de tu sitio web para analizar por dónde empezar?`;
                
                setTimeout(() => {
                    if (typing.parentElement) ideaChatBody.removeChild(typing);
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'srs-msg srs-ai is-animating';
                    aiMsg.innerHTML = mockText;
                    ideaChatBody.appendChild(aiMsg);
                    
                    if(typeof gsap !== 'undefined') {
                        gsap.to(aiMsg, {duration: 0.3, opacity: 1, y: 0, ease: "power2.out"});
                    }
                    ideaChatBody.scrollTop = ideaChatBody.scrollHeight;
                }, 800);
                
                // Silent fetch context background
                try {
                    fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: typeof currentSessionId !== 'undefined' ? currentSessionId : localStorage.getItem('zenodix_ai_session'),
                            message: text,
                            action: "idea_consult",
                            clientName: capturedLeadData.name,
                            clientWhatsApp: capturedLeadData.phone,
                            isMockIntercepted: true
                        })
                    }).catch(e => {});
                } catch(e) {}
                
                return;
            }

            try {
                let base64Image = "";
                let base64Audio = "";
                
                // REPARADO: Soporte para ambos a la vez
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

                ideaChatBody.removeChild(typing);

                if (response.ok) {
                    const data = await response.json();
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'srs-msg srs-ai';
                    
                    let formattedResponse = typeof data === 'string' ? data : (data.response || data.output || "Recibido. Estamos procesando tus requerimientos...");
                    formattedResponse = formattedResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    
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

        ideaChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') ideaSendBtn.click();
        });
    }

    const srsChatInput = document.getElementById('srsChatInput');
    const srsChatBody = document.getElementById('srsChatBody');
    const srsActionArea = document.getElementById('srsActionArea');
    
    let currentSessionId = localStorage.getItem('zenodix_ai_session');
    if(!currentSessionId) {
        currentSessionId = 'session_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('zenodix_ai_session', currentSessionId);
    }

    window.srsSendMessage = async function() {
        if (!srsChatInput) return;
        const text = srsChatInput.value.trim();
        const srsFileInput = document.getElementById('srsFileInput');
        const file = srsFileInput && srsFileInput.files && srsFileInput.files.length > 0 ? srsFileInput.files[0] : null;
        // REPARADO
        const audio = typeof srsAudio !== 'undefined' && srsAudio ? await srsAudio.getBlob() : null;

        if (!text && !file && !audio) return;
        
        let userContent = text;
        if (file) userContent += `<br><img src="${URL.createObjectURL(file)}" style="max-width:200px; border-radius:8px; display:block; margin-top:8px;">`;
        if (audio) userContent += `<br><audio controls src="${URL.createObjectURL(audio)}" style="height:35px; width:200px; margin-top:8px;"></audio>`;

        appendSrsMessage(userContent || '[Archivo Adjunto]', 'user');
        srsChatInput.value = '';
        srsChatInput.disabled = true;

        if (srsFileInput) {
            srsFileInput.value = '';
            window.handleFileSelect(srsFileInput, 'srsFileAlert');
        }
        if (typeof srsAudio !== 'undefined' && srsAudio) srsAudio.clear();

        showSrsTypingIndicator();
        srsChatBody.scrollTop = srsChatBody.scrollHeight;
        
        try {
            let base64Image = "";
            let base64Audio = "";
            
            // REPARADO: Soporte para ambos
            if (file) base64Image = await window.getBase64(file);
            if (audio) base64Audio = await window.getBase64(audio);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    message: text || "Analizar archivo adjunto.",
                    source: 'AppCustomQuotes',
                    imageBase64: base64Image,
                    audioBase64: base64Audio
                })
            });
            
            removeSrsTypingIndicator();
            if(!response.ok) throw new Error("Webhook Network Error");
            
            const data = await response.json();
            
            const reply = data.output || data.response || "Requerimiento procesado exitosamente.";
            appendSrsMessage(reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'), 'ai');
            
            if(data.isClosed && data.whatsappLink || reply.includes('DOCUMENTO FINALIZADO') || reply.includes('enviar todo al WhatsApp')) {
                if(srsActionArea) {
                    srsActionArea.style.display = 'block';
                    const link = data.whatsappLink || `https://wa.me/573214741783?text=Hola%20equipo%20Zenodix.%20Tengo%20un%20proyecto.`;
                    srsActionArea.innerHTML = `<a href="${link}" target="_blank" class="btn btn-primary full-width glow-btn" style="text-align: center; color:white; text-decoration:none;">🟢 Enviar Documento a WhatsApp</a>`;
                }
            } else {
                 srsChatInput.disabled = false;
                 srsChatInput.focus();
            }

        } catch (error) {
            console.error(error);
            removeSrsTypingIndicator();
            appendSrsMessage("Hubo un error de conexión con la inteligencia artificial. Por favor recarga e intenta de nuevo o escríbenos a WhatsApp directamente.", 'ai');
            srsChatInput.disabled = false;
        }
    };

    function appendSrsMessage(text, sender) {
        if (!srsChatBody) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `srs-msg srs-${sender} is-animating`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        srsChatBody.appendChild(msgDiv);
        
        if(typeof gsap !== 'undefined') {
            gsap.to(msgDiv, {
                duration: 0.3,
                opacity: 1,
                y: 0,
                ease: "power2.out",
                onComplete: () => msgDiv.classList.remove('is-animating')
            });
        } else {
            msgDiv.classList.remove('is-animating');
        }
        
        srsChatBody.scrollTop = srsChatBody.scrollHeight;
    }

    function showSrsTypingIndicator() {
        if (!srsChatBody) return;
        if(document.getElementById('srsTypingIndicator')) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'srsTypingIndicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        srsChatBody.appendChild(typingDiv);
        srsChatBody.scrollTop = srsChatBody.scrollHeight;
    }

    function removeSrsTypingIndicator() {
        const typingDiv = document.getElementById('srsTypingIndicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    window.srsFinalizeWhatsApp = function() {
        window.open(`https://wa.me/573214741783?text=Hola%20equipo%20t%C3%A9cnico%20de%20Zenodix.%20Quiero%20iniciar%20un%20proyecto%20de%20Desarrollo.`, '_blank');
    };

    // ----------------------------------------
    // Floating Chat Lead Capture (Fix)
    // ----------------------------------------
    const floatLeadForm = document.getElementById('floatLeadForm');
    const floatLeadName = document.getElementById('floatLeadName');
    const floatLeadPhone = document.getElementById('floatLeadPhone');
    const floatLeadSaveBtn = document.getElementById('floatLeadSaveBtn');
    const floatGreetingMessage = document.getElementById('floatGreetingMessage');
    
    const applyFloatingLeadState = () => {
        const floatInput = document.getElementById('chatInput'); 
        const floatSend = document.getElementById('sendChatBtn');
        const floatMic = document.getElementById('floatMicBtn');
        const _quickRepliesData = document.getElementById('quickRepliesContainer');

        if (!floatInput) return;
        if (capturedLeadData.name && capturedLeadData.phone) {
            if (floatLeadForm) floatLeadForm.style.display = 'none';
            if (_quickRepliesData) _quickRepliesData.style.display = 'flex';
            if (floatGreetingMessage) floatGreetingMessage.innerHTML = `¡Hola de nuevo, <strong>${capturedLeadData.name}</strong>!<br>¿Cómo podemos ayudarte hoy?`;
            floatInput.disabled = false;
            if(floatSend) floatSend.disabled = false;
            if(floatMic) floatMic.disabled = false;
            floatInput.placeholder = "Escribe tu mensaje...";
        } else {
            if (floatLeadForm) floatLeadForm.style.display = 'flex';
            if (_quickRepliesData) _quickRepliesData.style.display = 'none';
            floatInput.disabled = true;
            if(floatSend) floatSend.disabled = true;
            if(floatMic) floatMic.disabled = true;
            floatInput.placeholder = "Inicia el chat arriba...";
        }
    };
    
    applyFloatingLeadState();
    
    if (floatLeadSaveBtn) {
        floatLeadSaveBtn.addEventListener('click', () => {
            const name = floatLeadName.value.trim();
            const phone = floatLeadPhone.value.trim();
            
            if (!name || !phone) {
                alert("Por favor ingresa tu Nombre y WhatsApp para continuar.");
                return;
            }
            
            // Guardar Global
            capturedLeadData.name = name;
            capturedLeadData.phone = phone;
            localStorage.setItem('zenodix_ai_lead_name', name);
            localStorage.setItem('zenodix_ai_lead_phone', phone);
            
            applyFloatingLeadState();
            
            // Checkear si el SRS Chat necesita actualizarse
            if (typeof activateIdeaChatInputs === 'function') {
                activateIdeaChatInputs(true);
            }
        });
    }

});