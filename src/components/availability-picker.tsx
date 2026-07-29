'use client'

import { useState, useCallback, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Clock, X } from 'lucide-react'

const DAYS = [
  { key: 1, label: 'Ma' },
  { key: 2, label: 'Di' },
  { key: 3, label: 'Wo' },
  { key: 4, label: 'Do' },
  { key: 5, label: 'Vr' },
  { key: 6, label: 'Za' },
  { key: 0, label: 'Zo' },
]

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00 - 20:00

function formatTime(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

export interface TimeSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface AvailabilityPickerProps {
  value: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
  minDurationMinutes?: number
  maxSlots?: number
}

export function AvailabilityPicker({
  value,
  onChange,
  minDurationMinutes = 45,
  maxSlots = 10,
}: AvailabilityPickerProps) {
  const [selectionStart, setSelectionStart] = useState<{
    day: number
    hour: number
  } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{
    day: number
    hour: number
  } | null>(null)
  const [showAllDays, setShowAllDays] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const displayDays = showAllDays ? DAYS : DAYS.filter((d) => d.key >= 1 && d.key <= 5)
  const sortedSlots = useMemo(
    () =>
      [...value].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      }),
    [value]
  )

  const isSlotSelected = useCallback(
    (day: number, hour: number) => {
      const timeStr = formatTime(hour)
      return value.some(
        (s) =>
          s.dayOfWeek === day && s.startTime <= timeStr && s.endTime > timeStr
      )
    },
    [value]
  )

  const isInDragSelection = useCallback(
    (day: number, hour: number) => {
      if (!selectionStart || !selectionEnd) return false
      const minDay = Math.min(selectionStart.day, selectionEnd.day)
      const maxDay = Math.max(selectionStart.day, selectionEnd.day)
      const minHour = Math.min(selectionStart.hour, selectionEnd.hour)
      const maxHour = Math.max(selectionStart.hour, selectionEnd.hour)
      return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour
    },
    [selectionStart, selectionEnd]
  )

  function handleCellMouseDown(day: number, hour: number) {
    setMessage(null)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }

  function handleCellMouseEnter(day: number, hour: number) {
    if (selectionStart) {
      setSelectionEnd({ day, hour })
    }
  }

  function handleCellMouseUp() {
    if (selectionStart && selectionEnd) {
      const minDay = Math.min(selectionStart.day, selectionEnd.day)
      const maxDay = Math.max(selectionStart.day, selectionEnd.day)
      const minHour = Math.min(selectionStart.hour, selectionEnd.hour)
      const maxHour = Math.max(selectionStart.hour, selectionEnd.hour)
      const selectedDuration = (maxHour + 1 - minHour) * 60

      if (selectedDuration < minDurationMinutes) {
        setSelectionStart(null)
        setSelectionEnd(null)
        return
      }

      const newSlots: TimeSlot[] = []
      for (let d = minDay; d <= maxDay; d++) {
        newSlots.push({
          dayOfWeek: d,
          startTime: formatTime(minHour),
          endTime: formatTime(maxHour + 1),
        })
      }

      const overlaps = (slot: TimeSlot) =>
        newSlots.some(
          (newSlot) =>
            newSlot.dayOfWeek === slot.dayOfWeek &&
            slot.startTime < newSlot.endTime &&
            slot.endTime > newSlot.startTime
        )
      const withoutOverlaps = value.filter((slot) => !overlaps(slot))
      const remaining = maxSlots - withoutOverlaps.length

      if (remaining <= 0) {
        setMessage(`U kunt maximaal ${maxSlots} tijdsblokken aangeven.`)
      } else {
        const slotsToAdd = newSlots.slice(0, remaining)
        onChange([...withoutOverlaps, ...slotsToAdd])
        if (newSlots.length > remaining) {
          setMessage(`Er zijn ${remaining} tijdsblok(ken) toegevoegd. Het maximum is ${maxSlots}.`)
        }
      }
    }

    setSelectionStart(null)
    setSelectionEnd(null)
  }

  function removeSlot(index: number) {
    setMessage(null)
    onChange(value.filter((_, i) => i !== index))
  }

  // Build legend of selected slots
  const slotsByDay: Record<number, TimeSlot[]> = {}
  for (const slot of value) {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = []
    slotsByDay[slot.dayOfWeek].push(slot)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Klik en sleep om beschikbare tijdblokken te selecteren
        </Label>
        <span className="text-xs font-medium text-slate-500">
          {value.length}/{maxSlots} geselecteerd
        </span>
        <div className="flex items-center gap-2">
          <Label htmlFor="showAllDays" className="text-xs text-slate-500">
            Weekend tonen
          </Label>
          <Switch
            id="showAllDays"
            checked={showAllDays}
            onCheckedChange={setShowAllDays}
          />
        </div>
      </div>
      {message && (
        <p className="rounded-md border border-[#ffd100] bg-[#fff8d8] px-3 py-2 text-sm font-medium text-slate-800">
          {message}
        </p>
      )}

      <div
        className="overflow-x-auto rounded-lg border border-slate-200"
        onMouseUp={handleCellMouseUp}
        onMouseLeave={handleCellMouseUp}
      >
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
          {/* Header row */}
          <div className="p-2 text-xs font-medium text-slate-500 border-b border-r border-slate-200">
            Tijd
          </div>
          {displayDays.map((day) => (
            <div
              key={day.key}
              className="p-2 text-xs font-medium text-center text-slate-500 border-b border-r border-slate-200 last:border-r-0"
            >
              {day.label}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="p-1 text-xs text-slate-400 border-r border-slate-200 flex items-center justify-end pr-2">
                {formatTime(hour)}
              </div>
              {displayDays.map((day) => {
                const selected = isSlotSelected(day.key, hour)
                const dragging = isInDragSelection(day.key, hour)
                return (
                  <div
                    key={`${day.key}-${hour}`}
                    onMouseDown={() => handleCellMouseDown(day.key, hour)}
                    onMouseEnter={() => handleCellMouseEnter(day.key, hour)}
                    className={`h-7 border-b border-r last:border-r-0 border-slate-100 cursor-pointer transition-colors ${
                      selected || dragging
                        ? 'bg-[#c8102e]'
                        : 'bg-white hover:bg-[#fff3bf]'
                    }`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary of selected slots */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Geselecteerde tijdblokken ({value.length})</Label>
          <div className="flex flex-wrap gap-2">
            {sortedSlots.map((slot) => {
              const index = value.findIndex(
                (item) =>
                  item.dayOfWeek === slot.dayOfWeek &&
                  item.startTime === slot.startTime &&
                  item.endTime === slot.endTime
              )
              return (
              <div
                key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff3bf] px-3 py-1 text-sm text-[#a90d26]"
              >
                <Clock className="h-3 w-3" />
                <span>
                  {DAYS.find((d) => d.key === slot.dayOfWeek)?.label}{' '}
                  {slot.startTime}-{slot.endTime}
                </span>
                <button
                  onClick={() => removeSlot(index)}
                  className="ml-1 text-[#c8102e] hover:text-[#a90d26]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
