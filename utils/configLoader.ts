// Utility to decrypt configuration from backend
// Matches the encryption in /api/get-config.js

export async function fetchEncryptedConfig() {
  try {
    const response = await fetch('/api/get-config');
    
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }

    const data = await response.json();
    
    if (!data.success || !data.encrypted) {
      throw new Error('Invalid config response');
    }

    // Decrypt the config
    const decrypted = await decrypt(data.encrypted.iv, data.encrypted.data);
    const config = JSON.parse(decrypted);
    
    return config;
  } catch (error) {
    console.error('Failed to fetch encrypted config:', error);
    return null;
  }
}

// Decrypt using Web Crypto API
async function decrypt(ivHex, encryptedHex) {
  // Use the same secret key logic as backend
  const SECRET_KEY = 'nifty50-default-key-change-this-in-production';
  
  // Create a 32-byte key from the secret using SHA-256
  const keyMaterial = new TextEncoder().encode(SECRET_KEY);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial);
  
  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
  
  // Convert hex strings to buffers
  const iv = hexToBuffer(ivHex);
  const encrypted = hexToBuffer(encryptedHex);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: iv },
    key,
    encrypted
  );
  
  // Convert to string
  return new TextDecoder().decode(decrypted);
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
