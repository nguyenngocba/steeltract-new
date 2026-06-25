function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatLocalDateTimeInput(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
