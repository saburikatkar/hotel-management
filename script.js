// Global variables
let currentUser = null;
let rooms = [];
let guests = [];
let bookings = [];
const STORAGE_KEY = 'hotelDashboardData';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    }

    loadState();
    setupEventListeners();
    initializeCharts();
    loadRooms();
    loadGuests();
    loadAvailableRooms();
    renderRecentActivity();
    updateDashboard();
}

function initializeSampleData() {
    // Sample rooms data - All set to available by default
    rooms = [
        { id: 1, number: '101', type: 'single', price: 1000, status: 'available' },
        { id: 2, number: '102', type: 'double', price: 1200, status: 'available' },
        { id: 3, number: '103', type: 'triple', price: 1500, status: 'available' },
        { id: 4, number: '104', type: 'vip', price: 2500, status: 'available' },
        { id: 5, number: '201', type: 'single', price: 1000, status: 'available' },
        { id: 6, number: '202', type: 'double', price: 1200, status: 'available' },
        { id: 7, number: '203', type: 'triple', price: 1500, status: 'available' },
        { id: 8, number: '204', type: 'vip', price: 2500, status: 'available' },
        { id: 9, number: '301', type: 'single', price: 1000, status: 'available' },
        { id: 10, number: '302', type: 'double', price: 1200, status: 'available' },
        { id: 11, number: '303', type: 'triple', price: 1500, status: 'available' },
        { id: 12, number: '304', type: 'vip', price: 2500, status: 'available' },
        { id: 13, number: '401', type: 'single', price: 1000, status: 'available' },
        { id: 14, number: '402', type: 'double', price: 1200, status: 'available' },
        { id: 15, number: '403', type: 'triple', price: 1500, status: 'available' },
        { id: 16, number: '404', type: 'vip', price: 2500, status: 'available' }
    ];

    // Sample guests data - Empty by default
    guests = [];
    bookings = [];
}

function loadState() {
    if (typeof localStorage === 'undefined') {
        initializeSampleData();
        return;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            rooms = Array.isArray(data.rooms) ? data.rooms : [];
            guests = Array.isArray(data.guests) ? data.guests : [];
            bookings = Array.isArray(data.bookings) ? data.bookings : [];
        }
    } catch (error) {
        rooms = [];
        guests = [];
        bookings = [];
    }

    if (!Array.isArray(rooms) || rooms.length === 0) {
        initializeSampleData();
    } else {
        rooms = rooms.map((room, index) => {
            const normalized = { ...room };
            if (!normalized.id) {
                normalized.id = index + 1;
            }
            return normalized;
        });
    }

    if (!Array.isArray(guests)) {
        guests = [];
    }

    if (!Array.isArray(bookings)) {
        bookings = [];
    }

    saveState();
}

