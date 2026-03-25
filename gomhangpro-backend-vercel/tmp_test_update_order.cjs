const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/[\r\n]/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/[\r\n]/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateOrder() {
  // 1. Get a random existing order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, customer:customers!orders_customer_id_fkey(id, name), counter:counters!orders_counter_id_fkey(id, name)')
    .limit(1)
    .single();

  if (orderErr || !order) {
    console.error('Failed to get order:', orderErr);
    return;
  }
  
  console.log('Original Order ID:', order.id);
  console.log('Original Customer:', order.customer?.name);
  console.log('Original Counter:', order.counter?.name);

  // 2. Try simulating what the controller does
  const customerName = "Test Quầy " + Math.floor(Math.random() * 1000);
  const counterName = "Test Khách " + Math.floor(Math.random() * 1000);
  
  const updateData = {};
  
  // Find-or-Create Customer
  const { data: existCust } = await supabase.from('customers').select('id').eq('name', customerName).single();
  if (existCust) {
    updateData.customer_id = existCust.id;
  } else {
    const { data: newCust } = await supabase.from('customers').insert({ name: customerName }).select('id').single();
    if (newCust) updateData.customer_id = newCust.id;
  }

  // Find-or-Create Counter
  const { data: existCount } = await supabase.from('counters').select('id').eq('name', counterName).single();
  if (existCount) {
    updateData.counter_id = existCount.id;
  } else {
    const { data: newCount } = await supabase.from('counters').insert({ name: counterName, is_active: true }).select('id').single();
    if (newCount) updateData.counter_id = newCount.id;
  }

  console.log('Updating with Data:', updateData);

  // 3. Update the order and select joined relations
  const { data: updatedOrder, error: updateErr } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', order.id)
    .select(`
      *,
      customer:customers!orders_customer_id_fkey(id, name),
      counter:counters!orders_counter_id_fkey(id, name)
    `)
    .single();

  if (updateErr) {
    console.error('Failed to update order:', updateErr);
    return;
  }

  console.log('Updated Order Customer:', updatedOrder.customer?.name);
  console.log('Updated Order Counter:', updatedOrder.counter?.name);

  if (updatedOrder.customer?.name === customerName && updatedOrder.counter?.name === counterName) {
    console.log('SUCCESS: Values reflect the updated names!');
  } else {
    console.log('FAILED: Join relations did not update!');
  }
}

testUpdateOrder();
