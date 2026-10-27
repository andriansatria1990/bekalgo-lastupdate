/**
 * Bekal Go - Merchant Portal Controller (Mitra Tenant UMKM)
 * Focus: Drop & Go Morning Runner Scanning, Kitchen Manifest, Daily Quotas, and Settlement
 */

class MerchantController {
  constructor() {
    this.scannerMode = 'SIMULATION'; // 'SIMULATION' or 'CAMERA'
    this.webcamStream = null;
  }

  init() {
    this.render();
  }

  render() {
    const state = window.bekalStore.getState();
    const container = document.getElementById('merchant-view');
    if (!container) return;

    const currentTenant = state.tenants.find(t => t.id === state.activeMerchantId) || state.tenants[0];

    // Orders belonging to this tenant
    const relevantOrders = state.orders.filter(order => 
      order.items.some(item => item.tenantId === currentTenant.id)
    );

    // Calculate portions and revenue for tomorrow
    let totalPortionsTomorrow = 0;
    let totalGrossTomorrow = 0;
    let completedScansCount = 0;

    relevantOrders.forEach(order => {
      order.items
        .filter(i => i.tenantId === currentTenant.id)
        .forEach(i => {
          totalPortionsTomorrow += i.qty;
          totalGrossTomorrow += (i.price * i.qty);
        });

      if (order.status === 'COMPLETED') {
        completedScansCount++;
      }
    });

    const pendingScansCount = relevantOrders.length - completedScansCount;

    // Tenant menus
    const tenantMenus = state.menus.filter(m => m.tenantId === currentTenant.id);

    container.innerHTML = `
      <div class="merchant-layout">
        
        <!-- Topbar: Profile & Tenant Switcher -->
        <div class="merchant-topbar">
          <div class="merchant-profile">
            <img src="${currentTenant.photo || 'assets/logo.jpg'}" alt="Tenant Avatar" class="merchant-avatar">
            <div class="merchant-meta">
              <h2>
                <span>${currentTenant.name}</span>
                <span class="tag tag-success">⭐ ${currentTenant.rating} (${currentTenant.reviewCount} ulasan)</span>
              </h2>
              <p>📍 ${currentTenant.dropPointName} | Pemilik: <strong>${currentTenant.owner}</strong></p>
            </div>
          </div>

          <div class="tenant-switcher-box">
            <label>Ganti Akun Mitra:</label>
            <select class="custom-select" onchange="window.merchantCtrl.changeActiveMerchant(this.value)">
              ${state.tenants.map(t => `
                <option value="${t.id}" ${t.id === currentTenant.id ? 'selected' : ''}>
                  ${t.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Operational Stat Cards -->
        <div class="merchant-stats-grid">
          <div class="stat-card stat-green">
            <div class="stat-title">Porsi Dapur Esok Pagi</div>
            <div class="stat-value">${totalPortionsTomorrow} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">porsi</span></div>
            <div class="stat-desc">Sudah dipesan orang tua via Pre-Order H-1</div>
          </div>

          <div class="stat-card stat-blue">
            <div class="stat-title">Progres Scanning Drop & Go</div>
            <div class="stat-value">${completedScansCount}/${relevantOrders.length}</div>
            <div class="stat-desc">${pendingScansCount} bekal menunggu diambil di loket pagi</div>
          </div>

          <div class="stat-card stat-orange">
            <div class="stat-title">Estimasi Omzet Bersih</div>
            <div class="stat-value" style="color: #D97706;">
              Rp${Math.round(totalGrossTomorrow * 0.97).toLocaleString('id-ID')}
            </div>
            <div class="stat-desc">Setelah potongan komisi platform 3% (Bebas Biaya QRIS)</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Saldo Siap Dicairkan</div>
            <div class="stat-value" style="color: var(--primary);">
              Rp${currentTenant.balanceSettled.toLocaleString('id-ID')}
            </div>
            <div class="stat-desc">Rekening: ${currentTenant.bankInfo}</div>
          </div>
        </div>

        <!-- Main Operational Split: Scanner & Kitchen Queue -->
        <div class="merchant-main-grid">
          
          <!-- Column 1: QR Scanner Card -->
          <div class="scanner-card">
            <div class="scanner-header">
              <h3>
                <span>📷 QR Scanner Drop & Go</span>
              </h3>
              <span class="tag tag-success" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">
                Kamera Siap
              </span>
            </div>

            <div class="scanner-viewport">
              <div class="scanner-laser"></div>
              <div class="scanner-corners"></div>
              
              <div style="font-size: 2.2rem; margin-bottom: 8px;">📲</div>
              <div style="font-weight: 700; font-size: 0.95rem;">Arahkan ke QR Tiket Pelanggan</div>
              <div class="scanner-instruction">
                Pindai saat mobil/motor orang tua berhenti di loket Drop & Go (proses &lt; 30 detik).
              </div>
            </div>

            <div class="scanner-input-group">
              <label style="font-size: 0.8rem; font-weight: 600; color: #94A3B8;">Input Kode Tiket Manual / Scanner Barcode:</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="merchant-scan-input" class="scanner-code-input" 
                       placeholder="Scan kode tiket..." style="flex: 1;"
                       onkeypress="if(event.key === 'Enter') window.merchantCtrl.submitScan()">
                <button class="btn btn-primary" onclick="window.merchantCtrl.submitScan()">
                  Verifikasi
                </button>
              </div>
            </div>

            <!-- Quick Testing Simulator (Click ticket to simulate camera scan) -->
            <div class="scanner-quick-test">
              <div style="font-weight: 700; margin-bottom: 4px;">⚡ Simulasi Scan Cepat (Klik untuk test scan):</div>
              <div class="scanner-quick-btns">
                ${relevantOrders.map(o => `
                  <button class="btn-quick-scan" 
                          style="${o.status === 'COMPLETED' ? 'opacity: 0.4; text-decoration: line-through;' : 'background: #059669;'}"
                          onclick="window.merchantCtrl.simulateQuickScan('${o.id}')">
                    ${o.id.slice(-7)} (${o.childName.split(' ')[0]}) ${o.status === 'COMPLETED' ? '✓' : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <button class="btn btn-outline" style="color: white; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05);"
                    onclick="window.merchantCtrl.toggleWebcam()">
              📹 Nyalakan / Uji Kamera HP Fisik
            </button>
          </div>

          <!-- Column 2: Kitchen Manifest & Pick-up Queue Grouped by Time Slots -->
          <div class="queue-container">
            
            <div class="manifest-toolbar">
              <div>
                <h3 class="section-title">Rekapitulasi Pesanan Dapur H-1</h3>
                <p class="section-subtitle">Dikelompokkan rapi berdasarkan slot jam ambil pagi esok hari.</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-outline btn-sm" onclick="window.merchantCtrl.printManifest()">
                  🖨️ Cetak Manifest Dapur
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.merchantCtrl.openSettlementModal()">
                  💰 Ajukan Pencairan Dana
                </button>
              </div>
            </div>

            <!-- Queue sorted by Time Slots -->
            ${state.systemSettings.pickupSlots.map(slot => {
              const ordersInSlot = relevantOrders.filter(o => o.pickupSlotId === slot.id || (slot.id === 'slot_1' && o.deliveryMode === 'BULK_SCHOOL'));
              
              if (ordersInSlot.length === 0) {
                return '';
              }

              return `
                <div class="slot-queue-card">
                  <div class="slot-queue-header">
                    <div class="slot-time-badge">
                      <span>⏰ Slot: ${slot.label}</span>
                      <span class="tag tag-info">${ordersInSlot.length} Pesanan</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                      Prioritas Pengemasan Dapur
                    </div>
                  </div>

                  <table class="order-items-table">
                    <thead>
                      <tr>
                        <th>Pelanggan & Siswa</th>
                        <th>Menu Pesanan Anda</th>
                        <th>Metode Ambil</th>
                        <th>Status Drop & Go</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ordersInSlot.map(order => {
                        const myItems = order.items.filter(i => i.tenantId === currentTenant.id);
                        const isDone = order.status === 'COMPLETED';

                        return `
                          <tr style="${isDone ? 'background: #F0FDF4;' : ''}">
                            <td>
                              <div class="customer-cell">
                                <span class="name">${order.childName}</span>
                                <span class="meta">${order.customerName} (${order.customerPhone})</span>
                                <span class="meta" style="color: #2563EB;">🏫 ${order.schoolName}</span>
                              </div>
                            </td>
                            <td>
                              <div style="font-size: 0.88rem; font-weight: 600;">
                                ${myItems.map(i => `
                                  <div>
                                    <span style="color: var(--primary);">${i.qty}x</span> ${i.name}
                                    ${i.notes ? `<div style="font-size: 0.75rem; color: #D97706;">Catatan: "${i.notes}"</div>` : ''}
                                  </div>
                                `).join('')}
                              </div>
                            </td>
                            <td>
                              <span class="tag ${order.deliveryMode === 'BULK_SCHOOL' ? 'tag-warning' : 'tag-info'}">
                                ${order.deliveryMode === 'BULK_SCHOOL' ? 'Sekolah (06.15)' : 'Drive-Thru'}
                              </span>
                            </td>
                            <td>
                              <span class="tag ${isDone ? 'tag-success' : 'tag-warning'}">
                                ${isDone ? '✓ Sudah Diserahkan' : '⏳ Menunggu Scan'}
                              </span>
                            </td>
                            <td>
                              ${isDone ? `
                                <span style="font-size: 0.78rem; color: #059669; font-weight: 700;">
                                  Selesai
                                </span>
                              ` : `
                                <button class="btn btn-sm btn-primary" onclick="window.merchantCtrl.simulateQuickScan('${order.id}')">
                                  Scan QR
                                </button>
                              `}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}

            ${relevantOrders.length === 0 ? `
              <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                Belum ada pesanan masuk untuk gerai ini esok pagi.
              </div>
            ` : ''}

            <!-- Daily Stock & Quota Management Card (Blueprint 3.B) -->
            <div class="card" style="margin-top: 10px;">
              <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4 style="font-size: 1.1rem; font-weight: 800;">Manajemen Menu & Stok Porsi Harian H-1</h4>
                  <p class="section-subtitle">Atur kuota porsi maksimal sarapan yang sanggup dimasak dapur Anda sebelum subuh.</p>
                </div>
                <button class="btn btn-outline btn-sm" onclick="window.merchantCtrl.saveStockQuotas()">
                  Simpan Perubahan Kuota
                </button>
              </div>

              <div class="stock-grid">
                ${tenantMenus.map(menu => `
                  <div class="stock-card">
                    <div class="stock-card-top">
                      <div class="stock-name">${menu.name}</div>
                      <span class="tag tag-info">${menu.category}</span>
                    </div>

                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                      Rp${menu.price.toLocaleString('id-ID')}
                    </div>

                    <div class="stock-quota-editor">
                      <span>Kuota Porsi H-1:</span>
                      <input type="number" class="stock-num-input" id="stock-input-${menu.id}" 
                             value="${menu.dailyQuota}" min="5" max="100">
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
                      <span>Tersisa: <strong>${menu.remainingQuota} porsi</strong></span>
                      <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                        <input type="checkbox" id="avail-input-${menu.id}" ${menu.isAvailable ? 'checked' : ''}>
                        <span>Aktif Pre-Order</span>
                      </label>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

      </div>
    `;
  }

  changeActiveMerchant(merchantId) {
    window.bekalStore.setActiveMerchant(merchantId);
    this.render();
    window.app.showToast(`Beralih ke akun gerai: ${merchantId}`, 'info');
  }

  submitScan() {
    const input = document.getElementById('merchant-scan-input');
    if (!input || !input.value.trim()) return;

    this.processScanTicket(input.value.trim());
    input.value = '';
  }

  simulateQuickScan(ticketCode) {
    this.processScanTicket(ticketCode);
  }

  processScanTicket(ticketCode) {
    const state = window.bekalStore.getState();
    const matched = window.bekalStore.scanAndCompleteOrder(ticketCode, state.activeMerchantId);

    if (matched) {
      window.soundFx.playBeep();
      window.app.showToast(`Berhasil Dipindai! Bekal untuk ${matched.childName} siap diserahkan (Drop & Go Selesai).`, 'success');
      this.render();
      // Notify customer view if open
      if (window.customerCtrl) {
        window.customerCtrl.render();
      }
    } else {
      window.app.showToast('Kode tiket tidak ditemukan atau sudah dibatalkan!', 'error');
    }
  }

  toggleWebcam() {
    // Open a real webcam preview dialog or trigger camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          this.webcamStream = stream;
          window.app.showToast('Kamera aktif! Arahkan ke layar HP orang tua.', 'success');
          // In actual device, video would stream to video element
        })
        .catch(err => {
          window.app.showToast('Izin kamera tidak tersedia atau simulasi browser aktif. Anda tetap bisa menggunakan simulasi scanner!', 'info');
        });
    } else {
      window.app.showToast('Kamera tidak didukung di perangkat ini. Gunakan fitur Simulasi Scan Cepat.', 'info');
    }
  }

  saveStockQuotas() {
    const state = window.bekalStore.getState();
    const currentTenant = state.tenants.find(t => t.id === state.activeMerchantId);
    const tenantMenus = state.menus.filter(m => m.tenantId === currentTenant.id);

    window.bekalStore.updateState(s => {
      tenantMenus.forEach(menu => {
        const input = document.getElementById(`stock-input-${menu.id}`);
        const avail = document.getElementById(`avail-input-${menu.id}`);
        const m = s.menus.find(item => item.id === menu.id);
        if (m) {
          if (input) m.dailyQuota = parseInt(input.value) || 20;
          if (avail) m.isAvailable = avail.checked;
        }
      });
    });

    window.soundFx.playSuccess();
    window.app.showToast('Perubahan kuota porsi harian berhasil disimpan!', 'success');
    this.render();
  }

  printManifest() {
    window.print();
  }

  openSettlementModal() {
    const state = window.bekalStore.getState();
    const currentTenant = state.tenants.find(t => t.id === state.activeMerchantId);
    const modal = document.getElementById('settlement-modal');
    const content = document.getElementById('settlement-modal-content');

    if (modal && content) {
      content.innerHTML = `
        <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: var(--bg-card-alt); padding: 14px; border-radius: var(--radius-md);">
            <div style="color: var(--text-muted); font-size: 0.8rem;">TOTAL SALDO PENCAIRAN TERSEDIA:</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">
              Rp${currentTenant.balanceSettled.toLocaleString('id-ID')}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              *Dana hasil Pre-Order H-1 yang telah dipindai saat penyerahan Drop & Go.
            </div>
          </div>

          <div>
            <strong>Rekening Tujuan Pencairan:</strong>
            <div style="background: #FFFFFF; border: 1px solid var(--border); padding: 10px 14px; border-radius: var(--radius-md); margin-top: 6px; font-weight: 600;">
              🏦 ${currentTenant.bankInfo}
            </div>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Proses transfer otomatis via BI-FAST / Virtual Account Bank tanpa potongan tambahan MDR.
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  confirmSettlement() {
    const modal = document.getElementById('settlement-modal');
    if (modal) modal.classList.remove('active');

    window.soundFx.playSuccess();
    window.app.showToast('Pengajuan pencairan dana berhasil diproses! Saldo dikirim ke rekening dalam 15 menit.', 'success');
  }
}

window.merchantCtrl = new MerchantController();
