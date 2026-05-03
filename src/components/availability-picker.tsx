'use client'

import { useState, useCallback } from 'react'
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

const HOURS = Array.from({ length: 22 }, (_, i) => i + 7) // 07:00 - 04:00 next day

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
}

export function AvailabilityPicker({
  value,
  onChange,
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

  const displayDays = showAllDays ? DAYS : DAYS.filter((d) => d.key >= 1 && d.key <= 5)

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

      const newSlots: TimeSlot[] = []

      for (let d = minDay; d <= maxDay; d++) {
        // Merge contiguous hours into blocks
        let blockStart = minHour
        let current = minHour

        while (current <= maxHour) {
          if (current === maxHour || !isSlotSelected(d, current + 1)) {
            newSlots.push({
              dayOfWeek: d,
              startTime: formatTime(blockStart),
              endTime: formatTime(current + 1),
            })
            blockStart = current + 1
          }
          current++
        }

        // Remove existing slots for these days, add the new ones
        const filtered = value.filter((s) => s.dayOfWeek !== d)
        const merged = [...filtered, ...newSlots]
        onChange(merged)
      }
    }

    setSelectionStart(null)
    setSelectionEnd(null)
  }

  function removeSlot(index: number) {
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
                        ? 'bg-blue-500'
                        : 'bg-white hover:bg-blue-100'
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
            {value.map((slot, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                <Clock className="h-3 w-3" />
                <span>
                  {DAYS.find((d) => d.key === slot.dayOfWeek)?.label}{' '}
                  {slot.startTime}-{slot.endTime}
                </span>
                <button
                  onClick={() => removeSlot(index)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
