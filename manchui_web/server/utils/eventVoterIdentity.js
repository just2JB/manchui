const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const KEY_VERSION_PATTERN = /^[a-zA-Z0-9_]{1,20}$/;

function decodeBase64Key(value) {
  if (!value || !/^[a-zA-Z0-9+/]+={0,2}$/.test(value)) return null;
  const key = Buffer.from(value, "base64");
  return key.length === KEY_BYTES ? key : null;
}

function getLegacyKey() {
  const secret = process.env.EVENT_VOTER_ENCRYPTION_SECRET;
  if (!secret || secret.length < 24) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

function getActiveKeyConfig() {
  const version = String(process.env.EVENT_VOTER_ACTIVE_KEY_VERSION || "").trim();
  if (!version) {
    const key = getLegacyKey();
    return key ? { key, version: null } : null;
  }
  if (!KEY_VERSION_PATTERN.test(version)) return null;
  const key = decodeBase64Key(process.env[`EVENT_VOTER_ENCRYPTION_KEY_${version.toUpperCase()}`]);
  return key ? { key, version } : null;
}

function getKeyForVote(vote) {
  const version = String(vote?.identifierKeyVersion || "").trim();
  if (!version) return getLegacyKey();
  if (!KEY_VERSION_PATTERN.test(version)) return null;
  return decodeBase64Key(process.env[`EVENT_VOTER_ENCRYPTION_KEY_${version.toUpperCase()}`]);
}

function encryptVoterIdentifier(value) {
  const config = getActiveKeyConfig();
  if (!config) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, config.key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    encryptedIdentifier: encrypted.toString("base64"),
    identifierIv: iv.toString("base64"),
    identifierAuthTag: cipher.getAuthTag().toString("base64"),
    identifierKeyVersion: config.version,
  };
}

function decryptVoterIdentifier(vote) {
  const key = getKeyForVote(vote);
  if (!key || !vote?.encryptedIdentifier || !vote?.identifierIv || !vote?.identifierAuthTag) return null;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(vote.identifierIv, "base64"),
    { authTagLength: 16 },
  );
  decipher.setAuthTag(Buffer.from(vote.identifierAuthTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(vote.encryptedIdentifier, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function maskVoterIdentifier(value, identifierType) {
  if (!value) return "확인 불가";
  if (identifierType === "phone") return `뒷자리 ${value.slice(-4)}`;
  if (value.length <= 2) return `${value[0]}*`;
  return `${value[0]}${"*".repeat(Math.min(value.length - 2, 8))}${value.at(-1)}`;
}

module.exports = {
  decodeBase64Key,
  decryptVoterIdentifier,
  encryptVoterIdentifier,
  maskVoterIdentifier,
};
