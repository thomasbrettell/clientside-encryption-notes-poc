export const base64EncodeBuffer = (buffer: Uint8Array<ArrayBuffer>) => {
  return btoa(String.fromCharCode(...buffer));
};

export const decodeBase64ToBuffer = (str: string) => {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
};

export const deriveKeys = async (
  password: string,
  salt: string,
  iterations = 100000,
  keyLength = 64
) => {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    keyLength * 8
  );

  const fullKey = new Uint8Array(derivedBits);
  const masterKey = fullKey.slice(0, keyLength / 2);
  const accountServerPassword = fullKey.slice(keyLength / 2);

  console.log(masterKey);

  return {
    masterKey: base64EncodeBuffer(masterKey),
    serverPassword: base64EncodeBuffer(accountServerPassword),
  };
};

const importAesKey = async (base64Key: string) => {
  return await crypto.subtle.importKey(
    "raw",
    decodeBase64ToBuffer(base64Key),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (plaintext: string, base64Key: string) => {
  const key = await importAesKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: base64EncodeBuffer(new Uint8Array(ciphertext)),
    iv: base64EncodeBuffer(iv),
  };
};

export const decryptData = async (
  encryptedContent: string,
  base64Key: string
) => {
  const [base64Iv, base64Ciphertext] = encryptedContent.split(":");

  if (!base64Iv || !base64Ciphertext) return;

  const key = await importAesKey(base64Key);
  const decoder = new TextDecoder();

  const ciphertext = Uint8Array.from(atob(base64Ciphertext), (c) =>
    c.charCodeAt(0)
  );
  const iv = Uint8Array.from(atob(base64Iv), (c) => c.charCodeAt(0));

  const plaintextBytes = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return decoder.decode(plaintextBytes);
};
