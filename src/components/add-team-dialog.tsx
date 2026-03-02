import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddTeamDialog({
  open,
  onOpenChange,
  onAdd,
  initialName = "",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string) => void
  initialName?: string
}) {
  const handleOpenChange = useCallback(
    (next: boolean) => onOpenChange(next),
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {open ? (
          <AddTeamForm
            key={initialName}
            initialName={initialName}
            onAdd={onAdd}
            onCancel={() => handleOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function AddTeamForm({
  initialName,
  onAdd,
  onCancel,
}: {
  initialName: string
  onAdd: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(name.trim() || "New team")
    setName("")
    onCancel()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>New team</DialogTitle>
        <DialogDescription>
          Create a team to group people by location. You can add people to this
          team and switch between teams later.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="add-team-name">Team name</Label>
          <Input
            id="add-team-name"
            placeholder="e.g. Engineering, Customer support"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create team</Button>
        </DialogFooter>
      </form>
    </>
  )
}
