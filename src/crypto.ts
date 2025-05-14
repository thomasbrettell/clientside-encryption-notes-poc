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

export const computerRootKey = async (
  identifier: string,
  password: string,
  nonce: string
) => {
  const salt = truncateHexString(await sha256(`${identifier}:${nonce}`), 128);
  const derivedKey = argon2(password, salt, 5, 67108864, 64);

  const [masterKey, serverPassword] = splitString(derivedKey, 2);

  return { masterKey, serverPassword, nonce };
};

export const createRootKey = async (identifier: string, password: string) => {
  const nonce = arrayBufferToHexString(
    crypto.getRandomValues(new Uint8Array(256 / 8))
  );

  return computerRootKey(identifier, password, nonce);
};

export const encryptPayload = (payload: string, key: string) => {
  // what to do with this and why?
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

  const ciphertext = sodium.to_base64(
    Buffer.from(arrayBuffer),
    sodium.base64_variants.ORIGINAL
  );

  return `${nonse}:${ciphertext}`;
};

export const decryptPayload = (encrypted: string, key: string) => {
  const [nonse, ciphertest] = encrypted.split(":");

  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    sodium.from_base64(ciphertest, sodium.base64_variants.ORIGINAL),
    null,
    sodium.from_hex(nonse),
    sodium.from_hex(key),
    "text"
  );
};
