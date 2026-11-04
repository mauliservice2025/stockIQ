const balanceDue = 1260;
const isFullyPaid = false;
const isPartiallyPaid = false;
const isFinalized = false;
const paymentMode = 'Cash';
const amountReceived = 0;

const html = `
  <div style="display: flex; justify-content: flex-end; gap: 14px;">
    <!--
    ==========================================================================
    PAYMENT DETAILS FOR DRAFT BILL (COMMENTED OUT PER USER REQUEST - PRESERVED FOR FUTURE USE)
    ==========================================================================
    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span>Payment Details</span>
          <span class="badge ${isFullyPaid ? 'badge-success' : (isPartiallyPaid ? 'badge-warning' : 'badge-danger')}" style="font-size: 10px;">
            ${isFullyPaid ? 'Paid in Full' : (isPartiallyPaid ? 'Partially Paid' : 'Pending Payment')}
          </span>
        </div>

        {/* Payment Mode Toggle Buttons */}
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11.5px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Payment Mode:</div>
          <div style="display: flex; gap: 6px;">
            ${['Cash', 'UPI', 'Card', 'Credit'].map(mode => `
              <button 
                type="button" 
                class="btn btn-sm ${paymentMode === mode ? 'btn-primary' : 'btn-secondary'}" 
                style="flex: 1; padding: 6px 4px; font-weight: 600; font-size: 11.5px;"
                onclick="window.BillingModule.setSingleScreenPaymentMode('${mode}')"
                ${isFinalized && balanceDue <= 0 ? 'disabled' : ''}
              >
                ${mode}
              </button>
            `).join('')}
          </div>
        </div>

        {/* Amount Received Input */}
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label" style="font-size: 12px; font-weight: 600;">Amount Received (₹):</label>
          <input 
            type="number" 
            id="ss-amt-rcvd" 
            class="form-control cell-mono" 
            value="${amountReceived}" 
            oninput="window.BillingModule.updateSingleScreenAmountReceived(this.value)" 
            style="font-size: 14px; font-weight: 700;"
            placeholder="0.00"
            ${isFinalized && balanceDue <= 0 ? 'readonly' : ''}
          />
        </div>
      </div>

      {/* Balance Due Highlight Box */}
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Balance Due</div>
          <div id="ss-balance-due-display" style="font-size: 19px; font-weight: 800; color: ${balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)'}; margin-top: 2px;">
            ₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          ${balanceDue === 0 ? `
            <span class="badge badge-success" style="font-size: 11px; padding: 4px 8px;">₹0.00 Settled</span>
          ` : `
            <span class="badge badge-danger" style="font-size: 11px; padding: 4px 8px;">Outstanding</span>
          `}
        </div>
      </div>
    </div>
    -->

    <!-- RIGHT: FINANCIAL TOTALS -->
    <div style="width: 100%; max-width: 480px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">
          📊 Bill Summary & Taxes
        </div>
      </div>
    </div>
  </div>
`;

console.log('Result length:', html.length);
console.log('Has Bill Summary & Taxes:', html.includes('Bill Summary & Taxes'));
console.log('Has Payment Details (inside comment):', html.includes('Payment Details'));
