const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/[\r\n]/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/[\r\n]/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const nameTrimmed = "Quầy Test 666";
  console.log('Testing select.single() for non-existent record...');
  const { data: existCount, error: findError } = await supabase
    .from('counters')
    .select('id')
    .eq('name', nameTrimmed)
    .single();

  console.log('existCount:', existCount);
  console.log('findError:', findError);

  if (existCount) {
    console.log('Found:', existCount.id);
  } else {
    console.log('Not found, inserting...');
    const { data: newCount, error: insertError } = await supabase
      .from('counters')
      .insert({ name: nameTrimmed, is_active: true })
      .select('id')
      .single();
    
    console.log('newCount:', newCount);
    console.log('insertError:', insertError);
  }
}

test();
