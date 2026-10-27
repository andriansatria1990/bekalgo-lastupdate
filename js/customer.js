/**
 * Bekal Go - Customer Portal Controller (Orang Tua Siswa)
 */

class CustomerController {
  constructor() {
    this.cart = []; // [{ menuId, qty, notes }]
    this.selectedRoute = 'ALL';
    this.selectedSchool = 'SCH01';
    this.deliveryMode = 'DROP_AND_GO'; // 'DROP_AND_GO' or 'BULK_SCHOOL'
    this.selectedSlot = 'slot_2'; // default 06.15-06.30 WIB
    this.countdownTimer = null;
  }

  init() {
    this.setupCountdown();
    this.render();
  }

  setupCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const updateTimer = () => {
      const state = window.bekalStore.getState();
      const digitsEl = document.getElementById('customer-countdown-digits');
      const labelEl = document.getElementById('customer-countdown-label');
      if (!digitsEl || !labelEl) return;

      if (state.systemSettings.isSimulatedPostCutoff) {
        digitsEl.textContent = '00:00:00';
        digitsEl.classList.add('cutoff-warning-closed');
        labelEl.textContent = 'CUT-OFF 21.00 AKTIF (PESANAN BESOK DITUTUP)';
        return;
      }

      digitsEl.classList.remove('cutoff-warning-closed');
      labelEl.textContent = 'SISA WAKTU PRE-ORDER H-1 (CUT-OFF 21.00 WIB):';

      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(21, 0, 0, 0);

      let diff = cutoff - now;
      if (diff < 0) {
        // Next day cutoff
        cutoff.setDate(cutoff.getDate() + 1);
        diff = cutoff - now;
      }

      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

      digitsEl.textContent = `${hours}:${mins}:${secs}`;
    };

