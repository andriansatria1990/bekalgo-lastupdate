/**
 * Bekal Go - State Management & LocalStorage Persistence
 * Central data store for Customer, Merchant, and Admin
 */

const STORAGE_KEY = 'BEKAL_GO_STATE_V1';

// Initial Mock Data
const DEFAULT_STATE = {
  // Current logged in role: 'customer' | 'merchant' | 'admin'
  currentUser: {
    role: 'customer',
    id: 'user_sari',
    name: 'Ibu Sari Rahayu',
    phone: '0812-3456-7890',
    childName: 'Kenzo (Kelas 3B)',
    defaultSchoolId: 'SCH01',
    walletBalance: 135000,
  },
  
  // Active merchant context (for Merchant dashboard)
  activeMerchantId: 'T01',

  // System Settings & Simulation Time
  systemSettings: {
    cutoffHour: 21, // 21:00 WIB
    serviceFee: 1000,
    merchantCommissionPercent: 3, // 3%
    isSimulatedPostCutoff: false, // If true, forces time to be after 21:00
    pickupSlots: [
      { id: 'slot_1', label: '06.00 - 06.15 WIB', desc: 'Cocok untuk masuk jam 06.30' },
      { id: 'slot_2', label: '06.15 - 06.30 WIB', desc: 'Slot terfavorit orang tua' },
      { id: 'slot_3', label: '06.30 - 06.45 WIB', desc: 'Pagi santai' },
      { id: 'slot_4', label: '06.45 - 07.00 WIB', desc: 'Jarak dekat sekolah' }
    ]
  },

  // Schools list in Sidoarjo
  schools: [
    {
      id: 'SCH01',
      name: 'SD Al-Falah Darussalam',
      address: 'Jl. Taman Pinang Indah Blok BB-1, Sidoarjo',
      routeId: 'ROUTE_A',
      bulkDropSupported: true,
      pickupPoint: 'Pos Lobi Utama / Drop & Go Gerbang Utara'
    },
    {
      id: 'SCH02',
      name: 'SMP Negeri 1 Sidoarjo',
      address: 'Jl. Ponti No. 9, Magersari, Sidoarjo',
      routeId: 'ROUTE_A',
      bulkDropSupported: true,
      pickupPoint: 'Drop Zone Satpam Timur'
    },
    {
      id: 'SCH03',
      name: 'SD Pucang 1 Sidoarjo',
      address: 'Jl. Raden Patah No. 88, Pucang, Sidoarjo',
      routeId: 'ROUTE_C',
      bulkDropSupported: true,
      pickupPoint: 'Pintu Gerbang Barat'
    },
    {
      id: 'SCH04',
      name: 'SD Kreatif The Nuri Buduran',
      address: 'Jl. Raya Buduran No. 15, Sidoarjo',
      routeId: 'ROUTE_C',
      bulkDropSupported: false,
      pickupPoint: 'Hanya Pick-Up Drive-Thru Tenant'
    }
  ],

  // Routes / Corridors
  routes: [
    {
      id: 'ROUTE_A',
      name: 'Koridor 1: Taman Pinang - Jl. Pahlawan',
      code: 'KOR-01',
      trafficDesc: 'Jalur padat pagi hari arah Al-Falah & GOR Sidoarjo',
      color: '#059669',
      dropPoints: ['Booth Taman Pinang A-1', 'Shelter Pahlawan 42', 'Lobi SD Al-Falah']
    },
    {
      id: 'ROUTE_B',
      name: 'Koridor 2: Kahuripan Nirwana - Lingkar Barat',
      code: 'KOR-02',
      trafficDesc: 'Rute perumahan sub-urban menuju akses tol Sidoarjo',
      color: '#D97706',
      dropPoints: ['Booth Kahuripan Avenue B-3', 'Pos Lingkar Barat 12']
    },
    {
      id: 'ROUTE_C',
      name: 'Koridor 3: Buduran - Jl. A. Yani - Pucang',
      code: 'KOR-03',
      trafficDesc: 'Akses arteri Surabaya-Sidoarjo jam 06.00-07.00',
      color: '#2563EB',
      dropPoints: ['Booth Buduran Square', 'Drop Zone Pucang 88']
    }
  ],

  // Tenants (Merchants)
  tenants: [
    {
      id: 'T01',
      name: 'Dapur Bu Nanik (Nasi Tradisional)',
      owner: 'Ibu Hj. Nanik S.',
      phone: '0813-8899-1122',
      rating: 4.9,
      reviewCount: 420,
      routeId: 'ROUTE_A',
      dropPointName: 'Booth Drop & Go Taman Pinang A-1 (Sebelah Pos Satpam Indah)',
      specialty: 'Nasi Uduk & Lontong Sayur Gurih',
      bankInfo: 'BCA 018-872-9901 a/n Nanik Sulistyowati',
      balancePending: 425000,
      balanceSettled: 3120000,
      badge: 'Tenant Paling Higienis',
      prepCapacityDaily: 50,
      photo: 'assets/logo.jpg'
    },
    {
      id: 'T02',
      name: 'Mas Dwi Roti Bakar & Susu Murni',
      owner: 'Dwi Prasetyo',
      phone: '0857-3322-4411',
      rating: 4.8,
      reviewCount: 310,
      routeId: 'ROUTE_A',
      dropPointName: 'Shelter Drop & Go Jl. Pahlawan No. 42 (Drive-thru Gerai)',
      specialty: 'Roti Gandum Panggang & Susu Pasteurisasi Sehat',
      bankInfo: 'Mandiri 141-00-1928374 a/n Dwi Prasetyo',
      balancePending: 280000,
      balanceSettled: 2450000,
      badge: 'Bahan Organik',
      prepCapacityDaily: 40,
      photo: 'assets/logo.jpg'
    },
    {
      id: 'T03',
      name: 'Bubur Ayam Cianjur Barokah',
      owner: 'Pak Mamat Barokah',
      phone: '0812-7766-5544',
      rating: 4.7,
      reviewCount: 195,
      routeId: 'ROUTE_B',
      dropPointName: 'Booth Kahuripan Avenue B-3',
      specialty: 'Bubur Ayam Gurih Kuah Kuning & Cakwe Gurih',
      bankInfo: 'BRI 001-928-118239 a/n Muhammad Mamat',
      balancePending: 195000,
      balanceSettled: 1680000,
      badge: 'Cepat & Hangat',
      prepCapacityDaily: 35,
      photo: 'assets/logo.jpg'
    },
    {
      id: 'T04',
      name: 'Bento Sehat Cilik (Kids Nutrition)',
      owner: 'dr. Anita (Ahli Gizi Anak)',
      phone: '0811-9922-8877',
      rating: 4.9,
      reviewCount: 260,
      routeId: 'ROUTE_C',
      dropPointName: 'Booth Buduran Square No. 5',
      specialty: 'Bento Karakter Seimbang Karbo-Protein-Sayur',
      bankInfo: 'BSI 718-293-8472 a/n Anita Wulandari',
      balancePending: 380000,
      balanceSettled: 3950000,
      badge: 'Rekomendasi Ahli Gizi',
      prepCapacityDaily: 45,
      photo: 'assets/logo.jpg'
    }
  ],

  // Breakfast Menus available for Pre-Order H-1
  menus: [
    {
      id: 'M01',
      tenantId: 'T01',
      name: 'Nasi Uduk Komplit Telur Balado & Orek Tempe',
      category: 'Nasi Tradisional',
      price: 16000,
      dailyQuota: 30,
      remainingQuota: 14,
      desc: 'Nasi uduk wangi daun pandan, telur balado bulat, orek tempe manis, serundeng kelapa, kerupuk, & sambal terpisah.',
      nutrition: { kalori: '420 kkal', protein: '16g', sayur: 'Timun & Daun Kemangi' },
      isHalal: true,
      isAvailable: true,
      tag: 'Favorit Anak'
    },
    {
      id: 'M02',
      tenantId: 'T01',
      name: 'Lontong Sayur Gurih Betawi Telur Puyuh',
      category: 'Nasi Tradisional',
      price: 18000,
      dailyQuota: 25,
      remainingQuota: 9,
      desc: 'Lontong lembut, sayur labu siam kuah santan gurih segar tidak pedas, telur puyuh 3 butir, tahu & bawang goreng.',
      nutrition: { kalori: '380 kkal', protein: '14g', sayur: 'Labu Siam & Kacang Panjang' },
      isHalal: true,
      isAvailable: true,
      tag: 'Hangat Pagi'
    },
    {
      id: 'M03',
      tenantId: 'T02',
      name: 'Roti Gandum Panggang Choco-Cheese + Susu UHT',
      category: 'Roti & Susu',
      price: 15000,
      dailyQuota: 35,
      remainingQuota: 22,
      desc: 'Roti tawar gandum utuh panggang mentega dengan isian cokelat lumer & keju cheddar parut, include 1 kotak Susu UHT 200ml.',
      nutrition: { kalori: '360 kkal', protein: '12g', kalsium: 'Tinggi Kalsium' },
      isHalal: true,
      isAvailable: true,
      tag: 'Praktis Mobil'
    },
    {
      id: 'M04',
      tenantId: 'T02',
      name: 'Club Sandwich Telur Mayones & Smoked Beef',
      category: 'Roti & Susu',
      price: 17000,
      dailyQuota: 25,
      remainingQuota: 11,
      desc: 'Sandwich 3 lapis dengan selada segar, tomat, telur dadar lembut, irisan smoked beef halal, keju & mayo ringan.',
      nutrition: { kalori: '390 kkal', protein: '18g', sayur: 'Selada & Tomat Ceri' },
      isHalal: true,
      isAvailable: true,
      tag: 'Tinggi Protein'
    },
    {
      id: 'M05',
      tenantId: 'T03',
      name: 'Bubur Ayam Barokah Komplit Cakwe & Telur Rebus',
      category: 'Bubur Sehat',
      price: 15000,
      dailyQuota: 30,
      remainingQuota: 16,
      desc: 'Bubur beras pandan wangi lembut, suwiran ayam kampung, kuah kuning gurih sedap, cakwe garing, kedelai goreng, & kerupuk.',
      nutrition: { kalori: '340 kkal', protein: '15g', tekstur: 'Mudah Dicerna' },
      isHalal: true,
      isAvailable: true,
      tag: 'Mudah Dicerna'
    },
    {
      id: 'M06',
      tenantId: 'T04',
      name: 'Bento Dino Nasi Kuning + Chicken Pop Nugget Sayur',
      category: 'Bento Sehat',
      price: 22000,
      dailyQuota: 25,
      remainingQuota: 8,
      desc: 'Nasi kuning rempah dicetak bentuk Dino imut, nugget ayam wortel buatan rumahan tanpa pengawet, sosis mini, brokoli kukus & saus tomat.',
      nutrition: { kalori: '450 kkal', protein: '19g', sayur: 'Wortel & Brokoli' },
      isHalal: true,
      isAvailable: true,
      tag: 'Bikin Anak Lahap'
    },
    {
      id: 'M07',
      tenantId: 'T04',
      name: 'Fruit Cup Segar + Madu Randu Murni',
      category: 'Pelengkap',
      price: 8000,
      dailyQuota: 40,
      remainingQuota: 28,
      desc: 'Potongan buah segar melon manis, apel fuji, anggur merah, & semangka, dilengkapi cocolan sachet madu murni.',
      nutrition: { kalori: '110 kkal', vitamin: 'Vitamin C & Antioksidan' },
      isHalal: true,
      isAvailable: true,
      tag: 'Ekstra Buah'
    }
  ],

  // Active & Past Orders
  orders: [
    {
      id: 'BKL-20261027-001',
      dateFor: '2026-10-28', // Besok Pagi
      customerName: 'Ibu Sari Rahayu',
      customerPhone: '0812-3456-7890',
      childName: 'Kenzo (Kelas 3B)',
      schoolId: 'SCH01',
      schoolName: 'SD Al-Falah Darussalam',
      deliveryMode: 'DROP_AND_GO', // or 'BULK_SCHOOL'
      pickupSlotId: 'slot_2',
      pickupSlotTime: '06.15 - 06.30 WIB',
      pickupLocationName: 'Booth Drop & Go Taman Pinang A-1',
      routeId: 'ROUTE_A',
      items: [
        {
          menuId: 'M01',
          name: 'Nasi Uduk Komplit Telur Balado & Orek Tempe',
          tenantId: 'T01',
          tenantName: 'Dapur Bu Nanik',
          qty: 1,
          price: 16000,
          notes: 'Sambal dipisah ya Bu'
        },
        {
          menuId: 'M07',
          name: 'Fruit Cup Segar + Madu Randu Murni',
          tenantId: 'T04',
          tenantName: 'Bento Sehat Cilik',
          qty: 1,
          price: 8000,
          notes: 'Buah dingin segar'
        }
      ],
      foodSubtotal: 24000,
      serviceFee: 1000,
      totalPayment: 25000,
      paymentMethod: 'BEKAL_WALLET',
      status: 'READY_FOR_PICKUP', // 'PENDING_CUTOFF', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'
      createdAt: '2026-10-27T10:15:00',
      qrCodeData: 'BEKALGO-TICKET-001-SARI-KENZO',
      scannedAt: null,
      scannedByTenantId: null
    },
    {
      id: 'BKL-20261027-002',
      dateFor: '2026-10-28',
      customerName: 'Bpk. Ahmad Fauzi',
      customerPhone: '0813-9988-7711',
      childName: 'Nadia (Kelas 5A)',
      schoolId: 'SCH01',
      schoolName: 'SD Al-Falah Darussalam',
      deliveryMode: 'BULK_SCHOOL', // Drop-off massal ke sekolah langsung
      pickupSlotId: 'slot_1',
      pickupSlotTime: '06.15 WIB (Lobi Pos Satpam)',
      pickupLocationName: 'Bulk Drop-off Lobi SD Al-Falah Darussalam',
      routeId: 'ROUTE_A',
      items: [
        {
          menuId: 'M06',
          name: 'Bento Dino Nasi Kuning + Chicken Pop',
          tenantId: 'T04',
          tenantName: 'Bento Sehat Cilik',
          qty: 1,
          price: 22000,
          notes: 'Nasi banyakin sedikit'
        }
      ],
      foodSubtotal: 22000,
      serviceFee: 1000,
      totalPayment: 23000,
      paymentMethod: 'BEKAL_WALLET',
      status: 'READY_FOR_PICKUP',
      createdAt: '2026-10-27T11:00:00',
      qrCodeData: 'BEKALGO-TICKET-002-AHMAD-NADIA',
      scannedAt: null,
      scannedByTenantId: null
    },
    {
      id: 'BKL-20261026-999',
      dateFor: '2026-10-27',
      customerName: 'Ibu Sari Rahayu',
      customerPhone: '0812-3456-7890',
      childName: 'Kenzo (Kelas 3B)',
      schoolId: 'SCH01',
      schoolName: 'SD Al-Falah Darussalam',
      deliveryMode: 'DROP_AND_GO',
      pickupSlotId: 'slot_2',
      pickupSlotTime: '06.15 - 06.30 WIB',
      pickupLocationName: 'Booth Drop & Go Taman Pinang A-1',
      routeId: 'ROUTE_A',
      items: [
        {
          menuId: 'M03',
          name: 'Roti Gandum Panggang Choco-Cheese + Susu UHT',
          tenantId: 'T02',
          tenantName: 'Mas Dwi Roti Bakar',
          qty: 1,
          price: 15000,
          notes: 'Keju banyakin'
        }
      ],
      foodSubtotal: 15000,
      serviceFee: 1000,
      totalPayment: 16000,
      paymentMethod: 'BEKAL_WALLET',
      status: 'COMPLETED',
      createdAt: '2026-10-26T18:30:00',
      qrCodeData: 'BEKALGO-TICKET-999-SARI-PAST',
      scannedAt: '2026-10-27T06:22:15',
      scannedByTenantId: 'T02'
    }
  ],

  // Wallet Mutations Log
  walletHistory: [
    {
      id: 'WAL-01',
      type: 'TOPUP',
      amount: 100000,
      desc: 'Top Up BekalWallet via QRIS Mandiri',
      timestamp: '2026-10-26 14:20 WIB',
      status: 'SUCCESS'
    },
    {
      id: 'WAL-02',
      type: 'PAYMENT',
      amount: -16000,
      desc: 'Pembayaran Pre-Order BKL-20261026-999',
      timestamp: '2026-10-26 18:30 WIB',
      status: 'SUCCESS'
    },
    {
      id: 'WAL-03',
      type: 'TOPUP',
      amount: 75000,
      desc: 'Top Up BekalWallet via BCA Virtual Account',
      timestamp: '2026-10-27 09:10 WIB',
      status: 'SUCCESS'
    },
    {
      id: 'WAL-04',
      type: 'PAYMENT',
      amount: -24000,
      desc: 'Pembayaran Pre-Order BKL-20261027-001',
      timestamp: '2026-10-27 10:15 WIB',
      status: 'SUCCESS'
    }
  ],

  // Recurring Subscriptions (Pengunci Retensi Blueprint 3.A)
  subscriptions: [
    {
      id: 'SUB-01',
      customerName: 'Ibu Sari Rahayu',
      childName: 'Kenzo (Kelas 3B)',
      planType: 'PAKET_MINGGUAN_5HARI', // Senin-Jumat
      title: 'Paket Sarapan Gizi 5 Hari (Senin - Jumat)',
      daysCount: 5,
      totalAmount: 95000, // Diskon dari 105.000
      discountLabel: 'Hemat 10% & Anti Lupa',
      status: 'ACTIVE',
      nextScheduledDate: '2026-10-28',
      schoolName: 'SD Al-Falah Darussalam',
      autoDeduct: true
    }
  ],

  // Activity Logs for Platform Audit
  systemLogs: [
    { id: 'LOG-01', time: '10:15 WIB', role: 'CUSTOMER', message: 'Ibu Sari membuat Pre-Order H-1 (BKL-20261027-001) - 2 Tenant Multi-Cart' },
    { id: 'LOG-02', time: '10:30 WIB', role: 'MERCHANT', message: 'Dapur Bu Nanik menerima alokasi 1 porsi Nasi Uduk' },
    { id: 'LOG-03', time: '11:00 WIB', role: 'CUSTOMER', message: 'Bpk. Ahmad Fauzi memilih Bulk School Drop-Off SD Al-Falah' },
    { id: 'LOG-04', time: '11:15 WIB', role: 'ADMIN', message: 'Validasi Koridor 1 selesai. Semua gerai Drop & Go status NORMAL' }
  ]
};

