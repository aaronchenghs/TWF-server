function isPrivateNetworkHostname(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  )
    return true;

  if (hostname.startsWith("10.")) return true;
  if (hostname.startsWith("192.168.")) return true;

  const parts = hostname.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const secondOctet = Number(parts[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  return false;
}

export function isPrivateNetworkOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return false;
    return isPrivateNetworkHostname(parsed.hostname);
  } catch {
    return false;
  }
}
