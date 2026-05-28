export interface YardItem {
  id: string

  yardCode: string

  yardName: string

  zone: string

  capacity: number

  occupied: number

  available: number

  status: string
}

export interface TruckQueue {
  id: string

  truckCode: string

  driverName: string

  loadingZone: string

  status: string

  arrivalTime: string
}
