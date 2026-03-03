import { useEffect, useMemo, useState } from "react"

/**
 * Displays the time for a given IANA timezone.
 * When `time` is provided, displays that fixed time; otherwise updates live every second.
 * @param hour12 - true for 12-hour (civilian) format, false for 24-hour (military) format
 */
export function Clock({
  timeZone,
  hour12 = false,
  time,
}: {
  timeZone: string
  hour12?: boolean
  time?: Date
}) {
  const [display, setDisplay] = useState("")

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12,
      }),
    [timeZone, hour12]
  )

  useEffect(() => {
    if (time !== undefined) {
      setDisplay(formatter.format(time))
      return
    }
    const tick = () => setDisplay(formatter.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [formatter, time])

  return <span>{display}</span>
}

/**
 * Displays the date for a given IANA timezone.
 * When `time` is provided, displays the date for that fixed time; otherwise updates live every second.
 */
export function LocalDate({ timeZone, time }: { timeZone: string; time?: Date }) {
  const [date, setDate] = useState("")

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [timeZone]
  )

  useEffect(() => {
    if (time !== undefined) {
      setDate(formatter.format(time))
      return
    }
    const tick = () => setDate(formatter.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [formatter, time])

  return <span>{date}</span>
}
