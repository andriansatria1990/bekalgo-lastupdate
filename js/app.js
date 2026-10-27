/**
 * Bekal Go - Main Application Orchestrator
 * Coordinates separated views for Customer, Merchant, and Admin
 */

class BekalGoApp {
  constructor() {
    this.currentRole = 'customer'; // 'customer' | 'merchant' | 'admin'
  }

  init() {
    // Read initial role from store
    const state = window.bekalStore.getState();
    this.currentRole = state.currentUser.role || 'customer';

    // Subscribe to store updates
    window.bekalStore.subscribe((newState) => {
      this.handleStateChange(newState);
    });

    // Initialize child controllers
    if (window.customerCtrl) window.customerCtrl.init();
    if (window.merchantCtrl) window.merchantCtrl.init();
    if (window.adminCtrl) window.adminCtrl.init();

    this.switchRole(this.currentRole);
    this.updateSimRibbon();
    this.updateHeaderProfile();
  }

  switchRole(role, extra = {}) {
    this.currentRole = role;
    window.bekalStore.setCurrentRole(role, extra);

    // Update active class on role tabs
    const buttons = document.querySelectorAll('.role-tab-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-role') === role) {
        btn.classList.add('active');
      }
    });

    // Toggle view containers
    const views = {
      customer: document.getElementById('customer-view'),
      merchant: document.getElementById('merchant-view'),
      admin: document.getElementById('admin-view')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === role) {
          views[key].classList.add('active');
        } else {
          views[key].classList.remove('active');
        }
      }
    });

    // Re-render active view
    if (role === 'customer' && window.customerCtrl) {
      window.customerCtrl.render();
    } else if (role === 'merchant' && window.merchantCtrl) {
      window.merchantCtrl.render();
    } else if (role === 'admin' && window.adminCtrl) {
      window.adminCtrl.render();
    }

    this.updateHeaderProfile();
    window.soundFx.init();
  }

  handleStateChange(state) {
    this.updateHeaderProfile();
    this.updateSimRibbon();
  }

  updateHeaderProfile() {
    const state = window.bekalStore.getState();
    const walletChip = document.getElementById('header-wallet-chip');
    const roleIndicator = document.getElementById('header-role-indicator');

    if (walletChip) {
      if (this.currentRole === 'customer') {
        walletChip.style.display = 'flex';
        walletChip.innerHTML = `
          <span>💳 BekalWallet: <strong>Rp${state.currentUser.walletBalance.toLocaleString('id-ID')}</strong></span>
          <span class="topup-plus" title="Top Up Saldo">+</span>
        `;
      } else {
        walletChip.style.display = 'none';
      }
    }

    if (roleIndicator) {
      if (this.currentRole === 'customer') {
        roleIndicator.innerHTML = `👨‍👩‍👧 <span>${state.currentUser.name}</span>`;
        roleIndicator.style.background = '#ECFDF5';
        roleIndicator.style.color = '#047857';
        roleIndicator.style.borderColor = '#A7F3D0';
      } else if (this.currentRole === 'merchant') {
        const currentTenant = state.tenants.find(t => t.id === state.activeMerchantId) || state.tenants[0];
        roleIndicator.innerHTML = `🍳 <span>Mitra: ${currentTenant.name.split('(')[0]}</span>`;
        roleIndicator.style.background = '#FFFBEB';
        roleIndicator.style.color = '#B45309';
        roleIndicator.style.borderColor = '#FDE68A';
      } else if (this.currentRole === 'admin') {
        roleIndicator.innerHTML = `🛡️ <span>Operator Bekal Go</span>`;
        roleIndicator.style.background = '#EEF2FF';
        roleIndicator.style.color = '#4338CA';
        roleIndicator.style.borderColor = '#C7D2FE';
      }
    }
  }

  updateSimRibbon() {
    const state = window.bekalStore.getState();
    const badge = document.getElementById('sim-cutoff-badge');
    if (!badge) return;

    if (state.systemSettings.isSimulatedPostCutoff) {
      badge.className = 'sim-badge active-closed';
      badge.innerHTML = `<span class="pulse-dot"></span> 21:05 WIB (SETELAH CUT-OFF - PESANAN DITUTUP)`;
    } else {
      badge.className = 'sim-badge active-open';
      badge.innerHTML = `<span class="pulse-dot"></span> 19:45 WIB (SEBELUM CUT-OFF - PRE-ORDER H-1 TERBUKA)`;
    }
  }

  quickToggleCutoff() {
    const state = window.bekalStore.getState();
    const nextState = !state.systemSettings.isSimulatedPostCutoff;
    window.bekalStore.toggleSimulationCutoff(nextState);
    if (window.adminCtrl) window.adminCtrl.render();
    if (window.customerCtrl) {
      window.customerCtrl.setupCountdown();
      window.customerCtrl.render();
    }
    this.updateSimRibbon();
    this.showToast(
      nextState 
        ? 'Cut-Off diaktifkan (Jam 21:05 WIB) - Pemesanan besok ditutup!' 
        : 'Pre-Order dibuka (Jam 19:45 WIB) - Orang tua dapat memesan!', 
      nextState ? 'warning' : 'success'
    );
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : ''}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-weight: 800; font-size: 1.1rem;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Bootstrap once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BekalGoApp();
  window.app.init();
});
