const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '../js/data/mock-data.js');
let content = fs.readFileSync(mockDataPath, 'utf8');

// 1. Add PERM-HOLIDAY-MASTER if not present
if (!content.includes('"id": "PERM-HOLIDAY-MASTER"')) {
  const permMarker = '    {\n      "id": "PERM-FIN-CALENDAR",\n      "module": "Organization & Facility Setup",\n      "name": "Financial Calendar Master",\n      "code": "FINANCIAL_CALENDAR_MASTER"\n    }';
  const newPerm = '    {\n      "id": "PERM-FIN-CALENDAR",\n      "module": "Organization & Facility Setup",\n      "name": "Financial Calendar Master",\n      "code": "FINANCIAL_CALENDAR_MASTER"\n    },\n    {\n      "id": "PERM-HOLIDAY-MASTER",\n      "module": "Organization & Facility Setup",\n      "name": "Holiday Master",\n      "code": "HOLIDAY_MASTER"\n    }';
  
  if (content.includes(permMarker)) {
    content = content.replace(permMarker, newPerm);
    console.log('✓ Added PERM-HOLIDAY-MASTER to permissions list');
  } else {
    console.warn('Could not find permMarker');
  }
}

// 2. Add HOLIDAY_MASTER to role_permissions for ROLE-ADMIN
if (!content.includes('"perm_code": "HOLIDAY_MASTER"')) {
  const roleMarker = '    {\n      "role_id": "ROLE-ADMIN",\n      "perm_code": "FINANCIAL_CALENDAR_MASTER",\n      "view": true,\n      "add": true,\n      "edit": true,\n      "delete": true,\n      "submit": true,\n      "approve": true,\n      "reject": true,\n      "cancel": true,\n      "print": true,\n      "export": true\n    }';
  const newRole = '    {\n      "role_id": "ROLE-ADMIN",\n      "perm_code": "FINANCIAL_CALENDAR_MASTER",\n      "view": true,\n      "add": true,\n      "edit": true,\n      "delete": true,\n      "submit": true,\n      "approve": true,\n      "reject": true,\n      "cancel": true,\n      "print": true,\n      "export": true\n    },\n    {\n      "role_id": "ROLE-ADMIN",\n      "perm_code": "HOLIDAY_MASTER",\n      "view": true,\n      "add": true,\n      "edit": true,\n      "delete": true,\n      "submit": true,\n      "approve": true,\n      "reject": true,\n      "cancel": true,\n      "print": true,\n      "export": true\n    }';

  if (content.includes(roleMarker)) {
    content = content.replace(roleMarker, newRole);
    console.log('✓ Added HOLIDAY_MASTER to ROLE-ADMIN permissions');
  } else {
    console.warn('Could not find roleMarker');
  }
}

// 3. Add holiday_types, holidays, and holiday_audit
const holidayTypes = [
  { id: 'NAT', code: 'NAT', name: 'National Holiday', color: '#3b82f6', description: 'Nationwide gazetted statutory holiday' },
  { id: 'ST', code: 'ST', name: 'State Holiday', color: '#10b981', description: 'State government declared holiday (Maharashtra)' },
  { id: 'FEST', code: 'FEST', name: 'Festival Holiday', color: '#f59e0b', description: 'Religious and cultural festival celebration' },
  { id: 'LOC', code: 'LOC', name: 'Local Holiday', color: '#8b5cf6', description: 'City/district or regional specific holiday' },
  { id: 'COMP', code: 'COMP', name: 'Company Holiday', color: '#06b6d4', description: 'Corporate, foundation, or annual company holiday' },
  { id: 'SPEC', code: 'SPEC', name: 'Special Holiday', color: '#ec4899', description: 'Emergency or special one-time declared holiday' },
  { id: 'OTH', code: 'OTH', name: 'Other', color: '#64748b', description: 'Other unclassified non-working day' }
];

