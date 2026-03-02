import { Fragment, useState, useCallback, useEffect } from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import type { Person } from "@/lib/types"
import { getTimezoneOptionsGroupedByContinent, getTimezoneLabel } from "@/lib/timezones"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const defaultForm = {
  name: "",
  location: "",
  timezone: "UTC",
}

export function AddPersonDialog({
  open,
  onOpenChange,
  onAdd,
  person = null,
  onEdit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (person: Person) => void
  person?: Person | null
  onEdit?: (person: Person) => void
}) {
  const [name, setName] = useState(defaultForm.name)
  const [location, setLocation] = useState(defaultForm.location)
  const [timezone, setTimezone] = useState(defaultForm.timezone)
  const [timezoneOpen, setTimezoneOpen] = useState(false)

  const isEditing = Boolean(person)

  // When opening for edit, populate form from person
  useEffect(() => {
    if (open && person) {
      setName(person.name)
      setLocation(person.location)
      setTimezone(person.timezone)
    }
  }, [open, person])

  const resetForm = useCallback(() => {
    setName(defaultForm.name)
    setLocation(defaultForm.location)
    setTimezone(defaultForm.timezone)
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetForm()
      onOpenChange(next)
    },
    [onOpenChange, resetForm]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (isEditing && person && onEdit) {
      onEdit({
        ...person,
        name: name.trim(),
        location: location.trim(),
        timezone,
      })
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        location: location.trim(),
        timezone,
      })
    }
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit person" : "Add person"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update their name, location, or time zone."
              : "Add someone to your team list to see their local time."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="add-person-name">Name</Label>
            <Input
              id="add-person-name"
              placeholder="e.g. Jane"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-person-location">Location</Label>
            <Input
              id="add-person-location"
              placeholder="e.g. New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-person-timezone">Time zone</Label>
            <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="add-person-timezone"
                  variant="outline"
                  role="combobox"
                  aria-expanded={timezoneOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {getTimezoneLabel(timezone)}
                  </span>
                  <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search time zone..." />
                  <CommandList>
                    <CommandEmpty>No time zone found.</CommandEmpty>
                    {(() => {
                      const groups = getTimezoneOptionsGroupedByContinent()
                      return groups.map((group, index) => (
                        <Fragment key={group.continent}>
                          <CommandGroup heading={group.continent}>
                            {group.options.map((t) => (
                              <CommandItem
                                key={t.value}
                                value={`${t.label} ${t.value} ${group.continent}`}
                                onSelect={() => {
                                  setTimezone(t.value)
                                  setTimezoneOpen(false)
                                }}
                              >
                                <CheckIcon
                                  className={
                                    timezone === t.value
                                      ? "mr-2 size-4 opacity-100"
                                      : "mr-2 size-4 opacity-0"
                                  }
                                />
                                {t.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {index < groups.length - 1 && <CommandSeparator />}
                        </Fragment>
                      ))
                    })()}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
