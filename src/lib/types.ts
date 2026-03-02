export interface Person {
  id: string
  name: string
  location: string
  timezone: string // IANA timezone string, e.g. "America/New_York"
}

/** A team is a bucket of users in various locations (each person has their own timezone). */
export interface Team {
  id: string
  name: string
  people: Person[]
}
