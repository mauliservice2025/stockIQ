      <form id="create-jc-form" class="jc-compact-form" onsubmit="event.preventDefault(); window.BillingModule.saveNewJobCard();">
        <!-- Section 1: Vehicle Details (Dynamically Configured per Facility Policy) -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 4px 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--primary-300);">
              🏍️ 1. Vehicle Details
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px 6px;">
            <!-- Vehicle Registration No -->
            ${isApp('VEHICLE', 'vehicle_reg_no') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Vehicle Reg No ${isMan('VEHICLE', 'vehicle_reg_no') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-reg" class="form-control cell-mono form-control-sm" placeholder="e.g. MH 12 AB 1234" maxlength="16" style="height: 22px; font-size: 10.5px; padding: 1px 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.8px;" oninput="window.BillingModule.formatVehicleRegInput(this)" onblur="window.BillingModule.formatVehicleRegBlur(this)" onpaste="setTimeout(() => { window.BillingModule.formatVehicleRegBlur(this); }, 50)" ${isMan('VEHICLE', 'vehicle_reg_no') ? 'required' : ''} />
                <div id="new-jc-reg-feedback" style="font-size: 9px; line-height: 1; margin-top: 1px; display: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
              </div>
            ` : ''}

            <!-- Vehicle Model -->
            ${isApp('VEHICLE', 'vehicle_model') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0; grid-column: span 2;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Vehicle Model ${isMan('VEHICLE', 'vehicle_model') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <select id="new-jc-model" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'vehicle_model') ? 'required' : ''}>
                  <option value="">-- Select from Vehicle Compatibility Master --</option>
                  ${vehicleModels.map(m => {
                    const mfg = manufacturers.find(mf => mf.id === m.manufacturer_id);
                    const mfgName = mfg ? mfg.name.split(' ')[0] : '';
                    const cleanName = `${mfgName ? mfgName + ' ' : ''}${m.name}`.trim();
                    const label = `${mfgName ? mfgName + ' ' : ''}${m.name} ${m.variant ? '(' + m.variant + ')' : ''}`.trim();
                    return `<option value="${m.id}" data-name="${cleanName}" data-model="${m.name}" data-variant="${m.variant || ''}">${label}</option>`;
                  }).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Odometer KM -->
            ${isApp('VEHICLE', 'odometer_km') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Odometer KM ${isMan('VEHICLE', 'odometer_km') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="number" id="new-jc-km" class="form-control cell-mono form-control-sm" placeholder="e.g. 15400" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'odometer_km') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Fuel Level -->
            ${isApp('VEHICLE', 'fuel_level') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Fuel Level ${isMan('VEHICLE', 'fuel_level') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <select id="new-jc-fuel" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'fuel_level') ? 'required' : ''}>
                  <option value="25%">25% (Quarter)</option>
                  <option value="50%" selected>50% (Half Tank)</option>
                  <option value="75%">75% (Three-Quarter)</option>
                  <option value="100%">100% (Full Tank)</option>
                  <option value="Empty">Near Empty</option>
                </select>
              </div>
            ` : ''}

            <!-- Manufacturing Year -->
            ${isApp('VEHICLE', 'mfg_year') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Mfg Year ${isMan('VEHICLE', 'mfg_year') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="number" id="new-jc-mfg-year" class="form-control cell-mono form-control-sm" placeholder="2023" min="1990" max="2030" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'mfg_year') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Chassis / VIN -->
            ${isApp('VEHICLE', 'chassis_no') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Chassis / VIN ${isMan('VEHICLE', 'chassis_no') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-chassis" class="form-control cell-mono form-control-sm" placeholder="17-digit Chassis No" maxlength="17" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'chassis_no') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Engine Number -->
            ${isApp('VEHICLE', 'engine_no') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Engine Number ${isMan('VEHICLE', 'engine_no') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-engine" class="form-control cell-mono form-control-sm" placeholder="Engine serial" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'engine_no') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Vehicle Color -->
            ${isApp('VEHICLE', 'color') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Vehicle Color ${isMan('VEHICLE', 'color') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-color" class="form-control form-control-sm" placeholder="e.g. Matte Black" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'color') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Insurance Provider -->
            ${isApp('VEHICLE', 'insurance_company') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Insurance Co ${isMan('VEHICLE', 'insurance_company') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-ins-co" class="form-control form-control-sm" placeholder="e.g. ICICI Lombard" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'insurance_company') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Insurance Policy Number -->
            ${isApp('VEHICLE', 'insurance_policy_no') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Policy No ${isMan('VEHICLE', 'insurance_policy_no') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-ins-policy" class="form-control cell-mono form-control-sm" placeholder="Policy number" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('VEHICLE', 'insurance_policy_no') ? 'required' : ''} />
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Active Job Card Unfinalized Lock Alert Container -->
        <div id="new-jc-active-lock-container" style="display: none; margin-top: 4px; margin-bottom: 4px;"></div>

        <!-- Vehicle Previous Service History Panel -->
        <div id="new-jc-history-container" style="display: none; margin-top: 4px; margin-bottom: 4px;"></div>

        <!-- Section 2: Customer Information (Dynamically Configured per Facility Policy) -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 4px 8px;">
          <div style="margin-bottom: 2px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--primary-300);">
              👤 2. Customer Information
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 3px 6px;">
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Job Card No</label>
              <input type="text" id="new-jc-no" class="form-control cell-mono form-control-sm" value="${nextJcNo}" readonly style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Date</label>
              <input type="date" id="new-jc-date" class="form-control form-control-sm" value="${today}" required style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />
            </div>

            <!-- Customer CIN -->
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                Customer CIN <span id="new-jc-cin-badge" style="display: none;"></span>
              </label>
              <div style="position: relative;">
                <input type="text" id="new-jc-cin" class="form-control cell-mono form-control-sm" placeholder="Auto-generated" readonly style="height: 22px; font-size: 9.5px; padding: 1px 18px 1px 5px; font-weight: 700; color: var(--primary-300); background: rgba(99, 102, 241, 0.05);" title="Customer Identification Number. Follows customer throughout journey." />
                <button type="button" id="new-jc-cin-btn" onclick="window.BillingModule.quickFetchCinForModal()" style="position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 11px; cursor: pointer; padding: 1px 3px; color: var(--primary-300);" title="Preview next Customer Identification Number">⚡</button>
              </div>
            </div>

            <!-- Customer Name -->
            ${isApp('CUSTOMER', 'customer_name') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Customer Name ${isMan('CUSTOMER', 'customer_name') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-customer" class="form-control form-control-sm" placeholder="e.g. Anand Kulkarni" style="height: 22px; font-size: 10.5px; padding: 1px 6px; text-transform: capitalize;" oninput="window.BillingModule.formatCustomerNameInput(this)" onblur="window.BillingModule.formatCustomerNameBlur(this)" onpaste="window.BillingModule.formatCustomerNamePaste(event, this)" ${isMan('CUSTOMER', 'customer_name') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Customer Mobile -->
            ${isApp('CUSTOMER', 'mobile_number') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Customer Mobile ${isMan('CUSTOMER', 'mobile_number') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-mobile" class="form-control cell-mono form-control-sm" placeholder="10-digit mobile" maxlength="10" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" onfocus="if (!this.dataset.originalMobile && this.value.replace(/\D/g, '').length === 10) this.dataset.originalMobile = this.value.replace(/\D/g, '');" oninput="window.BillingModule.onCustomerMobileInput(this)" ${isMan('CUSTOMER', 'mobile_number') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Alternate Mobile -->
            ${isApp('CUSTOMER', 'alt_mobile_number') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Alternate Mobile ${isMan('CUSTOMER', 'alt_mobile_number') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-alt-mobile" class="form-control cell-mono form-control-sm" placeholder="Alternate contact" maxlength="10" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'alt_mobile_number') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Customer Type -->
            ${isApp('CUSTOMER', 'customer_type') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Customer Type ${isMan('CUSTOMER', 'customer_type') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <select id="new-jc-customer-type" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'customer_type') ? 'required' : ''}>
                  <option value="Retail Individual">Retail Individual</option>
                  <option value="Corporate Fleet">Corporate Fleet</option>
                  <option value="Walk-in Customer" selected>Walk-in Customer</option>
                </select>
              </div>
            ` : ''}

            <!-- Customer Address -->
            ${isApp('CUSTOMER', 'address') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Street Address ${isMan('CUSTOMER', 'address') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-address" class="form-control form-control-sm" placeholder="Street / Area" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'address') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Customer City -->
            ${isApp('CUSTOMER', 'city') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  City ${isMan('CUSTOMER', 'city') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-city" class="form-control form-control-sm" value="Haveli" placeholder="Pune / Wakad" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'city') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Customer District -->
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                District
              </label>
              <input type="text" id="new-jc-district" class="form-control form-control-sm" value="Pune" placeholder="e.g. Pune" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />
            </div>

            <!-- Customer State -->
            ${isApp('CUSTOMER', 'state') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  State ${isMan('CUSTOMER', 'state') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-state" class="form-control form-control-sm" value="Maharashtra" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'state') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- Customer Pincode -->
            ${isApp('CUSTOMER', 'pincode') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  PIN Code ${isMan('CUSTOMER', 'pincode') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <div style="position: relative;">
                  <input type="text" id="new-jc-pincode" class="form-control cell-mono form-control-sm" value="412101" placeholder="411001" maxlength="6" style="height: 22px; font-size: 10.5px; padding: 1px 6px; font-weight: 600; letter-spacing: 0.5px;" oninput="window.BillingModule.onPincodeInput(this)" onblur="window.BillingModule.onPincodeBlur(this)" onpaste="window.BillingModule.onPincodePaste(event, this)" ${isMan('CUSTOMER', 'pincode') ? 'required' : ''} />
                  <span id="new-jc-pin-spinner" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; display: none;">⏳</span>
                </div>
                <div id="new-jc-pin-feedback" style="font-size: 9px; line-height: 1; margin-top: 1px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-success, #10b981);">✓ Auto-fetched: <b>Haveli, Pune, Maharashtra</b></div>
              </div>
            ` : ''}

            <!-- Email ID -->
            ${isApp('CUSTOMER', 'email') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0; grid-column: span 3;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Email ID ${isMan('CUSTOMER', 'email') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="email" id="new-jc-email" class="form-control form-control-sm" placeholder="customer@example.com" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'email') ? 'required' : ''} />
              </div>
            ` : ''}

            <!-- GSTIN -->
            ${isApp('CUSTOMER', 'gstin') ? `
              <div class="form-group" style="margin-bottom: 0; min-width: 0; grid-column: span 3;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  GSTIN / Tax ID ${isMan('CUSTOMER', 'gstin') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-gstin" class="cell-mono form-control form-control-sm" placeholder="27XXXXX0000X1ZX" maxlength="15" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" ${isMan('CUSTOMER', 'gstin') ? 'required' : ''} />
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Section 3: Service Scope & Assignment -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 4px 8px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--primary-300); margin-bottom: 2px;">
            🛠️ 3. Service Scope & Assignment
          </div>
          <div style="display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap: 3px 6px; margin-bottom: 3px;">
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px;">Service Type <span style="color: var(--color-danger)">*</span></label>
              <select id="new-jc-service-type" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" required>
                <option value="Periodic Maintenance Service">Periodic Maintenance Service</option>
                <option value="General Service" selected>General Service</option>
                <option value="Paid Service">Paid Service</option>
                <option value="Brake & Suspension Overhaul">Brake & Suspension Overhaul</option>
                <option value="Engine & Transmission Repair">Engine & Transmission Repair</option>
                <option value="Electrical & Battery Service">Electrical & Battery Service</option>
                <option value="Tyre Replacement & Balancing">Tyre Replacement & Balancing</option>
                <option value="Accident Repair">Accident Repair</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px;">Technician Assigned <span style="color: var(--color-danger)">*</span></label>
              <select id="new-jc-tech" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" required>
                <option value="">-- Select Technician from User Master --</option>
                ${techOptions.map(t => {
                  const techName = t.full_name || t.display_name || t.employee_name || t.username;
                  const label = `${techName}${t.designation ? ' (' + t.designation + ')' : ''}`;
                  const isSelected = techName === 'Sanket Borole' || label.includes('Sanket Borole');
                  return `<option value="${techName}" data-id="${t.id}" data-name="${techName}" ${isSelected ? 'selected' : ''}>${label}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px;">Expected Delivery</label>
              <input type="datetime-local" id="new-jc-delivery" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px 6px;">
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px;">Customer Complaints & Instructions <span style="color: var(--color-danger)">*</span></label>
              <textarea id="new-jc-complaints" class="form-control" rows="1" style="font-size: 10.5px; height: 24px; min-height: 24px; max-height: 32px; padding: 2px 6px; resize: none; line-height: 1.2;" placeholder="e.g. Oil change, brake squeal, chain lube" required>Servicing</textarea>
            </div>
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px;">Initial Diagnosis & Technician Remarks</label>
              <textarea id="new-jc-diagnosis" class="form-control" rows="1" style="font-size: 10.5px; height: 24px; min-height: 24px; max-height: 32px; padding: 2px 6px; resize: none; line-height: 1.2;" placeholder="e.g. Brake shoe worn out, oil degraded."></textarea>
            </div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; width: 100%;">
        <button type="button" class="btn btn-secondary" style="height: 30px; font-size: 11.5px; padding: 0 16px;" onclick="window.State.closeModal()">Cancel</button>
        <button type="button" class="btn btn-outline-primary" id="btn-update-customer-info" style="height: 30px; font-size: 11.5px; font-weight: 600; padding: 0 16px; border-color: #3b82f6; color: #3b82f6; background: rgba(59, 130, 246, 0.08);" onclick="window.BillingModule.updateCustomerInformationOnly()">Update Customer Information</button>
        <button type="submit" form="create-jc-form" id="btn-create-jc-submit" class="btn btn-primary" style="height: 30px; font-size: 11.5px; font-weight: 600; padding: 0 20px;" onclick="const f = document.getElementById('create-jc-form'); if (f && f.requestSubmit) { event.preventDefault(); f.requestSubmit(); }">Create Job Card</button>
      </div>
    `;

    window.State.showModal({
      title: modalTitle,
      contentHtml,
      footerHtml,
      maxWidth: 'min(1240px, 98vw)',
      bodyPadding: '6px 14px 2px 14px',
      footerPadding: '6px 14px',
      compactHeader: true,
      noScroll: false
    });