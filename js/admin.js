/**
 * Bekal Go - Admin Portal Controller (Platform Administrator)
 * Focus: Master Control, Cut-Off Override, Bulk School Logistics, Routes & Revenue Analytics
 */

class AdminController {
  constructor() {}

  init() {
    this.render();
  }

  render() {
    const state = window.bekalStore.getState();
    const container = document.getElementById('admin-view');
    if (!container) return;

    // Calculate Platform Revenue and Financials
    const totalTransactionsCount = state.orders.length;
    const totalServiceFeeRevenue = state.orders.reduce((sum, o) => sum + (o.serviceFee || 1000), 0);

    const totalFoodGMV = state.orders.reduce((sum, o) => sum + (o.foodSubtotal || 0), 0);
    const totalMerchantCommission = Math.round(totalFoodGMV * (state.systemSettings.merchantCommissionPercent / 100));
    const totalPlatformEarnings = totalServiceFeeRevenue + totalMerchantCommission;

    const totalPortionsOrdered = state.orders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + item.qty, 0);
    }, 0);

    // Bulk School Deliveries (Blueprint Section 7)
    const bulkSchoolOrders = state.orders.filter(o => o.deliveryMode === 'BULK_SCHOOL');

    const isPostCutoff = state.systemSettings.isSimulatedPostCutoff;

    container.innerHTML = `
      <div class="admin-layout">
        
        <!-- Control Center Banner & Simulation Switch -->
        <div class="admin-control-bar">
          <div class="admin-title-group">
            <h2>
              <span>🛡️ Platform Master Control Bekal Go</span>
              <span class="tag tag-info" style="background: rgba(255,255,255,0.2); color: white;">Wilayah Sidoarjo</span>
            </h2>
            <p>Pusat kendali cut-off otomatis H-1, koordinasi rute drop-off sekolah, dan analitik finansial agregator.</p>
          </div>

          <div class="sim-override-card">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #C7D2FE; font-weight: 700;">
                Simulasi Waktu Sistem H-1:
              </div>
              <div style="font-weight: 800; font-size: 1rem;">
                ${isPostCutoff ? '🔴 21:05 WIB (Lewat Cut-off)' : '🟢 19:45 WIB (Pre-Order Buka)'}
              </div>
            </div>

            <div class="sim-switch-group">
              <button class="btn-toggle-cutoff ${!isPostCutoff ? 'active-pre' : ''}" 
                      onclick="window.adminCtrl.toggleSimulation(false)">
                Pre-Cutoff (Buka)
              </button>
              <button class="btn-toggle-cutoff ${isPostCutoff ? 'active-post' : ''}" 
                      onclick="window.adminCtrl.toggleSimulation(true)">
                Post-Cutoff (Tutup)
              </button>
            </div>
          </div>
        </div>

        <!-- Revenue & Operations Metrics Grid -->
        <div class="admin-metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Total Pendapatan Platform</span>
              <div class="metric-icon" style="background: #ECFDF5; color: #059669;">💰</div>
            </div>
            <div class="metric-value" style="color: #059669;">
              Rp${totalPlatformEarnings.toLocaleString('id-ID')}
            </div>
            <div class="metric-sub">
              Rp${totalServiceFeeRevenue.toLocaleString('id-ID')} (Service Fee) + Rp${totalMerchantCommission.toLocaleString('id-ID')} (Komisi ${state.systemSettings.merchantCommissionPercent}%)
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Total GMV Transaksi</span>
              <div class="metric-icon" style="background: #FFFBEB; color: #D97706;">📈</div>
            </div>
            <div class="metric-value">
              Rp${(totalFoodGMV + totalServiceFeeRevenue).toLocaleString('id-ID')}
            </div>
            <div class="metric-sub">${totalTransactionsCount} Transaksi Pre-Order H-1 Terproses</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Volume Porsi Esok Hari</span>
              <div class="metric-icon" style="background: #EFF6FF; color: #2563EB;">🍱</div>
            </div>
            <div class="metric-value">
              ${totalPortionsOrdered} <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted);">box</span>
            </div>
            <div class="metric-sub">Berasal dari ${state.tenants.length} mitra gerai UMKM sarapan</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Mitigasi Biaya MDR QRIS</span>
              <div class="metric-icon" style="background: #FDF2F8; color: #DB2777;">🛡️</div>
            </div>
            <div class="metric-value" style="color: #059669;">
              100% Aman
            </div>
            <div class="metric-sub">Sistem Dompet Internal BekalWallet sukses tekan biaya gateway</div>
          </div>
        </div>

        <!-- Split Layout: Bulk School Deliveries & Route Management -->
        <div class="admin-split-layout">
          
          <!-- Left Column: Bulk School Drop-off Dispatcher (Blueprint Section 7) -->
          <div class="card">
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 class="section-title">🏫 B2B Bulk School Drop-off Coordinator</h3>
                <p class="section-subtitle">
                  Pesanan gabungan 1 sekolah yang dikirim langsung ke pos satpam sekolah pkl 06.15 WIB.
                </p>
              </div>
              <span class="tag tag-warning">${bulkSchoolOrders.length} Pesanan Kolektif</span>
            </div>

            <table class="bulk-school-table">
              <thead>
                <tr>
                  <th>Sekolah Tujuan</th>
                  <th>Siswa & Kelas</th>
                  <th>Menu & Mitra UMKM</th>
                  <th>Waktu Pengiriman</th>
                  <th>Status Lobi Satpam</th>
                </tr>
              </thead>
              <tbody>
                ${bulkSchoolOrders.map(order => `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: var(--text-main);">${order.schoolName}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${order.pickupLocationName}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600;">${order.childName}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${order.customerName}</div>
                    </td>
                    <td>
                      ${order.items.map(i => `
                        <div style="font-size: 0.82rem;">
                          <strong>${i.qty}x</strong> ${i.name}
                        </div>
                      `).join('')}
                    </td>
                    <td>
                      <span class="tag tag-info">06.15 WIB</span>
                    </td>
                    <td>
                      <span class="tag ${order.status === 'COMPLETED' ? 'tag-success' : 'tag-warning'}">
                        ${order.status === 'COMPLETED' ? '✓ Diterima Satpam' : '🚚 Siap Dispatch Subuh'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="window.adminCtrl.exportSchoolManifest()">
                📑 Unduh Manifest Kurir Sekolah
              </button>
            </div>
          </div>

          <!-- Right Column: Koridor Kemacetan & Titik Drop & Go Sidoarjo -->
          <div class="card">
            <div class="section-header">
              <h3 class="section-title">📍 Koridor Drop & Go Sidoarjo</h3>
              <p class="section-subtitle">Pemetaan rute perjalanan pagi untuk menghindari titik kemacetan.</p>
            </div>

            <div class="routes-list">
              ${state.routes.map(route => {
                const tenantsOnRoute = state.tenants.filter(t => t.routeId === route.id);
                return `
                  <div class="route-card-item">
                    <div class="route-header">
                      <span class="route-badge" style="background: ${route.color}15; color: ${route.color};">
                        ${route.code}
                      </span>
                      <span class="tag tag-success" style="font-size: 0.72rem;">Lalu Lintas Lancar</span>
                    </div>

                    <div class="route-name">${route.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${route.trafficDesc}</div>

                    <div class="route-stops">
                      <strong>Titik Drop & Go:</strong> ${route.dropPoints.join(' ➔ ')}
                    </div>

                    <div style="font-size: 0.78rem; color: #475569; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); padding-top: 8px;">
                      <span>${tenantsOnRoute.length} Mitra UMKM aktif</span>
                      <span style="font-weight: 700; color: var(--primary);">Drop Point Siap</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- System Audit Log Feed -->
        <div class="card">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 class="section-title">📋 Platform Activity & Telemetry Stream</h3>
              <p class="section-subtitle">Aktivitas real-time pemesanan pelanggan, scanning runner merchant, dan mutasi saldo.</p>
            </div>
            <button class="btn btn-sm btn-outline" onclick="window.bekalStore.resetToDefault()">
              🔄 Reset Data Default
            </button>
          </div>

          <div class="audit-log-feed">
            ${state.systemLogs.map(log => `
              <div class="audit-item">
                <span class="audit-role-tag ${log.role.toLowerCase()}">${log.role}</span>
                <span class="audit-text">${log.message}</span>
                <span class="audit-time">${log.time}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  toggleSimulation(isPostCutoff) {
    window.bekalStore.toggleSimulationCutoff(isPostCutoff);
    this.render();
    if (window.customerCtrl) window.customerCtrl.setupCountdown();
    window.app.updateSimRibbon();
    window.app.showToast(
      isPostCutoff 
        ? 'Cut-off diaktifkan! Pemesanan esok pagi sekarang DITUTUP (Post 21:00).' 
        : 'Pre-order dibuka kembali! Pelanggan dapat memesan makanan (Pre 21:00).', 
      isPostCutoff ? 'warning' : 'success'
    );
  }

  exportSchoolManifest() {
    window.soundFx.playSuccess();
    window.app.showToast('Manifest kurir sekolah berhasil diekspor (Format Siap Kirim Satpam).', 'success');
  }
}

window.adminCtrl = new AdminController();
