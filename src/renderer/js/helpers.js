/**
 * Helper utilities
 */
const Helpers = (() => {
  // Format currency (Rupiah)
  function formatRupiah(num) {
    if (num === null || num === undefined) return 'Rp 0';
    return 'Rp ' + Math.round(Number(num)).toLocaleString('id-ID');
  }

  // Format number with thousand separator
  function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Format quantity (show decimal only if needed)
  function formatQty(qty) {
    const n = Number(qty);
    if (n === Math.floor(n)) return n.toString();
    return n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  }

  // Format date-time
  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // Format date only
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Format time only
  function formatTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Toast notification
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  // Update clock in status bar
  function startClock() {
    function update() {
      const el = document.getElementById('status-clock');
      if (el) {
        const now = new Date();
        el.textContent = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
          ' ' + now.toLocaleTimeString('id-ID');
      }
    }
    update();
    setInterval(update, 1000);
  }

  // Set status bar info
  function setStatusUser(user) {
    const el = document.getElementById('status-user');
    if (el) {
      if (user) {
        el.textContent = `${user.name} [${user.role.toUpperCase()}]`;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }

  function setStatusShift(shift) {
    const el = document.getElementById('status-shift');
    if (el) {
      if (shift) {
        el.textContent = `Shift ${shift.shift_number}`;
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }

  // Safely set innerHTML
  function render(elementId, html) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = html;
    return el;
  }

  return {
    formatRupiah,
    formatNumber,
    formatQty,
    formatDateTime,
    formatDate,
    formatTime,
    toast,
    startClock,
    setStatusUser,
    setStatusShift,
    render,
  };
})();
