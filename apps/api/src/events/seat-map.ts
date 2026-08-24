const SEATS_PER_ROW = 12;

function rowName(index: number) {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

export function buildSeatMap(capacity: number) {
  return Array.from({ length: capacity }, (_, index) => {
    const row = rowName(Math.floor(index / SEATS_PER_ROW));
    const number = (index % SEATS_PER_ROW) + 1;
    return { row, number, label: `${row}${number}` };
  });
}
