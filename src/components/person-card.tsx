import { Trash2Icon } from "lucide-react"

import type { Person } from "@/lib/types"
import { getTimezoneLabel } from "@/lib/timezones"
import { Clock } from "@/components/clock"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PersonCard({
  person,
  onDelete,
  hour12 = false,
}: {
  person: Person
  onDelete: (id: string) => void
  hour12?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{person.name}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{person.location}</Badge>
          <span className="text-muted-foreground">
            {getTimezoneLabel(person.timezone)}
          </span>
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${person.name}`}
            onClick={() => onDelete(person.id)}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-mono tabular-nums">
          <Clock timeZone={person.timezone} hour12={hour12} />
        </p>
      </CardContent>
    </Card>
  )
}
