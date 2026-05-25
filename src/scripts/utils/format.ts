export function humanizeLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\w/g, (char) => char.toUpperCase());
}
