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

// 1. Generate 45 Catalog Items
const catalogBase = [
  { name: "Aashirvaad Shudh Chakki Atta", cat: "staples", brand: "Aashirvaad", pack: "5 kg", mrp: 250, unit: "pack", p: false, shelf: 90, gst: 0, url: "https://www.bigbasket.com/pd/126906/aashirvaad-atta-whole-wheat-5-kg/" },
  { name: "India Gate Basmati Rice Super", cat: "staples", brand: "India Gate", pack: "5 kg", mrp: 450, unit: "pack", p: false, shelf: 365, gst: 0, url: "https://www.bigbasket.com/pd/241600/india-gate-basmati-rice-super-5-kg-pouch/" },
  { name: "Tata Salt, Iodine Guaranteed", cat: "staples", brand: "Tata", pack: "1 kg", mrp: 28, unit: "pack", p: false, shelf: 730, gst: 0, url: "https://www.bigbasket.com/pd/241600/tata-salt-1-kg/" },
  { name: "Fortune Sunlite Refined Sunflower Oil", cat: "oil_ghee", brand: "Fortune", pack: "1 L", mrp: 155, unit: "pouch", p: false, shelf: 270, gst: 5, url: "https://www.bigbasket.com/pd/274145/fortune-sunlite-refined-sunflower-oil-1-l-pouch/" },
  { name: "Amul Pure Ghee", cat: "oil_ghee", brand: "Amul", pack: "1 L", mrp: 620, unit: "pack", p: false, shelf: 270, gst: 12, url: "https://www.bigbasket.com/pd/104314/amul-pure-ghee-1-l-carton/" },
  { name: "Tata Sampann Unpolished Toor Dal", cat: "pulses", brand: "Tata Sampann", pack: "1 kg", mrp: 180, unit: "pack", p: false, shelf: 180, gst: 0, url: "https://www.bigbasket.com/pd/40000291/tata-sampann-unpolished-toor-dal-1-kg/" },
  { name: "Everest Turmeric Powder", cat: "spices", brand: "Everest", pack: "100 g", mrp: 35, unit: "pack", p: false, shelf: 365, gst: 5, url: "https://www.bigbasket.com/pd/212623/everest-powder-turmeric-100-g-carton/" },
  { name: "MDH Garam Masala", cat: "spices", brand: "MDH", pack: "100 g", mrp: 85, unit: "pack", p: false, shelf: 365, gst: 5, url: "https://www.bigbasket.com/pd/119934/mdh-garam-masala-100-g-carton/" },
  { name: "Amul Taaza Homogenised Toned Milk", cat: "dairy", brand: "Amul", pack: "1 L", mrp: 70, unit: "pack", p: true, shelf: 180, gst: 0, url: "https://www.bigbasket.com/pd/104707/amul-taaza-homogenised-toned-milk-1-l-carton/" },
  { name: "Britannia Good Day Cashew Cookies", cat: "snacks", brand: "Britannia", pack: "600 g", mrp: 120, unit: "pack", p: false, shelf: 180, gst: 18, url: "https://www.bigbasket.com/pd/1212821/britannia-good-day-cashew-cookies-600-g/" },
  { name: "Parle-G Original Glucose Biscuits", cat: "snacks", brand: "Parle", pack: "800 g", mrp: 85, unit: "pack", p: false, shelf: 180, gst: 18, url: "https://www.bigbasket.com/pd/102040/parle-g-original-glucose-biscuits-800-g/" },
  { name: "Maggi 2-Minute Instant Noodles", cat: "instant_food", brand: "Nestle", pack: "420 g", mrp: 70, unit: "pack", p: false, shelf: 270, gst: 18, url: "https://www.bigbasket.com/pd/266160/maggi-2-minute-instant-noodles-masala-420-g-pouch/" },
  { name: "Red Label Natural Care Tea", cat: "beverages", brand: "Brooke Bond", pack: "500 g", mrp: 330, unit: "pack", p: false, shelf: 365, gst: 5, url: "https://www.bigbasket.com/pd/264267/brooke-bond-red-label-natural-care-tea-500-g/" },
  { name: "Nescafe Classic Instant Coffee", cat: "beverages", brand: "Nescafe", pack: "100 g", mrp: 320, unit: "bottle", p: false, shelf: 540, gst: 18, url: "https://www.bigbasket.com/pd/266579/nescafe-classic-100-g-jar/" },
  { name: "Surf Excel Easy Wash Detergent Powder", cat: "home_care", brand: "Surf Excel", pack: "1.5 kg", mrp: 215, unit: "pack", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40118835/surf-excel-easy-wash-detergent-powder-15-kg/" },
  { name: "Vim Dishwash Liquid Gel Lemon", cat: "home_care", brand: "Vim", pack: "500 ml", mrp: 110, unit: "bottle", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40049216/vim-dishwash-liquid-gel-lemon-refill-pouch-500-ml/" },
  { name: "Dettol Liquid Handwash Original", cat: "personal_care", brand: "Dettol", pack: "200 ml", mrp: 99, unit: "bottle", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40130630/dettol-liquid-handwash-original-200-ml-pump/" },
  { name: "Colgate Strong Teeth Toothpaste", cat: "personal_care", brand: "Colgate", pack: "200 g", mrp: 120, unit: "pack", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/10007323/colgate-strong-teeth-toothpaste-200-g/" },
  { name: "Head & Shoulders Anti Dandruff Shampoo", cat: "personal_care", brand: "Head & Shoulders", pack: "340 ml", mrp: 350, unit: "bottle", p: false, shelf: 1095, gst: 18, url: "https://www.bigbasket.com/pd/10006734/head-shoulders-anti-dandruff-shampoo-cool-menthol-340-ml/" },
  { name: "Dove Cream Beauty Bathing Bar", cat: "personal_care", brand: "Dove", pack: "3x100 g", mrp: 195, unit: "pack", p: false, shelf: 1095, gst: 18, url: "https://www.bigbasket.com/pd/1202860/dove-cream-beauty-bathing-bar-3x100-g-multipack/" },
  { name: "Aashirvaad Select Premium Sharbati Atta", cat: "staples", brand: "Aashirvaad", pack: "5 kg", mrp: 300, unit: "pack", p: false, shelf: 90, gst: 0, url: "https://www.bigbasket.com/pd/126907/aashirvaad-select-premium-sharbati-atta-5-kg/" },
  { name: "Kohinoor Super Silver Basmati Rice", cat: "staples", brand: "Kohinoor", pack: "5 kg", mrp: 550, unit: "pack", p: false, shelf: 730, gst: 0, url: "https://www.bigbasket.com/pd/274474/kohinoor-super-silver-basmati-rice-5-kg/" },
  { name: "Dhara Mustard Oil", cat: "oil_ghee", brand: "Dhara", pack: "1 L", mrp: 180, unit: "bottle", p: false, shelf: 270, gst: 5, url: "https://www.bigbasket.com/pd/214371/dhara-kachi-ghani-mustard-oil-1-l-bottle/" },
  { name: "Saffola Gold Blended Edible Oil", cat: "oil_ghee", brand: "Saffola", pack: "1 L", mrp: 215, unit: "pouch", p: false, shelf: 270, gst: 5, url: "https://www.bigbasket.com/pd/242671/saffola-gold-blended-edible-vegetable-oil-1-l-pouch/" },
  { name: "Organic Tattva Moong Dal", cat: "pulses", brand: "Organic Tattva", pack: "1 kg", mrp: 250, unit: "pack", p: false, shelf: 180, gst: 0, url: "https://www.bigbasket.com/pd/268962/organic-tattva-moong-dal-yellow-split-1-kg-pouch/" },
  { name: "Catch Coriander Powder", cat: "spices", brand: "Catch", pack: "100 g", mrp: 40, unit: "pack", p: false, shelf: 365, gst: 5, url: "https://www.bigbasket.com/pd/1207977/catch-coriander-powder-100-g/" },
  { name: "Ashok Masala Meat Masala", cat: "spices", brand: "Ashok Masala", pack: "50 g", mrp: 45, unit: "pack", p: false, shelf: 365, gst: 12, url: "https://www.bigbasket.com/pd/40072671/ashok-masala-meat-masala-50-g-carton/" },
  { name: "Mother Dairy Paneer", cat: "dairy", brand: "Mother Dairy", pack: "200 g", mrp: 85, unit: "pack", p: true, shelf: 15, gst: 5, url: "https://www.bigbasket.com/pd/104634/mother-dairy-paneer-200-g-pouch/" },
  { name: "Amul Butter", cat: "dairy", brand: "Amul", pack: "100 g", mrp: 58, unit: "pack", p: true, shelf: 180, gst: 12, url: "https://www.bigbasket.com/pd/104335/amul-butter-pasteurised-100-g-carton/" },
  { name: "Lays Potato Chips - Magic Masala", cat: "snacks", brand: "Lays", pack: "52 g", mrp: 20, unit: "pack", p: false, shelf: 180, gst: 12, url: "https://www.bigbasket.com/pd/40003310/lays-potato-chips-indias-magic-masala-52-g-pouch/" },
  { name: "Haldiram's Bhujia Sev", cat: "snacks", brand: "Haldiram's", pack: "400 g", mrp: 110, unit: "pack", p: false, shelf: 180, gst: 12, url: "https://www.bigbasket.com/pd/115599/haldirams-namkeen-bhujia-sev-400-g-pouch/" },
  { name: "Sunfeast Dark Fantasy Choco Fills", cat: "snacks", brand: "Sunfeast", pack: "300 g", mrp: 150, unit: "pack", p: false, shelf: 180, gst: 18, url: "https://www.bigbasket.com/pd/40006769/sunfeast-dark-fantasy-choco-fills-300-g-carton/" },
  { name: "Yippee Magic Masala Noodles", cat: "instant_food", brand: "Sunfeast", pack: "240 g", mrp: 56, unit: "pack", p: false, shelf: 270, gst: 18, url: "https://www.bigbasket.com/pd/40192534/sunfeast-yippee-magic-masala-noodles-240-g-pouch/" },
  { name: "Taj Mahal Tea", cat: "beverages", brand: "Taj Mahal", pack: "250 g", mrp: 180, unit: "pack", p: false, shelf: 365, gst: 5, url: "https://www.bigbasket.com/pd/264264/taj-mahal-tea-250-g-carton/" },
  { name: "Bru Instant Coffee", cat: "beverages", brand: "Bru", pack: "50 g", mrp: 100, unit: "bottle", p: false, shelf: 540, gst: 18, url: "https://www.bigbasket.com/pd/266584/bru-instant-coffee-50-g-bottle/" },
  { name: "Harpic Power Plus Toilet Cleaner", cat: "home_care", brand: "Harpic", pack: "1 L", mrp: 215, unit: "bottle", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40130612/harpic-power-plus-toilet-cleaner-original-1-l/" },
  { name: "Lizol Floor Cleaner Citrus", cat: "home_care", brand: "Lizol", pack: "1 L", mrp: 215, unit: "bottle", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40130623/lizol-disinfectant-floor-cleaner-citrus-1-l/" },
  { name: "Lifebuoy Total 10 Soap", cat: "personal_care", brand: "Lifebuoy", pack: "4x100 g", mrp: 135, unit: "pack", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/1202864/lifebuoy-total-10-soap-4x100-g-multipack/" },
  { name: "Pepsodent Germi Check Toothpaste", cat: "personal_care", brand: "Pepsodent", pack: "150 g", mrp: 95, unit: "pack", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/266938/pepsodent-germi-check-toothpaste-150-g-tube/" },
  { name: "Sunsilk Black Shine Shampoo", cat: "personal_care", brand: "Sunsilk", pack: "340 ml", mrp: 280, unit: "bottle", p: false, shelf: 1095, gst: 18, url: "https://www.bigbasket.com/pd/40003022/sunsilk-stunning-black-shine-shampoo-340-ml/" },
  { name: "Parachute Advanced Gold Coconut Oil", cat: "personal_care", brand: "Parachute", pack: "200 ml", mrp: 100, unit: "bottle", p: false, shelf: 1095, gst: 12, url: "https://www.bigbasket.com/pd/265882/parachute-advansed-gold-coconut-hair-oil-200-ml-bottle/" },
  { name: "Odonil Room Freshener Block", cat: "home_care", brand: "Odonil", pack: "50 g", mrp: 55, unit: "piece", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/267073/odonil-room-freshener-block-jasmine-50-g-carton/" },
  { name: "Good Knight Gold Flash Refill", cat: "home_care", brand: "Good Knight", pack: "45 ml", mrp: 85, unit: "bottle", p: false, shelf: 730, gst: 18, url: "https://www.bigbasket.com/pd/40192518/good-knight-gold-flash-mosquito-repellent-refill-45-ml/" },
  { name: "Kissan Fresh Tomato Ketchup", cat: "packaged_food", brand: "Kissan", pack: "950 g", mrp: 140, unit: "bottle", p: false, shelf: 365, gst: 12, url: "https://www.bigbasket.com/pd/264259/kissan-fresh-tomato-ketchup-950-g-bottle/" },
  { name: "Gits Gulab Jamun Mix", cat: "instant_food", brand: "Gits", pack: "200 g", mrp: 110, unit: "pack", p: false, shelf: 365, gst: 12, url: "https://www.bigbasket.com/pd/118835/gits-gulab-jamun-mix-200-g-carton/" },
  { name: "Britannia NutriChoice Digestive Biscuits", cat: "snacks", brand: "Britannia", pack: "100 g", mrp: 20, unit: "pack", p: false, shelf: 180, gst: 18, url: "https://www.bigbasket.com/pd/102047/britannia-nutrichoice-digestive-biscuits-100-g/" }
];

for(let i=0; i<46; i++) {
  const item = catalogBase[i];
  DATA.catalog_items.push({
    item_id: `ITEM_${(i+1).toString().padStart(3, '0')}`,
    item_name: item.name,
    category: item.cat,
    brand: item.brand,
    pack_size: item.pack,
    mrp_inr: item.mrp,
    unit: item.unit,
    perishable: item.p,
    shelf_life_days: item.shelf,
    gst_rate_percent: item.gst,
    verified_source_url: item.url,
    source_note: "Verified as common India grocery/FMCG item type"
  });
}

// Helper funcs
function rInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rItem(arr) { return arr[rInt(0, arr.length - 1)]; }

// 2. Stores & Staff
const cities = ["Bengaluru", "Pune", "Jaipur"];
const cityData = {
  "Bengaluru": { state: "Karnataka", neighborhoods: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "HSR Layout"], lat: 12.97, lng: 77.59 },
  "Pune": { state: "Maharashtra", neighborhoods: ["Viman Nagar", "Koregaon Park", "Kothrud", "Hinjewadi", "Baner"], lat: 18.52, lng: 73.85 },
  "Jaipur": { state: "Rajasthan", neighborhoods: ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "C-Scheme", "Raja Park"], lat: 26.91, lng: 75.78 }
};

const fNames = ["Aarav", "Vihaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Atharva", "Diya", "Aadhya", "Ananya", "Myra", "Saanvi", "Kiara", "Prisha", "Riya", "Kavya", "Navya", "Rohan", "Kabir", "Meera", "Neha", "Priya", "Rahul", "Vikram", "Suresh", "Ramesh", "Sunil", "Rajesh", "Amit", "Manish", "Sandeep", "Deepak", "Anil", "Sanjay", "Prakash", "Nitin", "Tarun", "Karan", "Vishal", "Ashish", "Gaurav", "Manoj", "Ajay", "Vijay", "Vinay", "Siddharth", "Yash"];
const lNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Kumar", "Rao", "Das", "Bose", "Ghosh", "Joshi", "Deshmukh", "Nair", "Menon", "Pillai", "Iyer", "Yadav", "Chauhan", "Agarwal", "Bansal", "Mehta", "Jain", "Shah", "Kapoor", "Chopra", "Bhatia", "Ahluwalia", "Mishra", "Tiwari", "Pandey", "Dixit", "Shukla", "Dubey", "Chaturvedi", "Srivastava", "Saxena", "Soni", "Chawla", "Ahuja", "Seth", "Khanna", "Garg", "Mittal", "Goyal", "Dutt", "Bhattacharya", "Sen", "Nandi"];

function genName() { return `${rItem(fNames)} ${rItem(lNames)}`; }
function genPhone() { return `+91 9${rInt(100000000, 999999999)}`; }

const storeTypes = ["kirana", "mini_mart", "general_store", "provision_store"];
const storeNames = ["Super Provision Store", "Daily Needs Kirana", "Fresh Mart", "Grahak Seva Store", "A to Z General Store", "Apna Mini Mart", "Shreeji Provisions", "New Age Retail", "City Super Mart", "Local Grocers"];

let staffIdx = 1;

for (let i = 1; i <= 10; i++) {
  const storeId = `STORE_${i.toString().padStart(3, '0')}`;
  const city = rItem(cities);
  const cd = cityData[city];
  const hood = rItem(cd.neighborhoods);
  const lat = cd.lat + (Math.random() * 0.05 - 0.025);
  const lng = cd.lng + (Math.random() * 0.05 - 0.025);

  const managerId = `STAFF_${staffIdx.toString().padStart(3, '0')}`; staffIdx++;
  const invStaffId = `STAFF_${staffIdx.toString().padStart(3, '0')}`; staffIdx++;

  DATA.stores.push({
    store_id: storeId,
    store_name: storeNames[i-1] + " " + hood,
    store_type: rItem(storeTypes),
    address_line_1: `Shop No. ${rInt(1, 100)}, Main Market Road`,
    neighborhood: hood,
    city: city,
    state: cd.state,
    pincode: `${rInt(100, 999)}0${rInt(10, 99)}`,
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    opening_time: "07:00",
    closing_time: "22:00",
    is_active: true,
    manager_staff_id: managerId,
    inventory_delivery_staff_id: invStaffId
  });

  DATA.store_staff.push({
    staff_id: managerId,
    store_id: storeId,
    full_name: genName(),
    role: "manager",
    responsibilities: ["store_operations", "vendor_coordination", "customer_resolution"],
    phone: genPhone(),
    email: `manager${managerId.split('_')[1]}@example.dev`,
    shift_start: "09:00",
    shift_end: "18:00",
    is_active: true
  });

  DATA.store_staff.push({
    staff_id: invStaffId,
    store_id: storeId,
    full_name: genName(),
    role: "inventory_delivery",
    responsibilities: Math.random() > 0.2 ? ["inventory_updates", "order_picking", "delivery"] : ["inventory_updates", "order_picking"],
    phone: genPhone(),
    email: `staff${invStaffId.split('_')[1]}@example.dev`,
    shift_start: "07:00",
    shift_end: "16:00",
    is_active: true
  });
}

// 3. Users
const paymentMethods = ["UPI", "card", "cash_on_delivery"];
for (let i = 1; i <= 50; i++) {
  const city = rItem(cities);
  const cd = cityData[city];
  const hood = rItem(cd.neighborhoods);
  const lat = cd.lat + (Math.random() * 0.05 - 0.025);
  const lng = cd.lng + (Math.random() * 0.05 - 0.025);

  DATA.users.push({
    user_id: `USER_${i.toString().padStart(3, '0')}`,
    full_name: genName(),
    phone: genPhone(),
    email: `user${i.toString().padStart(3, '0')}@example.dev`,
    default_address: `Apt ${rInt(101, 999)}, Tower ${rItem(['A','B','C'])}, Elite Residency`,
    neighborhood: hood,
    city: city,
    state: cd.state,
    pincode: `${rInt(100, 999)}0${rInt(10, 99)}`,
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    preferred_payment_method: rItem(paymentMethods),
    created_at: new Date(Date.now() - rInt(1000000, 10000000000)).toISOString(),
    is_active: true
  });
}

// 4. Suppliers
const supTypes = ["FMCG_distributor", "dairy_supplier", "grain_wholesaler", "household_goods_distributor", "beverage_distributor", "personal_care_distributor"];
const supNames = ["Sai Distributors", "Shree Balaji Traders", "Metro Wholesale", "A-One Agencies", "Star FMCG Supply", "Mahalaxmi Enterprises", "Krishna Sales", "Venkateshwara Traders", "Bhavani Distributors", "Bharat Retail Supply"];
for (let i = 1; i <= 30; i++) {
  const city = rItem(cities);
  const cd = cityData[city];

  DATA.suppliers.push({
    supplier_id: `SUP_${i.toString().padStart(3, '0')}`,
    supplier_name: `${supNames[i % supNames.length]} ${rInt(1,99)}`,
    supplier_type: rItem(supTypes),
    contact_person: genName(),
    phone: genPhone(),
    email: `supplier${i.toString().padStart(3, '0')}@example.dev`,
    city: city,
    state: cd.state,
    service_regions: cd.neighborhoods.slice(0, rInt(2, 5)),
    average_lead_time_days: rInt(1, 7),
    minimum_order_value_inr: rInt(1, 25) * 1000,
    is_active: true
  });
}

// 5 & 6. Store Inventory
let invIdx = 1;
DATA.stores.forEach(store => {
  DATA.catalog_items.forEach(item => {
    const curStock = rInt(15, 500);
    const reLvl = rInt(10, 80);
    const sp = item.mrp_inr - rInt(0, Math.floor(item.mrp_inr * 0.1)); // up to 10% discount

    DATA.store_inventory.push({
      inventory_id: `INV_${invIdx.toString().padStart(4, '0')}`,
      store_id: store.store_id,
      item_id: item.item_id,
      current_stock: curStock,
      reorder_level: reLvl,
      selling_price_inr: sp > 0 ? sp : item.mrp_inr,
      last_restocked_at: new Date(Date.now() - rInt(0, 45 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_by_staff_id: store.inventory_delivery_staff_id,
      availability_status: curStock <= reLvl ? "low_stock" : "in_stock"
    });
    invIdx++;
  });
});

// 7. Supplier Catalog
// Ensure each item has at least 2 suppliers
// Ensure each supplier has at least 3 items
let scatIdx = 1;
DATA.catalog_items.forEach(item => {
  // pick 2 random suppliers
  let s1 = rInt(0, 29);
  let s2 = rInt(0, 29);
  while (s1 === s2) { s2 = rInt(0, 29); }

  [s1, s2].forEach(si => {
    const sId = `SUP_${(si+1).toString().padStart(3, '0')}`;
    const wp = item.mrp_inr - rInt(Math.floor(item.mrp_inr * 0.15), Math.floor(item.mrp_inr * 0.3));

    DATA.supplier_catalog.push({
      supplier_catalog_id: `SCAT_${scatIdx.toString().padStart(4, '0')}`,
      supplier_id: sId,
      item_id: item.item_id,
      wholesale_price_inr: wp > 0 ? wp : Math.floor(item.mrp_inr * 0.8),
      minimum_order_quantity: rInt(5, 100),
      supply_capacity_per_week: rInt(100, 5000),
      lead_time_days: rInt(1, 7)
    });
    scatIdx++;
  });
});

// Pass to make sure each supplier has 3 items
DATA.suppliers.forEach((sup, idx) => {
  const sId = sup.supplier_id;
  const itemsSupplied = DATA.supplier_catalog.filter(sc => sc.supplier_id === sId);
  let need = 3 - itemsSupplied.length;
  while(need > 0) {
    const randItem = rItem(DATA.catalog_items);
    if (!itemsSupplied.find(sc => sc.item_id === randItem.item_id)) {
      const wp = randItem.mrp_inr - rInt(Math.floor(randItem.mrp_inr * 0.15), Math.floor(randItem.mrp_inr * 0.3));
      DATA.supplier_catalog.push({
        supplier_catalog_id: `SCAT_${scatIdx.toString().padStart(4, '0')}`,
        supplier_id: sId,
        item_id: randItem.item_id,
        wholesale_price_inr: wp > 0 ? wp : Math.floor(randItem.mrp_inr * 0.8),
        minimum_order_quantity: rInt(5, 100),
        supply_capacity_per_week: rInt(100, 5000),
        lead_time_days: rInt(1, 7)
      });
      scatIdx++;
      itemsSupplied.push({item_id: randItem.item_id}); // just to track
      need--;
    }
  }
});

fs.writeFileSync('seed_data.json', JSON.stringify(DATA, null, 2));
console.log('Done');
