import sodium from "libsodium-wrappers-sumo";
import { Buffer } from "buffer";

/**
 * Truncates a hex string into a desired number of bits
 * @returns A hexadecimal string truncated to the number of desired bits
 */
export const truncateHexString = (string: string, desiredBits: number) => {
  const BITS_PER_HEX_CHAR = 4;
  const desiredCharLength = desiredBits / BITS_PER_HEX_CHAR;
  return string.substring(0, desiredCharLength);
};

export const splitString = (string: string, parts: number): string[] => {
  const outputLength = string.length;
  const partLength = outputLength / parts;
  const partitions = [];
  for (let i = 0; i < parts; i++) {
    const partition = string.slice(partLength * i, partLength * (i + 1));
    partitions.push(partition);
  }
  return partitions;
};

export const arrayBufferToHexString = (
  arrayBuffer: Uint8Array<ArrayBuffer>
): string => {
  return sodium.to_hex(Buffer.from(arrayBuffer));
};

export const argon2 = (
  password: string,
  salt: string,
  iterations: number,
  bytes: number,
  length: number
): string => {
  const result = sodium.crypto_pwhash(
    length,
    sodium.from_string(password),
    sodium.from_hex(salt),
    iterations,
    bytes,
    sodium.crypto_pwhash_ALG_DEFAULT,
    "hex"
  );
  return result;
};

export const sha256 = async (text: string) => {
  const textData = sodium.from_string(text);
  const digest = await crypto.subtle.digest("SHA-256", textData);
  return sodium.to_hex(new Uint8Array(digest));
};

export const createMasterKey = async (identifier: string, password: string) => {
  const nonce = arrayBufferToHexString(
    crypto.getRandomValues(new Uint8Array(256 / 8))
  );
  const salt = truncateHexString(await sha256(`${identifier}:${nonce}`), 128);
  const derivedKey = argon2(password, salt, 5, 67108864, 64);

  const [masterKey, serverPassword] = splitString(derivedKey, 2);

  return { masterKey, serverPassword, nonce };
};

export const encryptPayload = (payload: string, key: string) => {
  const hashingKey = sodium.to_hex(
    sodium.crypto_kdf_derive_from_key(32, 1, "sn-sym-h", sodium.from_hex(key))
  );

  const nonse = arrayBufferToHexString(
    crypto.getRandomValues(new Uint8Array(192 / 8))
  );

  const arrayBuffer = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    payload,
    null,
    null,
    sodium.from_hex(nonse),
    sodium.from_hex(key)
  );

  const ciphertext = sodium.to_base64(Buffer.from(arrayBuffer));

  return `${nonse}:${ciphertext}`;
};

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
