"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"

interface DateRangeInputProps {
  startDate?: Date
  endDate?: Date
  onDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangeInput({
  startDate,
  endDate,
  onDateChange,
  placeholder = "Select date range",
  className,
  disabled = false,
}: DateRangeInputProps) {
  const [open, setOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  })

  React.useEffect(() => {
    setDateRange({
      from: startDate,
      to: endDate,
    })
  }, [startDate, endDate])

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (onDateChange) {
      onDateChange(range?.from, range?.to)
    }
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder
    
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd-MM-yyyy")} - ${format(dateRange.to, "dd-MM-yyyy")}`
    }
    
    return format(dateRange.from, "dd-MM-yyyy")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface DateRangeFieldsProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange?: (date: Date | undefined) => void
  onEndDateChange?: (date: Date | undefined) => void
  startLabel?: string
  endLabel?: string
  className?: string
  disabled?: boolean
}

export function DateRangeFields({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start Date",
  endLabel = "End Date",
  className,
  disabled = false,
}: DateRangeFieldsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="start-date">{startLabel}</Label>
        <Input
          id="start-date"
          type="date"
          value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onStartDateChange?.(date)
          }}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end-date">{endLabel}</Label>
        <Input
          id="end-date"
          type="date"
          value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onEndDateChange?.(date)
          }}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
