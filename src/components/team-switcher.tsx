import { useState, useCallback } from "react"
import { Users, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddTeamDialog } from "@/components/add-team-dialog"

export interface TeamSwitcherProps {
  teams: Team[]
  activeTeamId: string
  onSwitch: (teamId: string) => void
  onAddTeam: (name: string) => void
  onRenameTeam: (teamId: string, name: string) => void
  onDeleteTeam: (teamId: string) => void
}

export function TeamSwitcher({
  teams,
  activeTeamId,
  onSwitch,
  onAddTeam,
  onRenameTeam,
  onDeleteTeam,
}: TeamSwitcherProps) {
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [renameTeam, setRenameTeam] = useState<Team | null>(null)
  const [renameName, setRenameName] = useState("")
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? teams[0]
  const canDelete = teams.length > 1

  const handleRenameSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (renameTeam && renameName.trim()) {
        onRenameTeam(renameTeam.id, renameName.trim())
        setRenameTeam(null)
        setRenameName("")
      }
    },
    [renameTeam, renameName, onRenameTeam]
  )

  const openRename = useCallback(() => {
    if (activeTeam) {
      setRenameTeam(activeTeam)
      setRenameName(activeTeam.name)
    }
  }, [activeTeam])

  const handleSelectValue = useCallback(
    (value: string) => {
      if (value === "__add__") {
        setAddTeamOpen(true)
      } else {
        onSwitch(value)
      }
    },
    [onSwitch]
  )
  return (
    <div className="flex items-center gap-1">
      <Select value={activeTeamId} onValueChange={handleSelectValue}>
        <SelectTrigger className="min-w-40 gap-2">
          <Users className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <span className="flex items-center justify-between gap-3">
                {team.name}
                {team.people.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {team.people.length}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="__add__" className="text-muted-foreground focus:text-foreground">
            <Plus className="size-4" />
            Add team
          </SelectItem>
        </SelectContent>
      </Select>

      {activeTeam && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Team options">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={openRename}>
              <Pencil className="size-4" />
              Rename team
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setTeamToDelete(activeTeam)}
              disabled={!canDelete}
            >
              <Trash2 className="size-4" />
              Delete team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AddTeamDialog
        open={addTeamOpen}
        onOpenChange={setAddTeamOpen}
        onAdd={(name) => {
          onAddTeam(name)
          setAddTeamOpen(false)
        }}
      />

      <Dialog
        open={renameTeam !== null}
        onOpenChange={(open) => !open && setRenameTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-team-name">Team name</Label>
              <Input
                id="rename-team-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTeam(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={teamToDelete !== null}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {teamToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the team and all {teamToDelete?.people.length ?? 0}{" "}
              people in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (teamToDelete) {
                  onDeleteTeam(teamToDelete.id)
                  setTeamToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
