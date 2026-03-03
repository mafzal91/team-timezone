import { useMemo, useState } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import { UserPlusIcon, Trash2Icon, PencilIcon } from "lucide-react"

import type { Person } from "@/lib/types"
import { getTimezoneLabel } from "@/lib/timezones"
import { useTeamsStorage } from "@/lib/use-teams-storage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddPersonDialog } from "@/components/add-person-dialog"
import { TeamSwitcher } from "@/components/team-switcher"
import { Clock, LocalDate } from "@/components/clock"
import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const TIME_FORMAT_KEY = "team-timezone-time-format"

/** true = 24h (military), false = 12h (civilian) */
function useTimeFormat() {
  return useLocalStorage<boolean>(TIME_FORMAT_KEY, false)
}

function YourTime({ hour12, time }: { hour12: boolean; time?: Date }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const label = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value ?? tz

  return (
    <div className="flex flex-wrap items-baseline justify-center gap-2">
      <span className="text-muted-foreground">
        {time ? "Preview time:" : "Your time:"}
      </span>
      <span className="text-2xl font-mono tabular-nums">
        <Clock timeZone={tz} hour12={hour12} time={time} />
      </span>
      <span className="text-sm text-muted-foreground">({label})</span>
    </div>
  )
}

function TimeFormatToggle({
  military,
  onFormatChange,
}: {
  military: boolean
  onFormatChange: (military: boolean) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-muted/30 p-0.5">
      <button
        type="button"
        onClick={() => onFormatChange(false)}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          !military
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        12h
      </button>
      <button
        type="button"
        onClick={() => onFormatChange(true)}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          military
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        24h
      </button>
    </div>
  )
}

function App() {
  const {
    teams,
    activeTeamId,
    people,
    setActiveTeamId,
    setPeopleForActiveTeam,
    addTeam,
    updateTeam,
    deleteTeam,
  } = useTeamsStorage()
  const [timeFormat24h, setTimeFormat24h] = useTimeFormat()
  const [customTimeValue, setCustomTimeValue] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const customTime = useMemo(() => {
    if (!customTimeValue) return undefined
    const [hours, minutes] = customTimeValue.split(":").map(Number)
    const d = new Date()
    d.setHours(hours, minutes, 0, 0)
    return d
  }, [customTimeValue])
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  /** ID of person pending delete (double-confirm state); when set, AlertDialog is open */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const personToDelete = people.find((p) => p.id === deleteConfirmId) ?? null

  const handleAdd = (person: Person) => {
    setPeopleForActiveTeam((prev) => [...prev, person])
  }

  const handleEdit = (person: Person) => {
    setPeopleForActiveTeam((prev) =>
      prev.map((p) => (p.id === person.id ? person : p))
    )
    setEditingPerson(null)
  }

  const handleDelete = (id: string) => {
    setPeopleForActiveTeam((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirmId(null)
  }

  const handleDeleteClick = (person: Person) => {
    setDeleteConfirmId(person.id)
  }

  const openAddDialog = () => {
    setEditingPerson(null)
    setDialogOpen(true)
  }

  const openEditDialog = (person: Person) => {
    setEditingPerson(person)
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setEditingPerson(null)
    setDialogOpen(open)
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
        <div className="mx-auto max-w-2xl w-full px-4 py-8 flex flex-col items-center">
          <header className="space-y-2 text-center w-full relative">
            <div className="absolute top-0 right-0">
              <ModeToggle />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Team timezone
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <TeamSwitcher
                teams={teams}
                activeTeamId={activeTeamId}
                onSwitch={setActiveTeamId}
                onAddTeam={addTeam}
                onRenameTeam={(id, name) => updateTeam(id, { name })}
                onDeleteTeam={deleteTeam}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <YourTime hour12={!timeFormat24h} time={customTime} />
              <TimeFormatToggle
                military={timeFormat24h}
                onFormatChange={setTimeFormat24h}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Set time:</span>
              <input
                type="time"
                value={customTimeValue}
                onChange={(e) => setCustomTimeValue(e.target.value)}
                className="rounded border border-input bg-background px-2 py-1 text-sm font-mono tabular-nums text-foreground"
              />
              {customTimeValue && (
                <button
                  type="button"
                  onClick={() => setCustomTimeValue("")}
                  className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  Back to live
                </button>
              )}
            </div>
          </header>

        <Separator className="my-6 w-full max-w-2xl" />

        {customTime && (
          <div className="mb-4 w-full flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            <span>
              Previewing times at{" "}
              <span className="font-mono font-medium">{customTimeValue}</span> — clocks are frozen
            </span>
            <button
              type="button"
              onClick={() => setCustomTimeValue("")}
              className="shrink-0 rounded px-2 py-0.5 text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              Back to live
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-2xl items-center">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium">People</h2>
            <Button onClick={openAddDialog}>
              <UserPlusIcon />
              Add person
            </Button>
          </div>

          {people.length === 0 ? (
            <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center text-muted-foreground w-full">
              No people yet. Click &quot;Add person&quot; to add someone and see
              their local time.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-lg border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="w-12 px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr
                      key={person.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{person.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span title={getTimezoneLabel(person.timezone)}>
                          {person.location}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        <LocalDate timeZone={person.timezone} time={customTime} />
                      </td>
                      <td className="px-4 py-3 font-mono text-lg tabular-nums">
                        <Clock
                          timeZone={person.timezone}
                          hour12={!timeFormat24h}
                          time={customTime}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${person.name}`}
                            onClick={() => openEditDialog(person)}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${person.name}`}
                            onClick={() => handleDeleteClick(person)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddPersonDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          onAdd={handleAdd}
          person={editingPerson}
          onEdit={handleEdit}
        />

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {personToDelete?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove them from the list. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </ThemeProvider>
  )
}

export default App
