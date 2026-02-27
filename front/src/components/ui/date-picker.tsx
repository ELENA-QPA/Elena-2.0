"use client"

import * as React from "react"
import { es } from "date-fns/locale"
import { format, parse } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type DatePickerProps = {
    selected?: string | null
    onSelect?: (date: string | undefined) => void
    placeholder?: string
    disabled?: boolean
}

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const years = Array.from(
    { length: new Date().getFullYear() + 10 - 1990 + 1 },
    (_, i) => 1990 + i
)

type CaptionProps = {
    month: Date
    onMonthChange: (date: Date) => void
}

function CustomCaption({ month, onMonthChange }: CaptionProps) {
    const currentYear = month.getFullYear()
    const currentMonth = month.getMonth()

    const handleMonthChange = (value: string) => {
        const next = new Date(month)
        next.setMonth(parseInt(value))
        onMonthChange(next)
    }

    const handleYearChange = (value: string) => {
        const next = new Date(month)
        next.setFullYear(parseInt(value))
        onMonthChange(next)
    }

    return (
        <div className="flex items-center justify-between gap-1 px-1 py-1">
            <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                    const prev = new Date(month)
                    prev.setMonth(prev.getMonth() - 1)
                    onMonthChange(prev)
                }}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-1 flex-1 justify-center">
                <Select value={String(currentMonth)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-7 text-xs px-2 w-[110px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS_ES.map((m, i) => (
                            <SelectItem key={i} value={String(i)} className="text-xs">
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={String(currentYear)} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-7 text-xs px-2 w-[75px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)} className="text-xs">
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                    const next = new Date(month)
                    next.setMonth(next.getMonth() + 1)
                    onMonthChange(next)
                }}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function DatePicker({ selected, onSelect, placeholder = "Seleccionar fecha", disabled = false }: DatePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
        if (!selected) return undefined;
        try {
            const parsedDate = parse(selected, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) return undefined;
            return parsedDate;
        } catch {
            return undefined;
        }
    });

    const [month, setMonth] = React.useState<Date>(selectedDate || new Date());

    React.useEffect(() => {
        if (!selected) {
            setSelectedDate(undefined);
            return;
        }
        try {
            const parsedDate = parse(selected, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) {
                setSelectedDate(undefined);
                return;
            }
            setSelectedDate(parsedDate);
            setMonth(parsedDate);
        } catch {
            setSelectedDate(undefined);
        }
    }, [selected]);

    const handleSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (onSelect) {
            onSelect(date ? format(date, 'yyyy-MM-dd') : undefined);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        disabled && "cursor-not-allowed opacity-50"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate && !isNaN(selectedDate.getTime())
                        ? format(selectedDate, "dd/MM/yyyy")
                        : <span>{placeholder}</span>
                    }
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    locale={es}
                    showOutsideDays={true}
                    fixedWeeks={true}
                    components={{
                        Caption: () => <CustomCaption month={month} onMonthChange={setMonth} />,
                    }}
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "hidden",
                        nav_button_previous: "hidden",
                        nav_button_next: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                        day_today: "border border-primary",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}