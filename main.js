const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

// URL Google AppScript anda yang telah disahkan
const GAS_URL = "https://script.google.com/macros/s/AKfycbxiJyaYR5j534bYKXAkRe5qkyDrGte5X6fupGOry7kGsiQ2FiFMQpTS1SAQbmfKbh8RGQ/exec";

// Fungsi Helper: Menukar Base64 URL ke Uint8Array (Penting untuk WebAuthn)
function bufferDecode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

// 1. DAFTAR BIOMETRIK (Online Sahaja)
async function daftarBiometrik() {
    const email = prompt("Masukkan Emel Pendaftar untuk Solid 2050:");
    if (!email) return;

    // Challenge & Options
    const options = {
        challenge: btoa("solid-2050-challenge-unique-key"), 
        rp: { name: "Solid PWA 2050", id: window.location.hostname },
        user: { 
            id: btoa(email), 
            name: email, 
            displayName: email.split('@')[0] 
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        timeout: 60000,
        authenticatorSelection: { 
            authenticatorAttachment: "platform",
            userVerification: "required" 
        }
    };

    try {
        const regResp = await startRegistration(options);
        
        // Paparkan status sedang memproses
        console.log("Menghantar ke Cloud...");

        const response = await fetch(GAS_URL, {
            redirect: "follow", // Wajib untuk Google Apps Script
            method: "POST",
            body: JSON.stringify({
                action: "register",
                email: email,
                credentialID: regResp.id,
                publicKey: JSON.stringify(regResp) // Simpan objek penuh untuk rujukan
            })
        });

        const result = await response.json();
        
        if(result.status === "success") {
            alert("🚀 " + result.message);
            localStorage.setItem("solid_user_id", regResp.id);
            localStorage.setItem("solid_user_email", email);
        } else {
            alert("Ralat: " + result.message);
        }

    } catch (err) {
        console.error("Ralat Pendaftaran:", err);
        alert("Pendaftaran Gagal. Pastikan anda menggunakan HTTPS dan peranti menyokong biometrik.");
    }
}

// 2. VERIFIKASI BIOMETRIK (Online/Offline)
async function logMasukBiometrik() {
    const storedID = localStorage.getItem("solid_user_id");
    if (!storedID) return alert("Sila lakukan 'Initial Setup' terlebih dahulu.");

    const authOptions = {
        challenge: btoa("solid-2050-login-auth"),
        allowCredentials: [{ 
            id: storedID, 
            type: 'public-key',
            transports: ['internal'] 
        }],
        userVerification: "required"
    };

    try {
        const authResp = await startAuthentication(authOptions);

        if (navigator.onLine) {
            const response = await fetch(GAS_URL, {
                redirect: "follow",
                method: "POST",
                body: JSON.stringify({ 
                    action: "login", 
                    credentialID: authResp.id 
                })
            });
            const result = await response.json();
            if (result.status === "success") {
                aksesDiberi();
            } else {
                alert("Cloud Verification Gagal: " + result.message);
            }
        } else {
            // Logik Offline
            alert("🛰️ MOD OFFLINE: Biometrik disahkan secara lokal.");
            aksesDiberi();
        }
    } catch (err) {
        console.error("Ralat Log Masuk:", err);
        alert("Akses Ditolak atau Dibatalkan.");
    }
}

function aksesDiberi() {
    document.querySelector('.auth-card').style.display = 'none';
    document.getElementById('algo-display').style.display = 'block';
    
    // Trigger algoritma pintar anda di sini
    console.log("Smartest Algorithm 2050 Initiated...");
}
