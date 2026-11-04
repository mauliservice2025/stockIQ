const assert = require('assert');

// Test PIN code directory and heuristic
const PINCODE_DATABASE = {
  // Pune & PCMC
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Pune H.O / Camp' },
  '411002': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Bajirao Road / Shukrawar Peth' },
  '411003': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Shivajinagar' },
  '411004': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Deccan Gymkhana' },
  '411005': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Model Colony' },
  '411006': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Yerwada' },
  '411007': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Aundh' },
  '411008': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Ganeshkhind' },
  '411009': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Parvati / Sahakar Nagar' },
  '411011': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Rasta Peth' },
  '411012': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Dapodi' },
  '411013': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Hadapsar / Magarpatta' },
  '411014': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Viman Nagar / Vadgaon Sheri' },
  '411015': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Vishrantwadi' },
  '411016': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Senapati Bapat Road' },
  '411017': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Pimpri Colony' },
  '411018': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Nehrunagar' },
  '411019': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Chinchwad East' },
  '411020': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Khadki Cantt' },
  '411026': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Bhosari I.I.E.' },
  '411027': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Sangvi' },
  '411028': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Hadapsar' },
  '411030': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Sadashiv Peth' },
  '411033': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Thergaon / Kalewadi' },
  '411037': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Bibwewadi' },
  '411038': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Kothrud / Paud Road' },
  '411039': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Bhosari Gaon / Dighi' },
  '411040': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Wanowrie' },
  '411041': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Vadgaon Budruk / Sinhagad Road' },
  '411042': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Swargate' },
  '411043': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Dhankawadi / Katraj' },
  '411044': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Nigdi / Pradhikaran' },
  '411045': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Baner / Balewadi' },
  '411046': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Katraj' },
  '411048': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Kondhwa' },
  '411051': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Dhayari' },
  '411052': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Karve Nagar' },
  '411057': { city: 'Wakad', district: 'Pune', state: 'Maharashtra', area: 'Wakad / Hinjawadi Infotech Park' },
  '411058': { city: 'Pune', district: 'Pune', state: 'Maharashtra', area: 'Bavdhan' },
  '411061': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Pimple Saudagar / Rahatani' },
  '411062': { city: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra', area: 'Chikhali / Akurdi' },

  // Maharashtra Towns & Districts
  '410501': { city: 'Chakan', district: 'Pune', state: 'Maharashtra', area: 'Chakan Auto Hub' },
  '410507': { city: 'Talegaon Dabhade', district: 'Pune', state: 'Maharashtra', area: 'Talegaon MIDC' },
  '410401': { city: 'Lonavala', district: 'Pune', state: 'Maharashtra', area: 'Lonavala' },
  '412105': { city: 'Alandi', district: 'Pune', state: 'Maharashtra', area: 'Alandi Devachi' },
  '413102': { city: 'Baramati', district: 'Pune', state: 'Maharashtra', area: 'Baramati City' },
  '413133': { city: 'Baramati', district: 'Pune', state: 'Maharashtra', area: 'Baramati MIDC' },
  '400001': { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', area: 'Fort / CST' },
  '400050': { city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', area: 'Bandra West' },
  '400601': { city: 'Thane', district: 'Thane', state: 'Maharashtra', area: 'Thane West' },
  '400703': { city: 'Navi Mumbai', district: 'Thane', state: 'Maharashtra', area: 'Vashi' },
  '422001': { city: 'Nashik', district: 'Nashik', state: 'Maharashtra', area: 'Nashik H.O / Shalimar' },
  '422010': { city: 'Nashik', district: 'Nashik', state: 'Maharashtra', area: 'Ambad MIDC' },
  '422103': { city: 'Sinnar', district: 'Nashik', state: 'Maharashtra', area: 'Musalgaon MIDC Sinnar' },
  '423203': { city: 'Malegaon', district: 'Nashik', state: 'Maharashtra', area: 'Malegaon Textile Camp' },
  '425001': { city: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra', area: 'Jalgaon H.O' },
  '425003': { city: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra', area: 'Jalgaon MIDC' },
  '425201': { city: 'Bhusawal', district: 'Jalgaon', state: 'Maharashtra', area: 'Bhusawal' },
  '414001': { city: 'Ahilyanagar', district: 'Ahilyanagar', state: 'Maharashtra', area: 'Ahilyanagar (Ahmednagar)' },
  '415001': { city: 'Satara', district: 'Satara', state: 'Maharashtra', area: 'Satara' },
  '416001': { city: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', area: 'Kolhapur' },
  '416416': { city: 'Sangli', district: 'Sangli', state: 'Maharashtra', area: 'Sangli' },
  '413001': { city: 'Solapur', district: 'Solapur', state: 'Maharashtra', area: 'Solapur' },
  '431001': { city: 'Chhatrapati Sambhajinagar', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', area: 'Aurangabad' },
  '440001': { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', area: 'Nagpur G.P.O' },

  // Key Metros
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', area: 'Connaught Place' },
  '560001': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', area: 'Bengaluru G.P.O' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', area: 'Hyderabad G.P.O' },
  '600001': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', area: 'George Town' },
  '700001': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', area: 'BBD Bagh' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', area: 'Ahmedabad City' }
};

function getHeuristicPincode(pin) {
  if (!pin || pin.length !== 6) return null;
  const p2 = pin.substring(0, 2);
  const map = {
    '11': { state: 'Delhi', district: 'Delhi', city: 'New Delhi' },
    '12': { state: 'Haryana', district: 'Gurugram/Faridabad', city: 'Haryana' },
    '13': { state: 'Haryana', district: 'Ambala/Karnal', city: 'Haryana' },
    '14': { state: 'Punjab', district: 'Ludhiana/Amritsar', city: 'Punjab' },
    '16': { state: 'Chandigarh', district: 'Chandigarh', city: 'Chandigarh' },
    '20': { state: 'Uttar Pradesh', district: 'Noida/Ghaziabad', city: 'Noida' },
    '30': { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur' },
    '38': { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad' },
    '40': { state: 'Maharashtra', district: 'Mumbai/Thane', city: 'Mumbai' },
    '41': { state: 'Maharashtra', district: 'Pune', city: 'Pune' },
    '42': { state: 'Maharashtra', district: 'Nashik/Jalgaon', city: 'Nashik' },
    '43': { state: 'Maharashtra', district: 'Chhatrapati Sambhajinagar', city: 'Chhatrapati Sambhajinagar' },
    '44': { state: 'Maharashtra', district: 'Nagpur', city: 'Nagpur' },
    '50': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad' },
    '56': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru' },
    '60': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai' },
    '70': { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata' }
  };
  return map[p2] || null;
}

function lookupPincode(pin) {
  if (PINCODE_DATABASE[pin]) {
    return PINCODE_DATABASE[pin];
  }
  return getHeuristicPincode(pin);
}

// Test cases
const testPins = ['411001', '411057', '410501', '400001', '422001', '560001', '110001', '411038'];
console.log('Testing Pincode Lookup:');
for (const pin of testPins) {
  const res = lookupPincode(pin);
  assert(res, `Failed for PIN ${pin}`);
  console.log(`PIN ${pin} -> City: ${res.city}, District: ${res.district}, State: ${res.state}`);
}
console.log('\nAll lookups verified successfully!');
