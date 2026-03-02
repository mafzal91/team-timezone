import { useEffect, useState } from "react"

/**
 * Displays the current time for a given IANA timezone, updating every second.
 * @param hour12 - true for 12-hour (civilian) format, false for 24-hour (military) format
 */
export function Clock({
  timeZone,
  hour12 = false,
}: {
  timeZone: string
  hour12?: boolean
}) {
  const [time, setTime] = useState("")

  useEffect(() => {
    const format = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12,
    })

    const tick = () => setTime(format.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timeZone, hour12])

  return <span>{time}</span>
}

/** Displays the current date for a given IANA timezone, updating every second. */
export function LocalDate({ timeZone }: { timeZone: string }) {
  const [date, setDate] = useState("")

  useEffect(() => {
    const format = new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const tick = () => setDate(format.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timeZone])

  return <span>{date}</span>
}
