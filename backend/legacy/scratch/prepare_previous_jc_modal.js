const fs = require('fs');

// Read previous modal code
const fullTarget = fs.readFileSync('d:\\Projects\\ISCM\\scratch\\previous_modal_code_full.js', 'utf8');

console.log('Original previous modal code length:', fullTarget.length);

// Ensure new-jc-date has max="${today}" and cell-mono font
let modified = fullTarget.replace(
  '<input type="date" id="new-jc-date" class="form-control form-control-sm" value="${today}" required style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />',
  '<input type="date" id="new-jc-date" class="form-control form-control-sm cell-mono" value="${today}" max="${today}" required style="height: 22px; font-size: 10.5px; padding: 1px 6px; font-weight: 600;" title="Job Card Date (Current Date: ${today})" />'
);

// Ensure district uses isApp and isMan
modified = modified.replace(
  `<!-- Customer District -->
            <div class="form-group" style="margin-bottom: 0; min-width: 0;">
              <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                District
              </label>
              <input type="text" id="new-jc-district" class="form-control form-control-sm" value="Pune" placeholder="e.g. Pune" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" />
            </div>`,
  `<!-- Customer District -->
            \${isApp('CUSTOMER', 'district') ? \`
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  District \${isMan('CUSTOMER', 'district') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="text" id="new-jc-district" class="form-control form-control-sm" value="Pune" placeholder="e.g. Pune" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" \${isMan('CUSTOMER', 'district') ? 'required' : ''} />
              </div>
            \` : ''}`
);

// Add insurance_expiry field if applicable
if (!modified.includes("isApp('VEHICLE', 'insurance_expiry')")) {
  const insPolicyMarker = "<!-- Insurance Policy Number -->";
  const insExpirySnippet = `<!-- Insurance Expiry Date -->
            \${isApp('VEHICLE', 'insurance_expiry') ? \`
              <div class="form-group" style="margin-bottom: 0; min-width: 0;">
                <label class="form-label" style="font-size: 10px; font-weight: 600; margin-bottom: 1px; color: var(--text-secondary); line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Insurance Expiry \${isMan('VEHICLE', 'insurance_expiry') ? '<span style="color: var(--color-danger)">*</span>' : ''}
                </label>
                <input type="date" id="new-jc-ins-expiry" class="form-control form-control-sm" style="height: 22px; font-size: 10.5px; padding: 1px 6px;" \${isMan('VEHICLE', 'insurance_expiry') ? 'required' : ''} />
              </div>
            \` : ''}

            `;
  modified = modified.replace(insPolicyMarker, insExpirySnippet + insPolicyMarker);
}

fs.writeFileSync('d:\\Projects\\ISCM\\scratch\\prepared_previous_modal_code.js', modified);
console.log('Prepared modified previous modal code! Length:', modified.length);
