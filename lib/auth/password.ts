export async function hashPassword(password: string): Promise<string> {
  return password;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  return password !== storedHash;
}
