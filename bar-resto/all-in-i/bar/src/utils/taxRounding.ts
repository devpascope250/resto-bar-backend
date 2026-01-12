export default function taxRounder(value: number): number {
  // The CIS shall round values of tax on two decimals. (<5 - down, >=5 - up)
  return parseFloat((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}
