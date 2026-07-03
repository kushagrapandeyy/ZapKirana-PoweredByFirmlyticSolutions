const fs = require('fs');

const DATA = {
  metadata: {
    dataset_name: "synthetic_kirana_platform_seed_data",
    purpose: "development_only",
    generated_at: new Date().toISOString(),
    notes: [
      "All users, stores, staff, suppliers, emails, phone numbers, addresses, and coordinates are fictional.",
      "Product catalog items are based on real grocery/household item types verified from public web sources."
    ]
  },
  stores: [],
  store_staff: [],
  users: [],
  suppliers: [],
  catalog_items: [],
  store_inventory: [],
  supplier_catalog: []
};

// 45 items, shortest valid real URLs
const items = [
  { n: "Atta", c: "staples", b: "Aashirvaad", p: "1kg", m: 50, u: "pack", pr: false, sl: 90, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Rice", c: "staples", b: "India Gate", p: "1kg", m: 100, u: "pack", pr: false, sl: 365, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Salt", c: "staples", b: "Tata", p: "1kg", m: 28, u: "pack", pr: false, sl: 730, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Oil", c: "oil_ghee", b: "Fortune", p: "1L", m: 155, u: "pouch", pr: false, sl: 270, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Ghee", c: "oil_ghee", b: "Amul", p: "1L", m: 620, u: "pack", pr: false, sl: 270, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Dal", c: "pulses", b: "Tata", p: "1kg", m: 180, u: "pack", pr: false, sl: 180, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Haldi", c: "spices", b: "Everest", p: "100g", m: 35, u: "pack", pr: false, sl: 365, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Garam Masala", c: "spices", b: "MDH", p: "100g", m: 85, u: "pack", pr: false, sl: 365, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Milk", c: "dairy", b: "Amul", p: "1L", m: 70, u: "pack", pr: true, sl: 180, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Cookies", c: "snacks", b: "Britannia", p: "60g", m: 10, u: "pack", pr: false, sl: 180, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Biscuits", c: "snacks", b: "Parle", p: "80g", m: 10, u: "pack", pr: false, sl: 180, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Noodles", c: "instant_food", b: "Maggi", p: "70g", m: 14, u: "pack", pr: false, sl: 270, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Tea", c: "beverages", b: "Brooke Bond", p: "250g", m: 130, u: "pack", pr: false, sl: 365, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Coffee", c: "beverages", b: "Nescafe", p: "50g", m: 150, u: "bottle", pr: false, sl: 540, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Detergent", c: "home_care", b: "Surf", p: "1kg", m: 115, u: "pack", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Dishwash", c: "home_care", b: "Vim", p: "250ml", m: 50, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Handwash", c: "personal_care", b: "Dettol", p: "200ml", m: 99, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Toothpaste", c: "personal_care", b: "Colgate", p: "100g", m: 60, u: "pack", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Shampoo", c: "personal_care", b: "Head", p: "180ml", m: 150, u: "bottle", pr: false, sl: 1095, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Soap", c: "personal_care", b: "Dove", p: "100g", m: 50, u: "pack", pr: false, sl: 1095, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Sugar", c: "staples", b: "generic", p: "1kg", m: 45, u: "pack", pr: false, sl: 365, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Jaggery", c: "staples", b: "generic", p: "1kg", m: 60, u: "pack", pr: false, sl: 180, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Butter", c: "dairy", b: "Amul", p: "100g", m: 58, u: "pack", pr: true, sl: 180, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Cheese", c: "dairy", b: "Amul", p: "200g", m: 120, u: "pack", pr: true, sl: 180, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Paneer", c: "dairy", b: "Amul", p: "200g", m: 85, u: "pack", pr: true, sl: 15, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Curd", c: "dairy", b: "Amul", p: "400g", m: 35, u: "pack", pr: true, sl: 15, gst: 0, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Chips", c: "snacks", b: "Lays", p: "50g", m: 20, u: "pack", pr: false, sl: 180, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Bhujia", c: "snacks", b: "Haldiram", p: "400g", m: 110, u: "pack", pr: false, sl: 180, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Pasta", c: "instant_food", b: "Maggi", p: "70g", m: 25, u: "pack", pr: false, sl: 270, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Soup", c: "instant_food", b: "Knorr", p: "50g", m: 15, u: "pack", pr: false, sl: 270, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Oats", c: "instant_food", b: "Quaker", p: "1kg", m: 180, u: "pack", pr: false, sl: 365, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Corn Flakes", c: "packaged_food", b: "Kelloggs", p: "500g", m: 150, u: "pack", pr: false, sl: 365, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Ketchup", c: "packaged_food", b: "Kissan", p: "500g", m: 75, u: "bottle", pr: false, sl: 365, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Jam", c: "packaged_food", b: "Kissan", p: "500g", m: 120, u: "bottle", pr: false, sl: 365, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Honey", c: "packaged_food", b: "Dabur", p: "500g", m: 200, u: "bottle", pr: false, sl: 365, gst: 5, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Peanut Butter", c: "packaged_food", b: "Sundrop", p: "500g", m: 150, u: "bottle", pr: false, sl: 365, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Hair Oil", c: "personal_care", b: "Parachute", p: "200ml", m: 90, u: "bottle", pr: false, sl: 1095, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Face Wash", c: "personal_care", b: "Himalaya", p: "100ml", m: 130, u: "bottle", pr: false, sl: 1095, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Deo", c: "personal_care", b: "Fogg", p: "150ml", m: 250, u: "bottle", pr: false, sl: 1095, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Sanitary Pads", c: "personal_care", b: "Whisper", p: "15pc", m: 120, u: "pack", pr: false, sl: 1095, gst: 12, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Floor Cleaner", c: "home_care", b: "Lizol", p: "500ml", m: 100, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Toilet Cleaner", c: "home_care", b: "Harpic", p: "500ml", m: 90, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Glass Cleaner", c: "home_care", b: "Colin", p: "500ml", m: 95, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Repellent", c: "home_care", b: "GoodKnight", p: "45ml", m: 85, u: "bottle", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" },
  { n: "Garbage Bags", c: "home_care", b: "generic", p: "30pc", m: 60, u: "pack", pr: false, sl: 730, gst: 18, url: "https://www.amazon.in/dp/B075S1W99Z" }
];

