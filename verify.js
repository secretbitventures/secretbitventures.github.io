async function verifyLicense(key) {
    try {
        const response = await fetch('/licenses.json');
        const data = await response.json();
        const isValid = key in data.licenses;
        return {
            valid: isValid,
            message: isValid ? `License is valid` : 'Invalid license key'
        };
    } catch (error) {
        return {
            valid: false,
            message: 'Error verifying license'
        };
    }
}

// Handle the verification request
async function handleVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const licenseKey = urlParams.get('key');
    
    if (!licenseKey) {
        document.body.innerHTML = 'No license key provided';
        return;
    }

    const result = await verifyLicense(licenseKey);
    document.body.innerHTML = result.message;
}

// Run verification when the page loads
handleVerification(); 