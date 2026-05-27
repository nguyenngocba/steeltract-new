export const yardSlots = Array.from(
  { length: 50 },
  (_, row) => {
    const cols = ['A', 'C', 'E', 'G', 'K']

    return cols.map((col) => ({
      id: `${col}${row + 1}`,

      x: row,
      y: cols.indexOf(col),

      occupancy:
        Math.floor(Math.random() * 100),

      level:
        Math.floor(Math.random() * 5),

      material:
        [
          'H400',
          'Plate',
          'Pipe',
          'Beam',
        ][Math.floor(Math.random() * 4)],

      quantity:
        Math.floor(Math.random() * 300),
    }))
  }
).flat()
