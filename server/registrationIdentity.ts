export function normalizeIdentityPart(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function registrationKey(college: string, rollNumber: string): string {
  return `${normalizeIdentityPart(college)}\u0000${normalizeIdentityPart(rollNumber)}`;
}