function saveState() {
    if (typeof localStorage === 'undefined') {
        return;
    }

    try {
        const data = {
            rooms,
            guests,
            bookings
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Sidebar toggle
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Room form
    document.getElementById('roomForm').addEventListener('submit', handleRoomSubmit);
    
    // Guest form
    document.getElementById('guestForm').addEventListener('submit', handleGuestSubmit);
    
    document.getElementById('foodQty').addEventListener('input', () => {
        saveState();
        calculateBill();
    });
    document.getElementById('laundryQty').addEventListener('input', () => {
        saveState();
        calculateBill();
    });
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Simple authentication (in real app, this would be server-side)
    if ((username === 'admin' && password === 'admin123') || 
        (username === 'staff' && password === 'staff123')) {
        currentUser = { username, role };
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateDashboard();
    } else {
        alert('Invalid credentials!');
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    localStorage.removeItem('currentUser');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.toggle('show');
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.remove('hidden');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        'overview': 'Dashboard Overview',
        'rooms': 'Room Management',
        'guests': 'Guest Management',
        'checkin': 'Check-In/Check-Out',
        'billing': 'Billing & Invoice',
        'reports': 'Reports & Analytics',
        'housekeeping': 'Housekeeping Management',
        'maintenance': 'Maintenance Tracker',
        'services': 'Service Management',
        'staff': 'Staff Management',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    
    // Show/hide add button based on section
    const addBtn = document.getElementById('addNewBtn');
    if (['rooms', 'guests'].includes(sectionName)) {
        addBtn.style.display = 'inline-flex';
    } else {
        addBtn.style.display = 'none';
    }
    
    // Refresh room dropdown when check-in section is shown
    if (sectionName === 'checkin') {
        loadAvailableRooms();
    }

    // Auto-close sidebar on mobile after selection
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024 && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
    }
}

function updateDashboard() {
    // Update stats
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const availableRooms = rooms.filter(room => room.status === 'available').length;
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
    const cleaningRooms = rooms.filter(room => room.status === 'cleaning').length;
    const currentGuests = guests.filter(guest => guest.status === 'checked-in').length;
    
    // Calculate today's revenue
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = bookings
        .filter(booking => booking.checkIn === today)
        .reduce((total, booking) => {
            const room = rooms.find(r => r.id === booking.roomId);
            if (room) {
                const roomRate = room.price;
                const extraBedCost = booking.extraBed * 300;
                const subtotal = (roomRate * booking.stayDays) + extraBedCost;
                return total + subtotal;
            }
            return total;
        }, 0);
    
    document.getElementById('occupiedRooms').textContent = occupiedRooms;
    document.getElementById('availableRooms').textContent = availableRooms;
    document.getElementById('maintenanceRooms').textContent = maintenanceRooms + cleaningRooms;
    document.getElementById('currentGuests').textContent = currentGuests;
    document.getElementById('todayRevenue').textContent = `₹${todayRevenue.toFixed(0)}`;
    
    // Refresh charts
    refreshCharts();
}

function loadRooms() {
    const roomGrid = document.getElementById('roomGrid');
    roomGrid.innerHTML = '';
    
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <div class="room-number">Room ${room.number}</div>
            <div class="room-type">${getRoomTypeName(room.type)}</div>
            <div class="room-price">₹${room.price}/night</div>
            <div class="badge badge-${room.status}" onclick="event.stopPropagation(); toggleRoomStatus(${room.id})" style="cursor: pointer;">${room.status}</div>
            <div style="margin-top: 10px;">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); editRoom(${room.id})" style="margin-right: 5px;">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteRoom(${room.id})">Delete</button>
            </div>
        `;
        roomGrid.appendChild(roomCard);
    });
}

function loadAvailableRooms() {
    const roomSelect = document.getElementById('selectedRoomNumber');
    roomSelect.innerHTML = '<option value="">Select Available Room</option>';
    
    const availableRooms = rooms.filter(room => room.status === 'available');
    availableRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `Room ${room.number} - ${getRoomTypeName(room.type)} (₹${room.price})`;
        roomSelect.appendChild(option);
    });
}

function updateRoomDetails() {
    const selectedRoomId = document.getElementById('selectedRoomNumber').value;
    const roomTypeDisplay = document.getElementById('roomTypeDisplay');
    
    if (selectedRoomId) {
        const room = rooms.find(r => r.id == selectedRoomId);
        if (room) {
            roomTypeDisplay.value = `${getRoomTypeName(room.type)} (₹${room.price}/night)`;
        }
    } else {
        roomTypeDisplay.value = '';
    }
}

function getRoomTypeName(type) {
    const types = {
        'vip': 'VIP Suite',
        'single': 'Single Bed',
        'triple': 'Triple Bed',
        'double': 'Double Deluxe'
    };
    return types[type] || type;
}

function openRoomModal() {
    document.getElementById('roomModal').classList.add('show');
}

function closeRoomModal() {
    document.getElementById('roomModal').classList.remove('show');
    document.getElementById('roomForm').reset();
}

function openGuestModal() {
    document.getElementById('guestModal').classList.add('show');
}

function closeGuestModal() {
    document.getElementById('guestModal').classList.remove('show');
    document.getElementById('guestForm').reset();
}

function handleRoomSubmit(e) {
    e.preventDefault();
    const roomNumber = document.getElementById('roomNumber').value;
    const roomType = document.getElementById('roomTypeSelect').value;
    const roomPrice = parseInt(document.getElementById('roomPrice').value);
    const roomStatus = document.getElementById('roomStatus').value;

    const existingRoom = rooms.find(room => room.number === roomNumber);
    if (existingRoom) {
        existingRoom.type = roomType;
        existingRoom.price = roomPrice;
        existingRoom.status = roomStatus;
    } else {
        const nextId = rooms.reduce((max, room) => Math.max(max, room.id || 0), 0) + 1;
        rooms.push({
            id: nextId,
            number: roomNumber,
            type: roomType,
            price: roomPrice,
            status: roomStatus
        });
    }

    saveState();
    loadRooms();
    loadAvailableRooms();
    closeRoomModal();
    updateDashboard();
}

function handleGuestSubmit(e) {
    e.preventDefault();
    const guestData = {
        name: document.getElementById('guestNameInput').value,
        phone: document.getElementById('guestPhoneInput').value,
        email: document.getElementById('guestEmail').value,
        idProof: document.getElementById('idProofType').value,
        idNumber: document.getElementById('idProofNumber').value,
        address: document.getElementById('guestAddress').value
    };
    
    // Add new guest
    guestData.id = guests.length + 1;
    guests.push(guestData);
    
    loadGuests();
    closeGuestModal();
}

function loadGuests() {
    const guestsTable = document.getElementById('guestsTable');
    guestsTable.innerHTML = '';
    
    guests.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.name}</td>
            <td>${guest.phone}</td>
            <td>Room ${guest.roomId || '-'}</td>
            <td>${guest.checkIn || '-'}</td>
            <td>${guest.checkOut || '-'}</td>
            <td><span class="badge badge-${guest.status === 'checked-in' ? 'occupied' : 'available'}">${guest.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editGuest(${guest.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGuest(${guest.id})">Delete</button>
            </td>
        `;
        guestsTable.appendChild(row);
    });
}

