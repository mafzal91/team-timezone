import { useState } from "react"

import type { Person } from "@/lib/types"
import { getTimezoneOptions } from "@/lib/timezones"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const defaultForm = {
  name: "",
  location: "",
  timezone: "UTC",
};

export function AddPersonDialog({
  open,
  onOpenChange,
  onAdd,
  person = null,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (person: Person) => void;
  person?: Person | null;
  onEdit?: (person: Person) => void;
}) {
  const isEditing = Boolean(person);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <AddPersonForm
            key={person?.id ?? "new"}
            initialName={person?.name ?? defaultForm.name}
            initialLocation={person?.location ?? defaultForm.location}
            initialTimezone={person?.timezone ?? defaultForm.timezone}
            isEditing={isEditing}
            person={person}
            onAdd={onAdd}
            onEdit={onEdit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AddPersonForm({
  initialName,
  initialLocation,
  initialTimezone,
  isEditing,
  person,
  onAdd,
  onEdit,
  onCancel,
}: {
  initialName: string;
  initialLocation: string;
  initialTimezone: string;
  isEditing: boolean;
  person: Person | null;
  onAdd: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [timezone, setTimezone] = useState(initialTimezone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEditing && person && onEdit) {
      onEdit({
        ...person,
        name: name.trim(),
        location: location.trim(),
        timezone,
      });
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        location: location.trim(),
        timezone,
      });
    }
    onCancel();
  };

  return (
    <>
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
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="add-person-timezone" className="w-full">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              {getTimezoneOptions().map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {isEditing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
