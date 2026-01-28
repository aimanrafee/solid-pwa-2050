const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;
const GAS_URL = "https://script.google.com/macros/s/AKfycbxiJyaYR5j534bYKXAkRe5qkyDrGte5X6fupGOry7kGsiQ2FiFMQpTS1SAQbmfKbh8RGQ/exec"; // <--- Ganti di sini!

// 1. DAFTAR BIOMETRIK (Online Sahaja)
async function daftarBiometrik() {
    const email = prompt("Masukkan Emel Pendaftar:");
    if (!email) return;

    // Challenge ringkas (Visi 2050: Dijana oleh Gemini)
    const options = {
        challenge: btoa("solid-2050-challenge-123"), 
        rp: { name: "Solid PWA 2050" },
        user: { id: btoa(email), name: email, displayName: email },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        timeout: 60000,
        authenticatorSelection: { userVerification: "required" }
    };

    try {
        const regResp = await startRegistration(options);
        
        // Hantar ke Google Sheets
        const response = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "register",
                email: email,
                credentialID: regResp.id,
                publicKey: regResp.attestationObject
            })
        });

        const result = await response.json();
        alert(result.message);
        localStorage.setItem("solid_user_id", regResp.id); // Simpan untuk Offline

    } catch (err) {
        console.error(err);
        alert("Pendaftaran Gagal. Sila semak konsol.");
    }
}

// 2. VERIFIKASI BIOMETRIK (Online/Offline)
async function logMasukBiometrik() {
    const storedID = localStorage.getItem("solid_user_id");
    if (!storedID) return alert("Sila lakukan 'Initial Setup' dahulu.");

    const authOptions = {
        challenge: btoa("solid-2050-login-challenge"),
        allowCredentials: [{ id: storedID, type: 'public-key' }],
        userVerification: "required"
    };

    try {
        const authResp = await startAuthentication(authOptions);

        if (navigator.onLine) {
            // Verifikasi dengan Cloud (Google Sheets)
            const response = await fetch(GAS_URL, {
                method: "POST",
                body: JSON.stringify({ action: "login", credentialID: authResp.id })
            });
            const result = await response.json();
            if (result.status === "success") aksesDiberi();
        } else {
            // Verifikasi Tempatan (Offline Mode)
            alert("Offline: Biometrik Disahkan oleh Peranti.");
            aksesDiberi();
        }
    } catch (err) {
        alert("Akses Ditolak!");
    }
}

function aksesDiberi() {
    document.querySelector('.auth-card').style.display = 'none';
    document.getElementById('algo-display').style.display = 'block';
}