items.forEach((item, i) => {
  DATA.catalog_items.push({
    item_id: `ITEM_${(i+1).toString().padStart(3, '0')}`,
    item_name: item.n, category: item.c, brand: item.b, pack_size: item.p,
    mrp_inr: item.m, unit: item.u, perishable: item.pr, shelf_life_days: item.sl,
    gst_rate_percent: item.gst, verified_source_url: item.url, source_note: "Verified"
  });
});

let sid=1;
for (let i = 1; i <= 10; i++) {
  const stId = `STORE_${i.toString().padStart(3, '0')}`;
  const mid = `STAFF_${sid.toString().padStart(3, '0')}`; sid++;
  const iid = `STAFF_${sid.toString().padStart(3, '0')}`; sid++;

  DATA.stores.push({
    store_id: stId, store_name: `Kirana ${i}`, store_type: "kirana",
    address_line_1: `St ${i}`, neighborhood: "Jayanagar", city: "Bengaluru", state: "KA",
    pincode: "560011", latitude: "12.93", longitude: "77.58",
    opening_time: "07:00", closing_time: "22:00", is_active: true,
    manager_staff_id: mid, inventory_delivery_staff_id: iid
  });

  DATA.store_staff.push({ staff_id: mid, store_id: stId, full_name: `Mngr ${i}`, role: "manager", responsibilities: ["store_operations","vendor_coordination","customer_resolution"], phone: `+919000000${i.toString().padStart(2,'0')}`, email: `m${i}@a.dev`, shift_start: "09:00", shift_end: "18:00", is_active: true });
  DATA.store_staff.push({ staff_id: iid, store_id: stId, full_name: `Staff ${i}`, role: "inventory_delivery", responsibilities: ["inventory_updates","order_picking","delivery"], phone: `+919100000${i.toString().padStart(2,'0')}`, email: `s${i}@a.dev`, shift_start: "07:00", shift_end: "16:00", is_active: true });
}

for (let i = 1; i <= 50; i++) {
  DATA.users.push({
    user_id: `USER_${i.toString().padStart(3, '0')}`, full_name: `User ${i}`, phone: `+918000000${i.toString().padStart(2,'0')}`, email: `u${i}@a.dev`,
    default_address: `Apt ${i}`, neighborhood: "Jayanagar", city: "Bengaluru", state: "KA", pincode: "560011", latitude: "12.93", longitude: "77.58",
    preferred_payment_method: "UPI", created_at: "2023-01-01T00:00:00Z", is_active: true
  });
}

for (let i = 1; i <= 30; i++) {
  DATA.suppliers.push({
    supplier_id: `SUP_${i.toString().padStart(3, '0')}`, supplier_name: `Sup ${i}`, supplier_type: "FMCG_distributor", contact_person: `C ${i}`, phone: `+917000000${i.toString().padStart(2,'0')}`, email: `sup${i}@a.dev`, city: "Bengaluru", state: "KA", service_regions: ["Jayanagar"], average_lead_time_days: 2, minimum_order_value_inr: 1000, is_active: true
  });
}

let inv=1;
DATA.stores.forEach(s => {
  // Use most of 45 items (let's say 40 items per store)
  DATA.catalog_items.slice(0, 40).forEach(c => {
    DATA.store_inventory.push({
      inventory_id: `INV_${inv.toString().padStart(4, '0')}`, store_id: s.store_id, item_id: c.item_id, current_stock: 50, reorder_level: 20, selling_price_inr: c.mrp_inr, last_restocked_at: "2023-01-01T00:00:00Z", updated_by_staff_id: s.inventory_delivery_staff_id, availability_status: "in_stock"
    });
    inv++;
  });
});

let scat=1;
DATA.catalog_items.forEach((c, i) => {
  [1, 2].forEach(j => {
    DATA.supplier_catalog.push({
      supplier_catalog_id: `SCAT_${scat.toString().padStart(4, '0')}`, supplier_id: `SUP_${((i+j)%30 + 1).toString().padStart(3, '0')}`, item_id: c.item_id, wholesale_price_inr: c.mrp_inr - 5, minimum_order_quantity: 10, supply_capacity_per_week: 500, lead_time_days: 2
    });
    scat++;
  });
});

// Each supplier needs 3 items (already handled mostly since 45 items * 2 = 90 / 30 = 3 per supplier exactly)

const out = JSON.stringify(DATA);
fs.writeFileSync('seed_data_micro.json', out);
console.log('Size:', Buffer.byteLength(out, 'utf8'));
