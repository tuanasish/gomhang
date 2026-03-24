import { supabase } from './config/supabase.js';
import fs from 'fs';

async function check() {
    // 1. Check admin account
    const { data: adminUser } = await supabase
        .from('users')
        .select('id, email, role, name, updated_at, created_at')
        .eq('email', 'nguyennhuquan9889@gmail.com')
        .single();

    // 2. Check ALL users
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, email, role, name, updated_at')
        .order('updated_at', { ascending: false });

    const output = {
        adminAccount: adminUser,
        allUsers: allUsers?.map((u: any) => ({
            name: u.name,
            email: u.email,
            role: u.role,
            updated_at: u.updated_at
        }))
    };

    fs.writeFileSync('audit_log.json', JSON.stringify(output, null, 2));
    console.log('Written to audit_log.json');
}

check();