const holidays = [
  {
    id: "HOL-001",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-MAH-DAY",
    holiday_name: "Maharashtra Day",
    holiday_date: "2026-05-01",
    day_name: "Friday",
    holiday_type_id: "ST",
    holiday_type_name: "State Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Maharashtra State Formation Day - statutory state holiday",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-002",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-FOU-DAY",
    holiday_name: "Company Foundation Day",
    holiday_date: "2026-06-15",
    day_name: "Monday",
    holiday_type_id: "COMP",
    holiday_type_name: "Company Holiday",
    holiday_category: "HALF_DAY",
    half_day_type: "SECOND_HALF",
    from_time: "14:00",
    to_time: "18:30",
    recurring_yn: true,
    description: "Annual Corporate Foundation celebration and awards function",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-003",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "FACILITY",
    facility_id: "PLANT-01",
    facility_name: "Mauli Service Center 1",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-PLK-PUN",
    holiday_name: "Palkhi Festival Holiday",
    holiday_date: "2026-07-06",
    day_name: "Monday",
    holiday_type_id: "LOC",
    holiday_type_name: "Local Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: false,
    description: "Local Sant Tukaram Maharaj Palkhi procession route closure in Pune area",
    active_yn: true,
    status: "Active",
    created_by: "Facility Admin",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "Facility Admin",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-004",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "FACILITY",
    facility_id: "PLANT-02",
    facility_name: "Mauli Service Center 2",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-LOC-NAS",
    holiday_name: "Local Market Holiday",
    holiday_date: "2026-08-12",
    day_name: "Wednesday",
    holiday_type_id: "LOC",
    holiday_type_name: "Local Holiday",
    holiday_category: "HALF_DAY",
    half_day_type: "FIRST_HALF",
    from_time: "09:00",
    to_time: "13:30",
    recurring_yn: false,
    description: "Local commercial market half-day holiday applicable to Mauli Service Center 2",
    active_yn: true,
    status: "Active",
    created_by: "Facility Admin",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "Facility Admin",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-005",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-IND-DAY",
    holiday_name: "Independence Day",
    holiday_date: "2026-08-15",
    day_name: "Saturday",
    holiday_type_id: "NAT",
    holiday_type_name: "National Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "National Independence Day - mandatory statutory holiday",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-006",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-GAN-CHT",
    holiday_name: "Ganesh Chaturthi",
    holiday_date: "2026-09-14",
    day_name: "Monday",
    holiday_type_id: "FEST",
    holiday_type_name: "Festival Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Ganesh Utsav - auspicious festival celebration",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-007",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-MG-JAY",
    holiday_name: "Mahatma Gandhi Jayanti",
    holiday_date: "2026-10-02",
    day_name: "Friday",
    holiday_type_id: "NAT",
    holiday_type_name: "National Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Mahatma Gandhi Jayanti - National Holiday",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-10-02T09:00:00Z"
  },
  {
    id: "HOL-008",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-DUS-SEH",
    holiday_name: "Dussehra (Vijayadashami)",
    holiday_date: "2026-10-20",
    day_name: "Tuesday",
    holiday_type_id: "FEST",
    holiday_type_name: "Festival Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Vijayadashami / Ayudha Pooja in workshops",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-009",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-DIW-LAX",
    holiday_name: "Diwali (Laxmi Pujan)",
    holiday_date: "2026-11-09",
    day_name: "Monday",
    holiday_type_id: "FEST",
    holiday_type_name: "Festival Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Deepavali Festival celebration",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-010",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-DIW-BAL",
    holiday_name: "Diwali Balipratipada",
    holiday_date: "2026-11-10",
    day_name: "Tuesday",
    holiday_type_id: "FEST",
    holiday_type_name: "Festival Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Diwali Padwa / Balipratipada celebration",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-011",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-CHR-IST",
    holiday_name: "Christmas",
    holiday_date: "2026-12-25",
    day_name: "Friday",
    holiday_type_id: "FEST",
    holiday_type_name: "Festival Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Christmas celebration",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-012",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-REP-DAY",
    holiday_name: "Republic Day",
    holiday_date: "2027-01-26",
    day_name: "Tuesday",
    holiday_type_id: "NAT",
    holiday_type_name: "National Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: true,
    description: "Republic Day of India - mandatory statutory holiday",
    active_yn: true,
    status: "Active",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-04-01T09:00:00Z"
  },
  {
    id: "HOL-013",
    organization_id: "ORG-001",
    organization_name: "Mauli Service Center Pvt. Ltd.",
    applicable_level: "ORGANIZATION",
    facility_id: null,
    facility_name: "All Facilities",
    financial_year_id: "FC-001",
    financial_year_code: "FY 2026-27",
    holiday_code: "HOL-ANN-MNT",
    holiday_name: "Annual Workshop Maintenance",
    holiday_date: "2027-03-31",
    day_name: "Wednesday",
    holiday_type_id: "COMP",
    holiday_type_name: "Company Holiday",
    holiday_category: "FULL_DAY",
    half_day_type: null,
    from_time: null,
    to_time: null,
    recurring_yn: false,
    description: "Year-end physical count and plant overhaul - non-working day",
    active_yn: false,
    status: "Inactive",
    created_by: "System Administrator",
    created_date: "2026-04-01T09:00:00Z",
    modified_by: "System Administrator",
    modified_date: "2026-10-01T09:00:00Z"
  }
];

