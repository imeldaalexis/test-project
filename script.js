// 1. Initialize Supabase
const SUPABASE_URL = 'https://fkwpgzzycqvkefocmgil.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qeFfUpOZZfGGLqEu0HWngw_VJX0UoFa';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Menu Data State
let menuData = [];
let currentOrders = [];
let sortDirection = 1;

// 3. UI Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    fetchOrders();
});

// 4. Menu Rendering & Logic
function renderMenu(filterText = '') {
    const menuContainer = document.getElementById('menu-list');
    menuContainer.innerHTML = '';

    menuData.forEach((item, index) => {
        if (item.name.toLowerCase().includes(filterText.toLowerCase())) {
            const div = document.createElement('div');
            div.className = 'menu-item';
            div.innerHTML = `
                <div class="menu-info">
                    <strong>${item.name}</strong>
                    <span class="menu-price">${item.price}</span>
                </div>
                <div class="quantity-controls">
                    <button type="button" class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <span id="qty-${index}">${item.qty}</span>
                    <button type="button" class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            `;
            menuContainer.appendChild(div);
        }
    });
}

function updateQty(index, change) {
    let newQty = menuData[index].qty + change;
    if (newQty < 0) newQty = 0;
    menuData[index].qty = newQty;
    document.getElementById(`qty-${index}`).innerText = newQty;
}

function filterMenu() {
    const text = document.getElementById('menu-search').value;
    renderMenu(text);
}

// 5. Form Logic
function toggleOtherLocation() {
    const locSelect = document.getElementById('location');
    const otherGroup = document.getElementById('other-location-group');

    console.log("Fungsi jalan! Value saat ini:", locSelect.value);
    
    if (locSelect.value === 'Others') {
        console.log("Others is clicked");
        otherGroup.classList.remove('hidden');
        document.getElementById('other-location').required = true;
    } else {
        otherGroup.classList.add('hidden');
        document.getElementById('other-location').required = false;
        document.getElementById('other-location').value = '';
    }
}

// 6. Fetch & Display Orders
async function fetchOrders() {
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }
    currentOrders = data;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('orders-body');
    tbody.innerHTML = '';
    currentOrders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.name}</td>
            <td>${order.location}</td>
            <td>${order.order_details}</td>
            <td>${order.batch_time}</td>
        `;
        tbody.appendChild(tr);
    });
}

function sortTable(column) {
    sortDirection *= -1; // Toggle between ascending and descending
    currentOrders.sort((a, b) => {
        let valA = a[column].toLowerCase();
        let valB = b[column].toLowerCase();
        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;
        return 0;
    });
    renderTable();
}

// 7. Submit Logic
async function submitOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const batchTime = document.getElementById('batch-time').value;
    let location = document.getElementById('location').value;
    
    if (location === 'Others') {
        location = document.getElementById('other-location').value.trim();
    }

    if (!name || !phone || !batchTime || !location) {
        alert("Please fill in all required fields.");
        return;
    }

    // Filter items with qty > 0 and format string
    const selectedItems = menuData.filter(item => item.qty > 0);
    if (selectedItems.length === 0) {
        alert("Please select at least one menu item.");
        return;
    }

    const orderString = selectedItems.map(item => `${item.name} (${item.qty})`).join(', ');

    // Push to Supabase
    const { data, error } = await supabaseClient
        .from('orders')
        .insert([
            { name, phone, batch_time: batchTime, location, order_details: orderString }
        ]);

    if (error) {
        console.error('Error inserting data:', error);
        alert('Failed to submit order.');
    } else {
        alert('Order submitted successfully!');
        // Reset form and quantities
        document.getElementById('order-form').reset();
        document.getElementById('other-location-group').classList.add('hidden');
        menuData.forEach(item => item.qty = 0);
        renderMenu(); 
        
        // Refresh table
        fetchOrders();
    }
}

// Tambahkan fungsi fetchMenu()
async function fetchMenu() {
    const { data, error } = await supabaseClient
        .from('menus')
        .select('*')
        .eq('is_available', true) // Hanya ambil menu yang tersedia
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching menu:', error);
        return;
    }

    // Mapping data dari DB dan tambahkan properti qty = 0 untuk state keranjang
    menuData = data.map(item => ({
        ...item,
        qty: 0
    }));

    renderMenu(); // Panggil renderMenu setelah data berhasil ditarik
}

// Update UI Initialization untuk memanggil fetchMenu terlebih dahulu
document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    fetchOrders();
});