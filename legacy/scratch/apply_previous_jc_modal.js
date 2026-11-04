const fs = require('fs');
const path = require('path');

const billingPath = path.join(__dirname, '../js/modules/billing.js');
let billingCode = fs.readFileSync(billingPath, 'utf8');

// Load prepared previous modal code
const preparedModalCode = fs.readFileSync(path.join(__dirname, 'prepared_previous_modal_code.js'), 'utf8');

// The block to replace in showNewJobCardModal:
// From `    const contentHtml = `
// To `    });` at the end of showNewJobCardModal
const startMarker = '    const contentHtml = `\n      <form id="create-jc-form"';
const endMarker = '    window.State.showModal({\n      title: modalTitle,\n      contentHtml,\n      footerHtml,\n      maxWidth: \'640px\',\n      bodyPadding: \'6px 14px 2px 14px\',\n      footerPadding: \'6px 14px\',\n      compactHeader: true,\n      noScroll: false\n    });';

const startIndex = billingCode.indexOf(startMarker);
const endIndex = billingCode.indexOf(endMarker);

if (startIndex === -1) {
  console.error('startMarker not found!');
  process.exit(1);
}
if (endIndex === -1) {
  console.error('endMarker not found!');
  process.exit(1);
}

const replacement = '    const contentHtml = `\n' + preparedModalCode;

billingCode = billingCode.slice(0, startIndex) + replacement + billingCode.slice(endIndex + endMarker.length);

// Now update checkMandatory and validations in saveNewJobCard
const oldValidationMarker = `    // Policy Validation Check against Facility Registration Configuration
    const checkMandatory = (group, key, val) => {
      const list = group === 'CUSTOMER' ? regConfig.customer_fields : regConfig.vehicle_fields;
      const f = (list || []).find(item => item.field_key === key);
      if (f && f.applicable && f.mandatory && !val) {
        return f.label;
      }
      return null;
    };

    const bRules = regConfig.business_rules || {};

    const errCustomer = checkMandatory('CUSTOMER', 'customer_name', customer);
    if (errCustomer) { alert(\`\${errCustomer} is mandatory as per Registration Configuration.\`); return; }

    const errMobile = checkMandatory('CUSTOMER', 'mobile_number', mobile);
    if (errMobile) { alert(\`\${errMobile} is mandatory as per Registration Configuration.\`); return; }

    // Validation for Vehicle Registration
    if (!isUnregistered) {
      const errReg = checkMandatory('VEHICLE', 'vehicle_reg_no', normalizedReg);
      if (errReg) { alert(\`\${errReg} is mandatory as per Registration Configuration.\`); return; }
    } else {
      if (bRules.allow_unregistered_vehicles === false) {
        alert('Unregistered vehicles are not permitted under the current facility registration configuration policy.');
        return;
      }
    }

    // Format validation if registered
    if (!isUnregistered && normalizedReg) {
      const valRes = this.validateIndianVehicleNumber(displayReg);
      if (!valRes.valid) {
        if (!confirm(\`Warning: Vehicle registration "\${displayReg}" does not match standard Indian plate format (e.g. MH 12 AB 1234).\\nDo you want to proceed anyway?\`)) {
          const regEl = document.getElementById('new-jc-reg');
          if (regEl) regEl.focus();
          return;
        }
      }
    }

    // Note: Returning vehicles are gracefully linked via window.DB.getOrCreateVehicle below


    const errModel = checkMandatory('VEHICLE', 'vehicle_model', modelId || modelDisplayName);
    if (errModel) { alert(\`\${errModel} is mandatory as per Registration Configuration.\`); return; }`;

const newValidation = `    // Policy Validation Check against Facility Registration Configuration
    const checkMandatory = (group, key, val) => {
      const list = group === 'CUSTOMER' ? regConfig.customer_fields : regConfig.vehicle_fields;
      const f = (list || []).find(item => item.field_key === key);
      if (f && f.applicable && f.mandatory) {
        if (val === undefined || val === null || String(val).trim() === '') {
          return f.label || key;
        }
      }
      return null;
    };

    const bRules = regConfig.business_rules || {};

    // Customer Fields Validation strictly adhering to Facility Registration Configuration
    const customerFieldMap = {
      customer_name: customer,
      mobile_number: mobile,
      alt_mobile_number: altMobile,
      email: email,
      address: address,
      city: city,
      district: getVal('new-jc-district'),
      state: state,
      pincode: pincode,
      customer_type: customerType,
      gstin: gstin
    };
    for (const [key, val] of Object.entries(customerFieldMap)) {
      const err = checkMandatory('CUSTOMER', key, val);
      if (err) { alert(\`\${err} is mandatory as per Registration Configuration.\`); return; }
    }

    // Validation for Vehicle Registration
    if (!isUnregistered) {
      const errReg = checkMandatory('VEHICLE', 'vehicle_reg_no', normalizedReg);
      if (errReg) { alert(\`\${errReg} is mandatory as per Registration Configuration.\`); return; }
    } else {
      if (bRules.allow_unregistered_vehicles === false) {
        alert('Unregistered vehicles are not permitted under the current facility registration configuration policy.');
        return;
      }
    }

    // Format validation if registered
    if (!isUnregistered && normalizedReg) {
      const valRes = this.validateIndianVehicleNumber(displayReg);
      if (!valRes.valid) {
        if (!confirm(\`Warning: Vehicle registration "\${displayReg}" does not match standard Indian plate format (e.g. MH 12 AB 1234).\\nDo you want to proceed anyway?\`)) {
          const regEl = document.getElementById('new-jc-reg');
          if (regEl) regEl.focus();
          return;
        }
      }
    }

    // Vehicle Fields Validation strictly adhering to Facility Registration Configuration
    const rawKmVal = getVal('new-jc-km');
    const vehicleFieldMap = {
      vehicle_model: modelId || modelDisplayName,
      odometer_km: (rawKmVal !== undefined && rawKmVal !== null && String(rawKmVal).trim() !== '') ? rawKmVal : '',
      fuel_level: fuel,
      mfg_year: mfgYear,
      chassis_no: chassis,
      engine_no: engine,
      color: color,
      insurance_company: insCo,
      insurance_policy_no: insPolicy,
      insurance_expiry: getVal('new-jc-ins-expiry')
    };
    for (const [key, val] of Object.entries(vehicleFieldMap)) {
      const err = checkMandatory('VEHICLE', key, val);
      if (err) { alert(\`\${err} is mandatory as per Registration Configuration.\`); return; }
    }`;

if (!billingCode.includes(oldValidationMarker)) {
  console.error('oldValidationMarker not found in billing.js!');
  process.exit(1);
}

billingCode = billingCode.replace(oldValidationMarker, newValidation);

// Check syntax with Function constructor or node
try {
  new Function(billingCode);
  console.log('Syntax check passed!');
} catch (err) {
  console.error('Syntax error:', err);
  process.exit(1);
}

fs.writeFileSync(billingPath, billingCode, 'utf8');
console.log('Successfully updated billing.js with Previous UI and Registration Configuration!');
