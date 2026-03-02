import { useEffect, useCallback } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import type { Person, Team } from "@/lib/types"

const STORAGE_KEY_TEAMS = "team-timezone-teams"
const STORAGE_KEY_LEGACY_PEOPLE = "team-timezone-people"
const MIGRATION_FLAG_KEY = "team-timezone-teams-migrated"

export interface TeamsState {
  teams: Team[]
  activeTeamId: string
}

function createDefaultTeam(): Team {
  const id = crypto.randomUUID()
  return {
    id,
    name: "My team",
    people: [],
  }
}

function getInitialState(): TeamsState {
  const team = createDefaultTeam()
  return {
    teams: [team],
    activeTeamId: team.id,
  }
}

/** Migrate legacy "people" list into a single team if we haven't migrated yet. */
function readLegacyPeople(): Person[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEGACY_PEOPLE)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    const people = parsed as Person[]
    const valid = people.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.timezone === "string"
    )
    return valid ? people : null
  } catch {
    return null
  }
}

const DEFAULT_STATE: TeamsState = getInitialState()

export function useTeamsStorage() {
  const [state, setState] = useLocalStorage<TeamsState>(
    STORAGE_KEY_TEAMS,
    DEFAULT_STATE
  )

  // Run migration once: legacy "people" -> one team
  useEffect(() => {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) return
    const legacy = readLegacyPeople()
    if (legacy?.length) {
      const team = createDefaultTeam()
      team.people = legacy
      setState({
        teams: [team],
        activeTeamId: team.id,
      })
    }
    localStorage.setItem(MIGRATION_FLAG_KEY, "1")
  }, [setState])

  const activeTeam =
    state.teams.find((t) => t.id === state.activeTeamId) ?? state.teams[0]
  const people = activeTeam?.people ?? []

  const setActiveTeamId = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, activeTeamId: id }))
    },
    [setState]
  )

  const setPeopleForActiveTeam = useCallback(
    (updater: (prev: Person[]) => Person[]) => {
      setState((prev) => {
        const nextTeams = prev.teams.map((t) =>
          t.id === prev.activeTeamId
            ? { ...t, people: updater(t.people) }
            : t
        )
        return { ...prev, teams: nextTeams }
      })
    },
    [setState]
  )

  const addTeam = useCallback(
    (name: string) => {
      const team: Team = {
        id: crypto.randomUUID(),
        name: name.trim() || "New team",
        people: [],
      }
      setState((prev) => ({
        teams: [...prev.teams, team],
        activeTeamId: team.id,
      }))
    },
    [setState]
  )

  const updateTeam = useCallback(
    (id: string, updates: { name?: string }) => {
      setState((prev) => ({
        ...prev,
        teams: prev.teams.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }))
    },
    [setState]
  )

  const deleteTeam = useCallback(
    (id: string) => {
      setState((prev) => {
        const nextTeams = prev.teams.filter((t) => t.id !== id)
        const wasActive = prev.activeTeamId === id
        const nextActiveId = wasActive
          ? nextTeams[0]?.id ?? ""
          : prev.activeTeamId
        return { teams: nextTeams, activeTeamId: nextActiveId }
      })
    },
    [setState]
  )

  return {
    teams: state.teams,
    activeTeamId: state.activeTeamId,
    activeTeam,
    people,
    setActiveTeamId,
    setPeopleForActiveTeam,
    addTeam,
    updateTeam,
    deleteTeam,
  }
}
