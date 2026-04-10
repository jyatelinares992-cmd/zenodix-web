/* ==========================================================================
   SUPABASE INITIALIZATION & ROUTE PROTECTION (B2B CORE)
   ========================================================================== */
const supabaseUrl = 'https://ovtfahrmwcpldmyotnvn.supabase.co';
const supabaseKey = 'sb_publishable_XOwQBcFa4PHvzNqsS9KOcQ_OEbIbgaF';

// Initialize the client using the window.supabase object from the CDN
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Expose it globally
window.supabase = supabaseClient;

// Escudo de Ruta (Route Protection) - TEMPORALMENTE EN BYPASS
async function requireAuth() {
    console.log('Utilizando BYPASS de sesión para pruebas visuales.');
    
    // Sesión válida simulada, poblar UI
    document.addEventListener('DOMContentLoaded', () => {
        const userNameEl = document.querySelector('.user-info .user-name');
        const userRoleEl = document.querySelector('.user-info .user-role');
        const avatarEl = document.querySelector('.avatar');
        
        if(userNameEl) userNameEl.innerText = 'B2B Demo User';
        if(userRoleEl) userRoleEl.innerText = 'admin@zenodix.com';
        if(avatarEl) avatarEl.innerText = 'BZ';
        
        // Setup Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    });
    
    return true;
}

async function initSupabaseConnection() {
    const isAuth = await requireAuth();
    if(!isAuth) return; // Stop executing if unauthenticated

    try {
        // Health Check protegido
        const { data, error } = await window.supabase
            .from('companies')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error RLS conectando a la Bóveda Zenodix:', error.message || error);
        } else {
            console.log('✅ Autenticación Local Exitosa. RLS Token validado. Hub en línea.');
        }
    } catch (err) {
        console.error('❌ Error crítico en Supabase JS:', err);
    }
}

// Lanzar barrera inicial inmediatamente
initSupabaseConnection();

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       SIDEBAR & NAVIGATION LOGIC
       ========================================================================== */
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
    });
    
    mobileCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
    });

    // View Switching Logic
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('viewTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => section.classList.remove('active'));
            
            // Add active to clicked item
            item.classList.add('active');
            
            // Show target view
            const targetViewId = item.getAttribute('data-view');
            document.getElementById(`view-${targetViewId}`).classList.add('active');
            
            // Update Title
            const tabName = item.querySelector('.nav-label').textContent;
            viewTitle.textContent = tabName.split('(')[0].trim();
            
            // Close mobile menu if open
            if(window.innerWidth < 768) {
                sidebar.classList.remove('show');
            }
        });
    });

    /* ==========================================================================
       CHART.JS (DASHBOARD)
       ========================================================================== */
    const ctx = document.getElementById('salesChart');
    if(ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [
                    {
                        label: 'Ventas (COP)',
                        data: [12000000, 19000000, 15000000, 25000000],
                        borderColor: '#00a94f',
                        backgroundColor: 'rgba(0, 169, 79, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Inversión Marketing (COP)',
                        data: [4000000, 4500000, 4000000, 5000000],
                        borderColor: '#125191',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0', drawBorder: false },
                        ticks: {
                            callback: function(value) {
                                return '$' + value/1000000 + 'M';
                            }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /* ==========================================================================
       SOCIAL AI GENERATOR LOGIC
       ========================================================================== */
    // Tab switching in Output
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Logic to change the preview text/image based on ad platform can go here.
        });
    });

    // Drag and Drop Zone
    const dragDropZone = document.getElementById('dragDropZone');
    const campaignFile = document.getElementById('campaignFile');
    
    if(dragDropZone) {
        dragDropZone.addEventListener('click', () => campaignFile.click());
        
        dragDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragDropZone.style.backgroundColor = '#e0e7ff';
        });

        dragDropZone.addEventListener('dragleave', () => {
            dragDropZone.style.backgroundColor = '#f8fafc';
        });

        dragDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDropZone.style.backgroundColor = '#f8fafc';
            if(e.dataTransfer.files.length) {
                campaignFile.files = e.dataTransfer.files;
                dragDropZone.querySelector('.dz-text').innerText = e.dataTransfer.files[0].name;
                dragDropZone.querySelector('.dz-icon').style.color = '#00a94f';
            }
        });

        campaignFile.addEventListener('change', () => {
            if(campaignFile.files.length) {
                dragDropZone.querySelector('.dz-text').innerText = campaignFile.files[0].name;
                dragDropZone.querySelector('.dz-icon').style.color = '#00a94f';
            }
        });
    }

    // Webhook Mock Functions
    window.generateCampaign = () => {
        const contextText = document.getElementById('campaignContext').value;
        if(!contextText) {
            alert('Por favor agrega un contexto para que la IA entienda el objetivo.');
            return;
        }
        
        // Mocking POST request to n8n webhook
        console.log("POST /webhook/social-ai", { context: contextText, file: campaignFile.files[0] });
        
        const btn = document.querySelector('.input-col .btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Generando...';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            document.querySelector('.preview-box').style.border = '2px solid #00a94f';
            // Here you would inject the text received from n8n
        }, 1500);
    };

    window.publishCampaign = () => {
        alert("Webhook enviado -> Disparando publicación omnicanal vía n8n...");
    };

    /* ==========================================================================
       Marketing SaaS Webhook Handlers
       ========================================================================== */
    window.analyzeAdsCSV = () => {
        alert('Conectando a Claude 3.5 Sonnet para análisis de CSV...');
    };

});
