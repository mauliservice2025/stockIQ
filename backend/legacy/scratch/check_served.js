fetch('http://localhost:3000/index.html').then(r => r.text()).then(t => {
  const m = t.match(/<script src="js\/modules\/billing\.js[^"]*">/);
  console.log('Script tag in served index.html:', m ? m[0] : 'NOT FOUND');
  const appM = t.match(/<script src="js\/app\.js[^"]*">/);
  console.log('App script tag in served index.html:', appM ? appM[0] : 'NOT FOUND');
  const jcLink = t.match(/<a href="#\/job-cards"[^>]*>/);
  console.log('Job cards link in served index.html:', jcLink ? jcLink[0] : 'NOT FOUND');
}).catch(err => {
  console.error('Fetch error:', err.message);
});
