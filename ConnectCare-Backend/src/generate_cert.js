const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: 'localhost' }];

selfsigned.generate(attrs, { days: 365 }, (err, pems) => {
    if (err) {
        console.error('Error generating certs:', err);
    } else {
        console.log('Keys in pems:', Object.keys(pems));
        fs.writeFileSync(path.join(__dirname, 'cert.pem'), pems.cert || pems.certificate || '');
        fs.writeFileSync(path.join(__dirname, 'key.pem'), pems.private || pems.privateKey || '');
        console.log('Certificates generated successfully: cert.pem, key.pem');
    }
});
