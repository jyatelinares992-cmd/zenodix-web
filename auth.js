/* ==========================================================================
   SUPABASE AUTHENTICATION GATEWAY (MODO MOCK / BYPASS)
   ========================================================================== */
// const supabaseUrl = 'https://ovtfahrmwcpldmyotnvn.supabase.co';
// const supabaseKey = 'sb_publishable_XOwQBcFa4PHvzNqsS9KOcQ_OEbIbgaF';
// const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginContainer = document.getElementById('loginFormContainer');
const registerContainer = document.getElementById('registerFormContainer');
const loginAlert = document.getElementById('loginAlert');
const registerAlert = document.getElementById('registerAlert');

// Toggle UI
window.toggleAuthMode = () => {
    if(loginContainer.style.display === 'none') {
        loginContainer.style.display = 'flex';
        registerContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'flex';
    }
    loginAlert.style.display = 'none';
    registerAlert.style.display = 'none';
};

const showAlert = (el, type, msg) => {
    el.className = `auth-alert alert-${type}`;
    el.innerText = msg;
    el.style.display = 'block';
};

// // Auto-Redirect if Already Logged In
// supabase.auth.getSession().then(({ data: { session } }) => {
//     if (session) {
//         window.location.href = 'hub.html';
//     }
// }).catch(e => console.log('Error de red Supabase ignorado en bypass'));

// LOGIN LOGIC
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const originalText = btn.innerText;
    btn.innerText = 'Autenticando...';
    btn.disabled = true;

    // BYPASS TEMPORAL: Ya que el dominio de Supabase (ovtfahrmwcpldmyotnvn) no está resolviendo
    showAlert(loginAlert, 'success', '¡Login en Modo Testing! Entrando al Hub...');
    setTimeout(() => { window.location.href = 'hub.html'; }, 800);
});

// REGISTER LOGIC
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegister');
    const originalText = btn.innerText;
    btn.innerText = 'Registrando...';
    btn.disabled = true;

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                role: 'admin' // Forced admin role for B2B testing
            }
        }
    });

    if (error) {
        showAlert(registerAlert, 'error', error.message);
        btn.innerText = originalText;
        btn.disabled = false;
    } else {
        // En Supabase, si requiere confirmacion de email asincrona:
        if(data.user && data.user.identities && data.user.identities.length === 0) {
           showAlert(registerAlert, 'error', 'Ese email ya se encuentra en uso.'); 
        } else {
           showAlert(registerAlert, 'success', '¡Registro Exitoso! Revisa tu bandeja de correo para confirmar o Inicia Sesión si tienes el auto-confirm activado.');
        }
        btn.innerText = originalText;
        btn.disabled = false;
    }
});
