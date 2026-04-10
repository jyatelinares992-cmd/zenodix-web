const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ovtfahrmwcpldmyotnvn.supabase.co';
const supabaseKey = 'sb_publishable_XOwQBcFa4PHvzNqsS9KOcQ_OEbIbgaF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    console.log('Intentando registrar usuario...');
    const { data, error } = await supabase.auth.signUp({
        email: 'test@zenodix.com',
        password: 'ZenodixUser2026',
        options: {
            data: {
                full_name: 'Usuario Testing',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.error('Error al crear usuario:', error.message);
    } else {
        console.log('Usuario creado exitosamente.');
        console.log('User ID:', data.user ? data.user.id : 'N/A');
    }
}

createUser();