function processCheckIn() {
    const guestName = document.getElementById('guestName').value;
    const guestPhone = document.getElementById('guestPhone').value;
    const selectedRoomId = document.getElementById('selectedRoomNumber').value;
    const stayDays = parseInt(document.getElementById('stayDays').value);
    const extraBed = parseInt(document.getElementById('extraBed').value);
    const paymentMode = document.getElementById('paymentMode').value;

    if (!guestName || !guestPhone || !selectedRoomId || !stayDays) {
        alert('Please fill in all required fields!');
        return;
    }

    const selectedRoom = rooms.find(room => room.id == selectedRoomId);

    if (!selectedRoom || selectedRoom.status !== 'available') {
        alert('Selected room is not available!');
        return;
    }

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const checkOutDate = new Date(Date.now() + stayDays * 24 * 60 * 60 * 1000);

    const nextBookingId = bookings.reduce((max, booking) => Math.max(max, booking.id || 0), 0) + 1;
    const booking = {
        id: nextBookingId,
        guestName,
        guestPhone,
        roomId: selectedRoom.id,
        roomType: selectedRoom.type,
        stayDays,
        extraBed,
        paymentMode,
        checkIn: now.toISOString().split('T')[0],
        checkInTime: checkInTime,
        checkOut: checkOutDate.toISOString().split('T')[0],
        checkOutTime: '',
        status: 'checked-in',
        paymentStatus: 'pending'
    };

    bookings.push(booking);

    selectedRoom.status = 'occupied';

    const existingGuest = guests.find(guest => guest.name === guestName && guest.phone === guestPhone);
    if (existingGuest) {
        existingGuest.roomId = selectedRoom.number;
        existingGuest.checkIn = booking.checkIn;
        existingGuest.checkOut = booking.checkOut;
        existingGuest.status = 'checked-in';
        existingGuest.paymentStatus = 'pending';
    } else {
        const nextGuestId = guests.reduce((max, guest) => Math.max(max, guest.id || 0), 0) + 1;
        guests.push({
            id: nextGuestId,
            name: guestName,
            phone: guestPhone,
            roomId: selectedRoom.number,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: 'checked-in',
            paymentStatus: 'pending'
        });
    }

    saveState();

    document.getElementById('checkin').querySelectorAll('input, select').forEach(input => {
        if (input.id === 'extraBed' || input.id === 'paymentMode') {
            input.value = input.querySelector('option')?.value || '0';
        } else {
            input.value = '';
        }
    });

    loadRooms();
    loadGuests();
    loadAvailableRooms();
    renderRecentActivity();
    updateDashboard();

    alert(`Check-in successful! Guest: ${guestName}, Room: ${selectedRoom.number}, Time: ${checkInTime}`);
}

