export const factoryMachines = [
  {
    id: 'MC-01',

    name: 'CNC Machine',

    x: -6,
    y: 0,
    z: 2,

    status: 'running',

    temperature: 62,
  },

  {
    id: 'MC-02',

    name: 'Robot Welding',

    x: 0,
    y: 0,
    z: 0,

    status: 'warning',

    temperature: 84,
  },

  {
    id: 'MC-03',

    name: 'Cutting Station',

    x: 6,
    y: 0,
    z: -2,

    status: 'running',

    temperature: 54,
  },
]

export const yardZones = [
  {
    id: 'ZONE-A',

    x: -12,
    z: -10,

    occupancy: 82,
  },

  {
    id: 'ZONE-B',

    x: 0,
    z: -10,

    occupancy: 44,
  },

  {
    id: 'ZONE-C',

    x: 12,
    z: -10,

    occupancy: 61,
  },
]