    updateTimer();
    this.countdownTimer = setInterval(updateTimer, 1000);
  }

  render() {
    const state = window.bekalStore.getState();
    const container = document.getElementById('customer-view');
    if (!container) return;

    // Filter menus based on route if selected
    let availableMenus = state.menus.filter(m => m.isAvailable);
    if (this.selectedRoute !== 'ALL') {
      const routeTenantIds = state.tenants
        .filter(t => t.routeId === this.selectedRoute)
        .map(t => t.id);
      availableMenus = availableMenus.filter(m => routeTenantIds.includes(m.tenantId));
    }

    // Active customer orders
    const myOrders = state.orders.filter(o => o.customerPhone === state.currentUser.phone);

    container.innerHTML = `
      <div class="customer-layout">
        
        <!-- Pre-Order H-1 Hero Banner -->
        <div class="preorder-hero">
          <div class="hero-top">
            <div class="hero-title-group">
              <h2>
                <span>🍱 Pre-Order Bekal Pagi H-1</span>
                <span class="brand-badge">Sidoarjo Drop & Go</span>
              </h2>
              <p>
                Pesan sarapan anak maksimal jam 21.00 WIB malam ini. Ambil langsung esok pagi via 
                <strong>Drive-Thru Drop & Go</strong> tanpa perlu turun dari kendaraan & bebas antre macet!
              </p>
            </div>

            <!-- Cut-off Countdown -->
            <div class="countdown-box">
              <div>
                <div class="countdown-label" id="customer-countdown-label">SISA WAKTU PRE-ORDER H-1:</div>
                <div class="countdown-digits" id="customer-countdown-digits">00:00:00</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Strip (Student Profile & BekalWallet Balance) -->
        <div class="customer-info-strip">
          <div class="info-pill-card">
            <div class="info-pill-left">
              <div class="info-pill-icon">🎒</div>
              <div class="info-pill-text">
                <div class="label">Siswa & Sekolah Tujuan</div>
                <div class="value">${state.currentUser.childName}</div>
              </div>
            </div>
            <span class="tag tag-success">Terdaftar</span>
          </div>

          <div class="info-pill-card">
            <div class="info-pill-left">
              <div class="info-pill-icon orange">💳</div>
              <div class="info-pill-text">
                <div class="label">Saldo BekalWallet Internal</div>
                <div class="value" style="color: var(--primary);">Rp${state.currentUser.walletBalance.toLocaleString('id-ID')}</div>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="window.customerCtrl.openTopupModal()">
              + Top Up Saldo
            </button>
          </div>

          <div class="info-pill-card">
            <div class="info-pill-left">
              <div class="info-pill-icon" style="background: #EFF6FF; color: #2563EB;">🚗</div>
              <div class="info-pill-text">
                <div class="label">Sistem Pengambilan</div>
                <div class="value">Drop & Go / Loket Darurat</div>
              </div>
            </div>
            <span class="tag tag-info">Bebas Macet</span>
          </div>
        </div>

        <!-- Recurring Subscription Banner (Blueprint 3.A) -->
        <div class="recurring-banner">
          <div class="recurring-text">
            <h4>
              <span>🔁 Langganan Mingguan (Auto Drop & Go)</span>
              <span class="tag tag-warning">Hemat 10%</span>
            </h4>
            <p>
              Kunci retensi sarapan anak Senin - Jumat tanpa ribet pesan setiap malam. 
              Bekal otomatis disiapkan & tinggal ambil di gerai rute sekolah Anda!
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.customerCtrl.openRecurringModal()">
            ⚡ Aktifkan Paket 5 Hari
          </button>
        </div>

        <!-- Filter Bar: Rute & Sekolah -->
        <div class="filter-route-bar">
          <div class="filter-group">
            <div class="filter-item">
              <label>📍 Rute Perjalanan:</label>
              <select class="custom-select" onchange="window.customerCtrl.setRoute(this.value)">
                <option value="ALL" ${this.selectedRoute === 'ALL' ? 'selected' : ''}>Semua Koridor Sidoarjo</option>
                ${state.routes.map(r => `
                  <option value="${r.id}" ${this.selectedRoute === r.id ? 'selected' : ''}>
                    ${r.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="filter-item">
              <label>🏫 Sekolah Anak:</label>
              <select class="custom-select" onchange="window.customerCtrl.setSchool(this.value)">
                ${state.schools.map(s => `
                  <option value="${s.id}" ${this.selectedSchool === s.id ? 'selected' : ''}>
                    ${s.name} (${s.bulkDropSupported ? 'Bisa Bulk Drop-off' : 'Drive-thru'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="tag tag-info" style="font-size: 0.8rem; padding: 6px 12px;">
            🛒 Multi-Tenant Cart Aktif: Bisa pesan dari berbagai gerai sekaligus!
          </div>
        </div>

        <!-- Catalog & Cart Section -->
        <div class="catalog-container">
          <!-- Food Catalog Grid -->
          <div>
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <h3 class="section-title">Menu Sarapan Sehat Pre-Order Esok Pagi</h3>
                <p class="section-subtitle">Dibuat fresh sebelum fajar oleh mitra UMKM tersertifikasi higienis.</p>
              </div>
              <span class="tag tag-success">${availableMenus.length} Menu Tersedia</span>
            </div>

            <div class="menu-cards-grid">
              ${availableMenus.map(menu => {
                const tenant = state.tenants.find(t => t.id === menu.tenantId);
                const isOutOfQuota = menu.remainingQuota <= 0;
                return `
                  <div class="food-card ${isOutOfQuota ? 'opacity-50' : ''}">
                    <div class="food-header">
                      <span class="tenant-chip">
                        🏪 ${tenant ? tenant.name : 'Mitra Bekal Go'}
                      </span>
                      <span class="badge-tag">${menu.tag || menu.category}</span>
                    </div>

                    <div class="food-body">
                      <h3>${menu.name}</h3>
                      <p class="food-desc">${menu.desc}</p>

                      <!-- Nutrition row -->
                      <div class="nutrition-row">
                        <span class="nutri-pill">🔥 ${menu.nutrition.kalori}</span>
                        <span class="nutri-pill">🥩 Protein ${menu.nutrition.protein}</span>
                        ${menu.isHalal ? '<span class="nutri-pill halal">✓ 100% Halal</span>' : ''}
                      </div>

                      <!-- Quota indicator -->
                      <div class="quota-wrapper">
                        <div class="quota-labels">
                          <span>Sisa Kuota Pre-Order H-1</span>
                          <span class="quota-left ${menu.remainingQuota < 10 ? 'text-danger' : ''}">
                            ${menu.remainingQuota} porsi
                          </span>
                        </div>
                        <div class="quota-progress">
                          <div class="quota-fill ${menu.remainingQuota < 10 ? 'low' : ''}" 
                               style="width: ${(menu.remainingQuota / menu.dailyQuota) * 100}%"></div>
                        </div>
                      </div>
                    </div>

                    <div class="food-footer">
                      <div class="price-tag">
                        Rp${menu.price.toLocaleString('id-ID')}
                        <span>/porsi</span>
                      </div>
                      <button class="btn btn-sm btn-primary" 
                              onclick="window.customerCtrl.addToCart('${menu.id}')"
                              ${isOutOfQuota ? 'disabled' : ''}>
                        ${isOutOfQuota ? 'Habis' : '+ Pesan'}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Multi-Tenant Cart Drawer (Sidebar) -->
          <div class="cart-drawer-card">
            <h3>
              <span>🛒 Keranjang Pre-Order</span>
              <span class="tag tag-success">${this.getTotalCartQty()} Item</span>
            </h3>

            ${this.renderCartItems(state)}

            <!-- Delivery / Pickup Mode Selector -->
            <div class="delivery-mode-select">
              <div class="label">Metode Pengambilan Besok Pagi:</div>
              
              <label class="radio-option">
                <input type="radio" name="deliveryMode" value="DROP_AND_GO" 
                       ${this.deliveryMode === 'DROP_AND_GO' ? 'checked' : ''}
                       onchange="window.customerCtrl.setDeliveryMode('DROP_AND_GO')">
                <div class="radio-text">
                  <div class="title">🚗 Drive-Thru Drop & Go (Pribadi)</div>
                  <div class="desc">Ambil di loket transit sepanjang rute dalam waktu 30 detik.</div>
                </div>
              </label>

              ${this.deliveryMode === 'DROP_AND_GO' ? `
                <select class="slot-time-select" onchange="window.customerCtrl.setPickupSlot(this.value)">
                  ${state.systemSettings.pickupSlots.map(slot => `
                    <option value="${slot.id}" ${this.selectedSlot === slot.id ? 'selected' : ''}>
                      ⏰ ${slot.label} (${slot.desc})
                    </option>
                  `).join('')}
                </select>
              ` : ''}

              <label class="radio-option" style="margin-top: 10px;">
                <input type="radio" name="deliveryMode" value="BULK_SCHOOL"
                       ${this.deliveryMode === 'BULK_SCHOOL' ? 'checked' : ''}
                       onchange="window.customerCtrl.setDeliveryMode('BULK_SCHOOL')">
                <div class="radio-text">
                  <div class="title">🏫 Bulk School Drop-Off (Langsung ke Lobi)</div>
                  <div class="desc">Diantar kurir gabungan langsung ke pos satpam sekolah pkl 06.15 WIB.</div>
                </div>
              </label>
            </div>

            <!-- Cost breakdown -->
            <div class="cart-summary-lines">
              <div class="summary-row">
                <span>Subtotal Makanan:</span>
                <span>Rp${this.getCartFoodSubtotal().toLocaleString('id-ID')}</span>
              </div>
              <div class="summary-row">
                <span>Service Fee Platform (Section 5):</span>
                <span>Rp${(this.cart.length > 0 ? state.systemSettings.serviceFee : 0).toLocaleString('id-ID')}</span>
              </div>
              <div class="summary-row total">
                <span>Total Bayar:</span>
                <span style="color: var(--primary-dark);">
                  Rp${this.getCartGrandTotal(state).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>Bayar via: <strong>BekalWallet</strong></span>
              <span style="color: ${state.currentUser.walletBalance >= this.getCartGrandTotal(state) ? 'var(--primary)' : 'var(--danger)'}; font-weight: 700;">
                Saldo: Rp${state.currentUser.walletBalance.toLocaleString('id-ID')}
              </span>
            </div>

            <button class="btn-checkout" 
                    onclick="window.customerCtrl.checkout()"
                    ${this.cart.length === 0 ? 'disabled' : ''}>
              Konfirmasi Pre-Order H-1
            </button>
          </div>
        </div>

        <!-- Drop & Go E-Tickets Section -->
        <div class="tickets-section">
          <div class="section-header">
            <h3 class="section-title">🎫 Tiket Virtual Drop & Go Anda</h3>
            <p class="section-subtitle">Tunjukkan QR Code ini kepada runner loket saat tiba esok pagi untuk penyerahan cepat.</p>
          </div>

          ${myOrders.length === 0 ? `
            <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
              Belum ada pesanan aktif. Silakan pilih menu di atas untuk pre-order sarapan besok pagi!
            </div>
          ` : `
            <div>
              ${myOrders.map(order => this.renderTicketCard(order, state)).join('')}
            </div>
          `}
        </div>

      </div>
    `;

    // Render QR codes for tickets
    this.renderQRCodes(myOrders);
    this.setupCountdown();
  }

  renderCartItems(state) {
    if (this.cart.length === 0) {
      return `
        <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 0.88rem;">
          Keranjang kosong.<br>Silakan pilih menu sarapan favorit anak Anda.
        </div>
      `;
    }

    // Group cart items by tenant for Multi-Tenant visibility
    const tenantGroups = {};
    this.cart.forEach(item => {
      const menu = state.menus.find(m => m.id === item.menuId);
      if (!menu) return;
      if (!tenantGroups[menu.tenantId]) {
        tenantGroups[menu.tenantId] = [];
      }
      tenantGroups[menu.tenantId].push({ item, menu });
    });

    return `
      <div class="cart-items-list">
        ${Object.keys(tenantGroups).map(tenantId => {
          const tenant = state.tenants.find(t => t.id === tenantId);
          const entries = tenantGroups[tenantId];
          return `
            <div class="cart-tenant-group">
              <div class="cart-tenant-title">🏪 ${tenant ? tenant.name : 'Tenant'}</div>
              ${entries.map(({ item, menu }) => `
                <div class="cart-item-row">
                  <div class="cart-item-info">
                    <div class="cart-item-name">${menu.name}</div>
                    <div class="cart-item-price">Rp${menu.price.toLocaleString('id-ID')} x ${item.qty}</div>
                  </div>
                  <div class="cart-qty-ctrl">
                    <button class="btn-qty" onclick="window.customerCtrl.updateQty('${menu.id}', -1)">-</button>
                    <span style="font-weight: 700; font-size: 0.85rem; width: 18px; text-align: center;">${item.qty}</span>
                    <button class="btn-qty" onclick="window.customerCtrl.updateQty('${menu.id}', 1)">+</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderTicketCard(order, state) {
    const isCompleted = order.status === 'COMPLETED';
    const isBulk = order.deliveryMode === 'BULK_SCHOOL';

    return `
      <div class="ticket-card" id="ticket-card-${order.id}">
        <div class="ticket-qr-side">
          <div class="qr-canvas-holder" id="qr-container-${order.id}"></div>
          <div class="ticket-id-tag">${order.id}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
            ${isCompleted ? '✓ SUDAH DIAMBIL' : 'SCAN SAAT TIBA'}
          </div>
        </div>

        <div class="ticket-content-side">
          <div>
            <div class="ticket-header-row">
              <div>
                <span class="tag ${isCompleted ? 'tag-info' : 'tag-success'}">
                  ${isCompleted ? '✓ Selesai Diambil' : 'Siap Di Loket Besok'}
                </span>
                <span class="tag tag-warning" style="margin-left: 6px;">
                  ${isBulk ? '🏫 Bulk School Drop' : '🚗 Drive-Thru Drop & Go'}
                </span>
              </div>
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">
                Untuk: <strong>${order.dateFor}</strong>
              </div>
            </div>

            <div class="ticket-slot-highlight" style="margin-top: 10px;">
              ⏰ Slot: ${order.pickupSlotTime}
            </div>

            <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 4px;">
              📍 Titik: <strong>${order.pickupLocationName}</strong>
            </div>

            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              Siswa: <strong>${order.childName}</strong> | Sekolah: <strong>${order.schoolName}</strong>
            </div>
          </div>

          <div class="ticket-items-summary">
            <div>Daftar Pesanan Menu:</div>
            <ul>
              ${order.items.map(i => `
                <li>
                  <span style="color: var(--primary);">•</span>
                  <span>${i.qty}x ${i.name}</span>
                  <span style="font-size: 0.76rem; color: var(--text-muted);">(${i.tenantName})</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 10px;">
            <div style="font-size: 0.82rem; color: var(--text-muted);">
              Total Terbayar: <strong style="color: var(--text-main);">Rp${order.totalPayment.toLocaleString('id-ID')}</strong> (via BekalWallet)
            </div>
            <button class="btn btn-sm btn-outline" onclick="window.customerCtrl.showSimulatedWA('${order.id}')">
              💬 Notifikasi WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderQRCodes(orders) {
    setTimeout(() => {
      orders.forEach(order => {
        const container = document.getElementById(`qr-container-${order.id}`);
        if (!container) return;
        container.innerHTML = '';
        if (window.QRCode) {
          new window.QRCode(container, {
            text: order.qrCodeData,
            width: 120,
            height: 120,
            colorDark: "#047857",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M
          });
        }
      });
    }, 50);
  }

  // Cart Operations
  addToCart(menuId) {
    const existing = this.cart.find(i => i.menuId === menuId);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ menuId, qty: 1, notes: '' });
    }
    window.app.showToast('Menu ditambahkan ke keranjang!', 'info');
    this.render();
  }

  updateQty(menuId, delta) {
    const item = this.cart.find(i => i.menuId === menuId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(i => i.menuId !== menuId);
    }
    this.render();
  }

  getTotalCartQty() {
    return this.cart.reduce((sum, i) => sum + i.qty, 0);
  }

  getCartFoodSubtotal() {
    const state = window.bekalStore.getState();
    return this.cart.reduce((sum, item) => {
      const menu = state.menus.find(m => m.id === item.menuId);
      return sum + (menu ? menu.price * item.qty : 0);
    }, 0);
  }

  getCartGrandTotal(state) {
    if (this.cart.length === 0) return 0;
    return this.getCartFoodSubtotal() + state.systemSettings.serviceFee;
  }

  setRoute(routeId) {
    this.selectedRoute = routeId;
    this.render();
  }

  setSchool(schoolId) {
    this.selectedSchool = schoolId;
    this.render();
  }

  setDeliveryMode(mode) {
    this.deliveryMode = mode;
    this.render();
  }

  setPickupSlot(slotId) {
    this.selectedSlot = slotId;
    this.render();
  }

  checkout() {
    const state = window.bekalStore.getState();

    // Check cut-off logic
    if (state.systemSettings.isSimulatedPostCutoff) {
      window.app.showToast('Pemesanan untuk besok sudah ditutup (Cut-off 21.00 telah lewat)! Silakan atur simulasi di status bar.', 'error');
      return;
    }

    if (this.cart.length === 0) return;

    const grandTotal = this.getCartGrandTotal(state);
    if (state.currentUser.walletBalance < grandTotal) {
      window.app.showToast('Saldo BekalWallet tidak mencukupi! Silakan Top Up terlebih dahulu.', 'warning');
      this.openTopupModal(grandTotal - state.currentUser.walletBalance);
      return;
    }

    // Determine pickup details
    const school = state.schools.find(s => s.id === this.selectedSchool);
    const slot = state.systemSettings.pickupSlots.find(s => s.id === this.selectedSlot);

    let pickupLocationName = 'Booth Drop & Go Taman Pinang A-1';
    let pickupSlotTime = slot ? slot.label : '06.15 - 06.30 WIB';

    if (this.deliveryMode === 'BULK_SCHOOL') {
      pickupLocationName = `Bulk Drop-off Lobi ${school ? school.name : 'Sekolah'}`;
      pickupSlotTime = '06.15 WIB (Lobi Pos Satpam)';
    }

    // Map order items
    const orderItems = this.cart.map(item => {
      const menu = state.menus.find(m => m.id === item.menuId);
      const tenant = state.tenants.find(t => t.id === menu.tenantId);
      return {
        menuId: menu.id,
        name: menu.name,
        tenantId: menu.tenantId,
        tenantName: tenant ? tenant.name : 'Mitra',
        qty: item.qty,
        price: menu.price,
        notes: item.notes || ''
      };
    });

    const newOrderId = 'BKL-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const orderData = {
      id: newOrderId,
      dateFor: '2026-10-28',
      customerName: state.currentUser.name,
      customerPhone: state.currentUser.phone,
      childName: state.currentUser.childName,
      schoolId: school ? school.id : 'SCH01',
      schoolName: school ? school.name : 'SD Al-Falah',
      deliveryMode: this.deliveryMode,
      pickupSlotId: this.selectedSlot,
      pickupSlotTime: pickupSlotTime,
      pickupLocationName: pickupLocationName,
      routeId: school ? school.routeId : 'ROUTE_A',
      items: orderItems,
      foodSubtotal: this.getCartFoodSubtotal(),
      serviceFee: state.systemSettings.serviceFee,
      totalPayment: grandTotal,
      paymentMethod: 'BEKAL_WALLET',
      status: 'READY_FOR_PICKUP',
      createdAt: new Date().toISOString(),
      qrCodeData: `BEKALGO-TICKET-${newOrderId}-${state.currentUser.childName.replace(/\s+/g, '')}`,
      scannedAt: null,
      scannedByTenantId: null
    };

    window.bekalStore.addOrder(orderData);
    this.cart = [];
    window.soundFx.playSuccess();
    window.app.showToast(`Pre-Order Berhasil! Tiket Virtual ${newOrderId} telah aktif.`, 'success');
    this.render();

    // Scroll to ticket
    setTimeout(() => {
      const el = document.getElementById(`ticket-card-${newOrderId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }

  openTopupModal(suggestedAmount = null) {
    const modal = document.getElementById('topup-modal');
    if (!modal) return;
    const amountInput = document.getElementById('topup-amount-input');
    if (amountInput) {
      amountInput.value = suggestedAmount ? Math.max(50000, Math.ceil(suggestedAmount / 10000) * 10000) : 50000;
    }
    modal.classList.add('active');
  }

  closeTopupModal() {
    const modal = document.getElementById('topup-modal');
    if (modal) modal.classList.remove('active');
  }

  confirmTopup() {
    const amountInput = document.getElementById('topup-amount-input');
    const methodSelect = document.getElementById('topup-method-select');
    const amount = parseInt(amountInput.value) || 50000;
    const method = methodSelect ? methodSelect.value : 'QRIS';

    if (amount < 20000) {
      window.app.showToast('Minimal top-up Rp20.000 untuk mitigasi fee payment gateway', 'warning');
      return;
    }

    window.bekalStore.topupWallet(amount, method);
    this.closeTopupModal();
    window.soundFx.playSuccess();
    window.app.showToast(`Top Up Berhasil! Saldo ditambah Rp${amount.toLocaleString('id-ID')}`, 'success');
  }

  openRecurringModal() {
    const modal = document.getElementById('recurring-modal');
    if (modal) modal.classList.add('active');
  }

  closeRecurringModal() {
    const modal = document.getElementById('recurring-modal');
    if (modal) modal.classList.remove('active');
  }

  confirmRecurring() {
    this.closeRecurringModal();
    window.soundFx.playSuccess();
    window.app.showToast('Paket Langganan 5 Hari Berhasil Diaktifkan! Porsi anak Anda dijamin setiap pagi.', 'success');
  }

  showSimulatedWA(orderId) {
    const state = window.bekalStore.getState();
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('wa-sim-modal');
    const content = document.getElementById('wa-sim-content');
    if (modal && content) {
      content.innerHTML = `
        <div style="background: #EFEAE2; border-radius: 12px; padding: 16px; font-family: sans-serif; font-size: 0.9rem; color: #111B21;">
          <div style="background: #FFFFFF; border-radius: 8px; padding: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border-left: 4px solid #25D366;">
            <p><strong>[BEKAL GO - PRE-ORDER CONFIRMATION]</strong></p>
            <p style="margin-top: 6px;">Halo <strong>${order.customerName}</strong>, pesanan sarapan pagi untuk Ananda <strong>${order.childName}</strong> di ${order.schoolName} telah terkonfirmasi!</p>
            <hr style="margin: 8px 0; border: none; border-top: 1px dashed #DDD;">
            <p>📋 <strong>ID Tiket:</strong> ${order.id}</p>
            <p>⏰ <strong>Slot Pick-up:</strong> ${order.pickupSlotTime}</p>
            <p>📍 <strong>Titik Ambil:</strong> ${order.pickupLocationName}</p>
            <p>🍱 <strong>Menu:</strong> ${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
            <p>💵 <strong>Status Pembayaran:</strong> LUNAS (BekalWallet)</p>
            <hr style="margin: 8px 0; border: none; border-top: 1px dashed #DDD;">
            <p style="font-size: 0.8rem; color: #54656F;">Tunjukkan QR Code di aplikasi saat tiba di loket Drop & Go. Runner siap menyerahkan bekal dalam 30 detik!</p>
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }
}

window.customerCtrl = new CustomerController();