function processCheckOut() {
    const guestName = document.getElementById('guestName').value;
    if (!guestName) {
        alert('Please enter guest name for check-out!');
        return;
    }

    const guest = guests.find(g => g.name === guestName && g.status === 'checked-in');
    if (!guest) {
        alert('Guest not found or already checked out!');
        return;
    }

    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    guest.status = 'checked-out';
    guest.checkOut = now.toISOString().split('T')[0];
    guest.paymentStatus = 'completed';

    const booking = bookings.find(b => b.guestName === guest.name && b.status === 'checked-in');
    if (booking) {
        booking.checkOutTime = checkOutTime;
        booking.status = 'checked-out';
        booking.paymentStatus = 'completed';
    }

    const room = rooms.find(r => r.number === guest.roomId);
    if (room) {
        room.status = 'cleaning';
    }

    saveState();

    generateBill(guest);

    loadRooms();
    loadGuests();
    loadAvailableRooms();
    renderRecentActivity();
    updateDashboard();

    alert(`Check-out successful! Guest: ${guestName}, Room: ${guest.roomId}, Time: ${checkOutTime}`);
}

function generateBill(guest) {
    // Populate billing form
    document.getElementById('billGuestName').value = guest.name;
    document.getElementById('billRoomNumber').value = guest.roomId;
    document.getElementById('billCheckIn').value = guest.checkIn;
    document.getElementById('billCheckOut').value = guest.checkOut;
    
    // Calculate days
    const checkIn = new Date(guest.checkIn);
    const checkOut = new Date(guest.checkOut);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Get room details
    const room = rooms.find(r => r.number === guest.roomId);
    const roomRate = room ? room.price : 1000;

    const booking = bookings.find(b => b.guestName === guest.name && b.checkIn === guest.checkIn);
    const extraBedQty = booking ? booking.extraBed : 0;
    const extraBedAmount = extraBedQty * 300 * days;

    document.getElementById('roomDays').textContent = days;
    document.getElementById('roomRate').textContent = `₹${roomRate}`;
    document.getElementById('roomAmount').textContent = `₹${days * roomRate}`;
    document.getElementById('extraBedQty').textContent = extraBedQty;

    if (!document.getElementById('extraBedAmount')) {
        const extraBedCell = document.getElementById('extraBedAmount');
        if (extraBedCell) {
            extraBedCell.id = 'extraBedAmount';
        }
    }

    const extraBedElement = document.getElementById('extraBedAmount');
    if (extraBedElement) {
        extraBedElement.textContent = `₹${extraBedAmount}`;
    }

    calculateBill();

    showSection('billing');
}

function calculateBill() {
    const roomAmount = parseInt(document.getElementById('roomAmount').textContent.replace('₹', '')) || 0;
    const extraBedAmount = parseInt(document.getElementById('extraBedAmount')?.textContent?.replace('₹', '')) || 0;
    const foodQty = parseInt(document.getElementById('foodQty').value) || 0;
    const laundryQty = parseInt(document.getElementById('laundryQty').value) || 0;

    const foodAmount = foodQty * 500;
    const laundryAmount = laundryQty * 200;

    document.getElementById('foodAmount').textContent = `₹${foodAmount}`;
    document.getElementById('laundryAmount').textContent = `₹${laundryAmount}`;

    const subtotal = roomAmount + extraBedAmount + foodAmount + laundryAmount;

    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('totalAmount').textContent = `₹${subtotal}`;
}

function generateInvoice() {
    alert('Invoice generated successfully! (PDF download would be implemented)');
}

function printBill() {
    window.print();
}

function generateReport() {
    const period = document.getElementById('reportPeriod').value;
    alert(`${period.charAt(0).toUpperCase() + period.slice(1)} report generated!`);
}

let occupancyChart = null;
let revenueChart = null;

function initializeCharts() {
    refreshCharts();
}