const holidayAudit = [
  {
    id: "HA-001",
    holiday_id: "HOL-013",
    holiday_code: "HOL-ANN-MNT",
    holiday_name: "Annual Workshop Maintenance",
    action: "DEACTIVATE",
    old_value: { status: "Active", active_yn: true },
    new_value: { status: "Inactive", active_yn: false },
    user_name: "System Administrator",
    timestamp: "2026-10-01T09:00:00Z",
    reason: "Deactivated for operational review"
  },
  {
    id: "HA-002",
    holiday_id: "HOL-003",
    holiday_code: "HOL-PLK-PUN",
    holiday_name: "Palkhi Festival Holiday",
    action: "CREATE",
    old_value: null,
    new_value: { holiday_code: "HOL-PLK-PUN", applicable_level: "FACILITY", facility_name: "Mauli Service Center 1" },
    user_name: "Facility Admin",
    timestamp: "2026-04-01T09:00:00Z",
    reason: "Initial calendar setup"
  }
];

// Append holiday_types, holidays, and holiday_audit before closing `};`
if (!content.includes('"holiday_types":')) {
  const insertMarker = '  "financial_calendar_audit": [\n';
  const markerIdx = content.indexOf(insertMarker);
  if (markerIdx !== -1) {
    const endAuditIdx = content.indexOf('  ]\n};', markerIdx);
    if (endAuditIdx !== -1) {
      const sliceBefore = content.slice(0, endAuditIdx + 4);
      const sliceAfter = content.slice(endAuditIdx + 4);
      
      const newCollections = ',\n  "holiday_types": ' + JSON.stringify(holidayTypes, null, 4).replace(/\n/g, '\n  ') +
        ',\n  "holidays": ' + JSON.stringify(holidays, null, 4).replace(/\n/g, '\n  ') +
        ',\n  "holiday_audit": ' + JSON.stringify(holidayAudit, null, 4).replace(/\n/g, '\n  ');

      content = sliceBefore + newCollections + sliceAfter;
      fs.writeFileSync(mockDataPath, content, 'utf8');
      console.log('✓ Added holiday_types, holidays, and holiday_audit to mock-data.js');
    } else {
      console.warn('Could not find endAuditIdx');
    }
  } else {
    console.warn('Could not find insertMarker');
  }
} else {
  console.log('holiday_types already exists in mock-data.js');
}

fs.writeFileSync(mockDataPath, content, 'utf8');
console.log('mock-data.js update complete!');
