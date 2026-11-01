/* ==========================================================================
   STOCKIQ ENTERPRISE - REUSABLE UNIVERSAL PAGINATION HELPER
   Standardizes pagination UI, state management, and table data slicing
   across all operational modules and masters.
   ========================================================================== */

(function(global) {
  'use strict';

  const DEFAULT_PAGE_SIZE = 10;
  const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

  const _state = {};

  const PaginationHelper = {
    DEFAULT_PAGE_SIZE: DEFAULT_PAGE_SIZE,
    PAGE_SIZES: ALLOWED_PAGE_SIZES,

    /**
     * Get or initialize pagination state for a given key
     * @param {string} key Unique identifier for table/screen (e.g. 'jobCards', 'plants')
     * @param {number} defaultSize Optional default size (defaults to 10)
     * @returns {{ currentPage: number, pageSize: number }}
     */
    getState(key, defaultSize = DEFAULT_PAGE_SIZE) {
      if (!_state[key]) {
        _state[key] = {
          currentPage: 1,
          pageSize: defaultSize
        };
      }
      return _state[key];
    },

    /**
     * Reset pagination state for a key back to page 1
     * @param {string} key
     */
    reset(key) {
      if (_state[key]) {
        _state[key].currentPage = 1;
      }
    },

    /**
     * Set active page number for a key
     * @param {string} key
     * @param {number} page
     * @param {Function|string} [refreshCallback] Optional callback to trigger re-render
     */
    setPage(key, page, refreshCallback) {
      const state = this.getState(key);
      const targetPage = Math.max(1, parseInt(page, 10) || 1);
      state.currentPage = targetPage;
      if (typeof refreshCallback === 'function') {
        refreshCallback(targetPage);
      } else if (typeof refreshCallback === 'string' && typeof global[refreshCallback] === 'function') {
        global[refreshCallback](targetPage);
      }
    },

    /**
     * Set page size for a key and reset to page 1
     * @param {string} key
     * @param {number} size
     * @param {Function|string} [refreshCallback]
     */
    setPageSize(key, size, refreshCallback) {
      const state = this.getState(key);
      const newSize = parseInt(size, 10) || DEFAULT_PAGE_SIZE;
      state.pageSize = newSize;
      state.currentPage = 1;
      if (typeof refreshCallback === 'function') {
        refreshCallback(1, newSize);
      } else if (typeof refreshCallback === 'string' && typeof global[refreshCallback] === 'function') {
        global[refreshCallback](1, newSize);
      }
    },

    /**
     * Slice an array of records according to current pagination state
     * @param {Array} records Full list of filtered items
     * @param {string|Object} keyOrState Key name or state object with currentPage & pageSize
     * @returns {{ items: Array, totalRecords: number, totalPages: number, currentPage: number, pageSize: number, startIndex: number, endIndex: number }}
     */
    paginate(records, keyOrState) {
      const list = Array.isArray(records) ? records : [];
      const totalRecords = list.length;

      let currentPage = 1;
      let pageSize = DEFAULT_PAGE_SIZE;

      if (typeof keyOrState === 'string') {
        const state = this.getState(keyOrState);
        currentPage = state.currentPage;
        pageSize = state.pageSize;
      } else if (keyOrState && typeof keyOrState === 'object') {
        currentPage = keyOrState.currentPage || 1;
        pageSize = keyOrState.pageSize || DEFAULT_PAGE_SIZE;
      }

      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
      if (currentPage > totalPages) {
        currentPage = totalPages;
        if (typeof keyOrState === 'string' && _state[keyOrState]) {
          _state[keyOrState].currentPage = currentPage;
        } else if (keyOrState && typeof keyOrState === 'object') {
          keyOrState.currentPage = currentPage;
        }
      }
      if (currentPage < 1) currentPage = 1;

      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalRecords);
      const items = list.slice(startIndex, endIndex);

      return {
        items,
        totalRecords,
        totalPages,
        currentPage,
        pageSize,
        startIndex,
        endIndex
      };
    },

    /**
     * Render the standardized .user-pagination-bar HTML
     * @param {Object} options
     * @param {number} options.totalRecords
     * @param {number} options.currentPage
     * @param {number} options.pageSize
     * @param {string} [options.key] Key identifier if using global state
     * @param {string} [options.onPageChange] JS expression string (use %p% for page number)
     * @param {string} [options.onPageSizeChange] JS expression string (use %s% for page size)
     * @returns {string} HTML markup
     */
    render(options = {}) {
      const totalRecords = options.totalRecords || 0;
      const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
      let currentPage = options.currentPage || 1;
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalRecords);
      const startDisplay = totalRecords === 0 ? 0 : startIndex + 1;

      const key = options.key || '';
      const onPageChange = options.onPageChange || (key ? `window.PaginationHelper.setPage('${key}', %p%)` : '');
      const onPageSizeChange = options.onPageSizeChange || (key ? `window.PaginationHelper.setPageSize('${key}', this.value)` : '');

      const getPageCall = (p) => {
        if (!onPageChange) return '';
        return onPageChange.replace(/%p%/g, p);
      };

      const getSizeCall = () => {
        if (!onPageSizeChange) return '';
        return onPageSizeChange.replace(/%s%/g, 'this.value');
      };

      return `
        <div class="user-pagination-bar" style="margin-top: 14px; padding: 8px 4px 4px 4px; border-top: 1px solid var(--border-color, #334155); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 13px; font-weight: 400;">
          <div style="font-size: 13px; color: var(--text-secondary); font-weight: 400;">
            Showing <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${startDisplay}</strong> to <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${endIndex}</strong> of <strong style="color: var(--text-primary); font-weight: 600; font-size: 13px;">${totalRecords}</strong> entries
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 13px; font-weight: 400;">Show</span>
              <select class="form-control form-control-sm" onchange="${getSizeCall()}" style="height: 28px; font-size: 13px; padding: 1px 6px; width: 70px; border-radius: 4px; font-weight: 500;">
                ${ALLOWED_PAGE_SIZES.map(sz => `
                  <option value="${sz}" ${pageSize === sz ? 'selected' : ''}>${sz}</option>
                `).join('')}
              </select>
              <span style="font-size: 13px; font-weight: 400;">entries</span>
            </div>

            <div class="pagination-buttons" style="display: flex; gap: 4px; align-items: center;">
              <button 
                class="btn btn-secondary btn-xs" 
                ${currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} 
                onclick="${getPageCall(1)}" 
                title="First Page"
              >⏮</button>
              
              <button 
                class="btn btn-secondary btn-xs" 
                ${currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} 
                onclick="${getPageCall(currentPage - 1)}" 
                title="Previous Page"
              >◀ Prev</button>
              
              ${this.renderPaginationPills(currentPage, totalPages, getPageCall)}
              
              <button 
                class="btn btn-secondary btn-xs" 
                ${currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 9px; font-size: 12.5px; font-weight: 500;"'} 
                onclick="${getPageCall(currentPage + 1)}" 
                title="Next Page"
              >Next ▶</button>
              
              <button 
                class="btn btn-secondary btn-xs" 
                ${currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"' : 'style="height: 28px; padding: 0 8px; font-size: 12.5px; font-weight: 500;"'} 
                onclick="${getPageCall(totalPages)}" 
                title="Last Page"
              >⏭</button>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Render page number pills with ellipses
     * @param {number} current
     * @param {number} total
     * @param {Function} getPageCall
     * @returns {string}
     */
    renderPaginationPills(current, total, getPageCall) {
      if (total <= 1) {
        return `
          <button class="btn btn-primary btn-xs" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 600;">1</button>
        `;
      }

      const pills = [];
      let startPage = Math.max(1, current - 2);
      let endPage = Math.min(total, current + 2);

      if (current <= 3) {
        startPage = 1;
        endPage = Math.min(5, total);
      } else if (current >= total - 2) {
        startPage = Math.max(1, total - 4);
        endPage = total;
      }

      if (startPage > 1) {
        pills.push(`
          <button class="btn btn-secondary btn-xs" onclick="${getPageCall(1)}" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">1</button>
        `);
        if (startPage > 2) {
          pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
        }
      }

      for (let p = startPage; p <= endPage; p++) {
        const isActive = p === current;
        pills.push(`
          <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-xs" 
                  onclick="${getPageCall(p)}" 
                  style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: ${isActive ? '600' : '500'};">
            ${p}
          </button>
        `);
      }

      if (endPage < total) {
        if (endPage < total - 1) {
          pills.push(`<span style="padding: 0 3px; color: var(--text-muted); line-height: 28px; font-size: 12px;">...</span>`);
        }
        pills.push(`
          <button class="btn btn-secondary btn-xs" onclick="${getPageCall(total)}" style="height: 28px; min-width: 28px; padding: 0 6px; font-size: 12.5px; font-weight: 500;">${total}</button>
        `);
      }

      return pills.join('');
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationHelper;
  }
  if (typeof global !== 'undefined') {
    global.PaginationHelper = PaginationHelper;
  }
})(typeof window !== 'undefined' ? window : globalThis);