// Global Store Helper
class BekalGoStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error loading state from localStorage:', e);
    }
    this.saveState(DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  getState() {
    return this.state;
  }

  updateState(updaterFn) {
    updaterFn(this.state);
    this.saveState(this.state);
    this.notify();
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState(this.state);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Convenience helper methods
  setCurrentRole(role, extra = {}) {
    this.updateState(s => {
      s.currentUser.role = role;
      if (role === 'merchant' && extra.merchantId) {
        s.activeMerchantId = extra.merchantId;
      }
    });
  }

  setActiveMerchant(merchantId) {
    this.updateState(s => {
      s.activeMerchantId = merchantId;
    });
  }

  topupWallet(amount, method = 'QRIS') {
    this.updateState(s => {
      s.currentUser.walletBalance += amount;
      s.walletHistory.unshift({
        id: 'WAL-' + Date.now(),
        type: 'TOPUP',
        amount: amount,
        desc: `Top Up BekalWallet via ${method}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        status: 'SUCCESS'
      });
      s.systemLogs.unshift({
        id: 'LOG-' + Date.now(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        role: 'CUSTOMER',
        message: `${s.currentUser.name} melakukan Top Up saldo Rp${amount.toLocaleString('id-ID')} via ${method}`
      });
    });
  }

  addOrder(orderData) {
    this.updateState(s => {
      // Deduct wallet
      s.currentUser.walletBalance -= orderData.totalPayment;
      
      // Add wallet history
      s.walletHistory.unshift({
        id: 'WAL-' + Date.now(),
        type: 'PAYMENT',
        amount: -orderData.totalPayment,
        desc: `Pemesanan Pre-Order Bekal Go (${orderData.id})`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        status: 'SUCCESS'
      });

      // Update menu quotas
      orderData.items.forEach(item => {
        const menu = s.menus.find(m => m.id === item.menuId);
        if (menu && menu.remainingQuota > 0) {
          menu.remainingQuota = Math.max(0, menu.remainingQuota - item.qty);
        }
      });

      // Add to orders list
      s.orders.unshift(orderData);

      // Add system log
      s.systemLogs.unshift({
        id: 'LOG-' + Date.now(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        role: 'CUSTOMER',
        message: `Pesanan Baru: ${orderData.id} oleh ${orderData.customerName} (${orderData.items.length} menu)`
      });
    });
  }

  scanAndCompleteOrder(ticketCode, scannedByTenantId) {
    let matchedOrder = null;
    this.updateState(s => {
      matchedOrder = s.orders.find(o => 
        (o.qrCodeData === ticketCode || o.id === ticketCode) && o.status !== 'CANCELLED'
      );

      if (matchedOrder) {
        matchedOrder.status = 'COMPLETED';
        matchedOrder.scannedAt = new Date().toISOString();
        matchedOrder.scannedByTenantId = scannedByTenantId;

        // Credit tenant balance
        const tenant = s.tenants.find(t => t.id === scannedByTenantId);
        const tenantTotal = matchedOrder.items
          .filter(i => i.tenantId === scannedByTenantId)
          .reduce((sum, i) => sum + (i.price * i.qty), 0);

        if (tenant && tenantTotal > 0) {
          const commission = tenantTotal * (s.systemSettings.merchantCommissionPercent / 100);
          const net = tenantTotal - commission;
          tenant.balancePending = Math.max(0, tenant.balancePending - net);
          tenant.balanceSettled += net;
        }

        s.systemLogs.unshift({
          id: 'LOG-' + Date.now(),
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          role: 'MERCHANT',
          message: `QR Scanned & Handed Over: Tiket ${matchedOrder.id} untuk ${matchedOrder.childName} berhasil dipindai tenant ${scannedByTenantId}`
        });
      }
    });

    return matchedOrder;
  }

  toggleSimulationCutoff(isPostCutoff) {
    this.updateState(s => {
      s.systemSettings.isSimulatedPostCutoff = isPostCutoff;
      s.systemLogs.unshift({
        id: 'LOG-' + Date.now(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        role: 'ADMIN',
        message: `Simulasi Waktu Sistem diubah: ${isPostCutoff ? 'SETELAH CUT-OFF (21:05 WIB - Pesanan Ditutup)' : 'SEBELUM CUT-OFF (19:30 WIB - Pre-Order Terbuka)'}`
      });
    });
  }
}

// Export singleton to window
window.bekalStore = new BekalGoStore();