function refreshCharts() {
    // Occupancy Chart
    const occupancyCtx = document.getElementById('occupancyChart').getContext('2d');
    const occupiedCount = rooms.filter(room => room.status === 'occupied').length;
    const availableCount = rooms.filter(room => room.status === 'available').length;
    const maintenanceCount = rooms.filter(room => room.status === 'maintenance').length;
    const cleaningCount = rooms.filter(room => room.status === 'cleaning').length;
    
    if (occupancyChart) {
        occupancyChart.destroy();
    }
    
    occupancyChart = new Chart(occupancyCtx, {
        type: 'doughnut',
        data: {
            labels: ['Occupied', 'Available', 'Maintenance', 'Cleaning'],
            datasets: [{
                data: [occupiedCount, availableCount, maintenanceCount, cleaningCount],
                backgroundColor: ['#dc3545', '#28a745', '#ffc107', '#17a2b8']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Utility functions
function editRoom(id) {
    const room = rooms.find(r => r.id === id);
    if (room) {
        document.getElementById('roomNumber').value = room.number;
        document.getElementById('roomTypeSelect').value = room.type;
        document.getElementById('roomPrice').value = room.price;
        document.getElementById('roomStatus').value = room.status;
        openRoomModal();
    }
}

function editGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (guest) {
        document.getElementById('guestNameInput').value = guest.name;
        document.getElementById('guestPhoneInput').value = guest.phone;
        document.getElementById('guestEmail').value = guest.email || '';
        document.getElementById('idProofType').value = guest.idProof || 'aadhar';
        document.getElementById('idProofNumber').value = guest.idNumber || '';
        document.getElementById('guestAddress').value = guest.address || '';
        openGuestModal();
    }
}

function deleteGuest(id) {
    if (confirm('Are you sure you want to delete this guest?')) {
        guests = guests.filter(g => g.id !== id);
        loadGuests();
        updateDashboard();
    }
}

// Room management functions
function toggleRoomStatus(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const statuses = ['available', 'occupied', 'maintenance', 'cleaning'];
    const currentIndex = statuses.indexOf(room.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    
    room.status = statuses[nextIndex];
    
    // Update all displays
    loadRooms();
    loadAvailableRooms();
    updateDashboard();
    
    // Show confirmation
    alert(`Room ${room.number} status changed to: ${room.status}`);
}

function deleteRoom(roomId) {
    if (confirm('Are you sure you want to delete this room?')) {
        rooms = rooms.filter(r => r.id !== roomId);
        loadRooms();
        updateDashboard();
    }
}

// Excel export function - Only includes paid customers
function exportCustomerData() {
    // Create CSV content
    let csvContent = "Customer Name,Check-In Date,Check-In Time,Check-Out Date,Check-Out Time,Room Number,Room Type,Payment Method,Total Amount,Payment Status\n";
    
    // Get all bookings/guests with completed payments only
    const customerData = [];
    
    // Process guests data - only include those with completed payments
    guests.forEach(guest => {
        if (guest.status === 'checked-out' && guest.paymentStatus === 'completed') {
            const room = rooms.find(r => r.number === guest.roomId);
            const booking = bookings.find(b => b.guestName === guest.name);
            
            if (booking && booking.paymentStatus === 'completed') {
                customerData.push({
                    name: guest.name,
                    checkInDate: guest.checkIn || '',
                    checkInTime: booking.checkInTime || '',
                    checkOutDate: guest.checkOut || '',
                    checkOutTime: booking.checkOutTime || '',
                    roomNumber: guest.roomId || '',
                    roomType: room ? getRoomTypeName(room.type) : '',
                    paymentMethod: booking.paymentMode || 'Cash',
                    totalAmount: calculateBookingTotal(booking),
                    paymentStatus: 'Completed'
                });
            }
        }
    });
    
    // Add sample data if no real data
    if (customerData.length === 0) {
        customerData.push({
            name: 'No completed payments yet',
            checkInDate: '',
            checkInTime: '',
            checkOutDate: '',
            checkOutTime: '',
            roomNumber: '',
            roomType: '',
            paymentMethod: '',
            totalAmount: '',
            paymentStatus: 'No data available'
        });
    }
    
    // Add data to CSV
    customerData.forEach(customer => {
        csvContent += `"${customer.name}","${customer.checkInDate}","${customer.checkInTime}","${customer.checkOutDate}","${customer.checkOutTime}","${customer.roomNumber}","${customer.roomType}","${customer.paymentMethod}","${customer.totalAmount}","${customer.paymentStatus}"\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hotel_paid_customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Customer data exported successfully! ${customerData.length} paid customers exported.`);
}

function calculateBookingTotal(booking) {
    const room = rooms.find(r => r.id === booking.roomId);
    if (!room) return '₹0';
    
    const roomRate = room.price;
    const extraBedCost = booking.extraBed * 300;
    const subtotal = (roomRate * booking.stayDays) + extraBedCost;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    return `₹${total.toFixed(0)}`;
}
