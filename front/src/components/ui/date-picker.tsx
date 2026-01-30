"use client"

import * as React from "react"
import { es } from "date-fns/locale"
import { format, parse } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type DatePickerProps = {
    selected?: string | null
    onSelect?: (date: string | undefined) => void
    placeholder?: string
    disabled?: boolean
}

export function DatePicker({ selected, onSelect, placeholder = "Seleccionar fecha", disabled = false }: DatePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
        if (!selected) return undefined;
        
        try {
            const parsedDate = parse(selected, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) {
                return undefined;
            }
            return parsedDate;
        } catch (error) {
            return undefined;
        }
    });

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
        } catch (error) {
            setSelectedDate(undefined);
        }
    }, [selected]);

    const handleSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (onSelect) {
            if (date) {
                const formattedDate = format(date, 'yyyy-MM-dd');
                onSelect(formattedDate);
            } else {
                onSelect(undefined);
            }
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
                    {selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, "dd/MM/yy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    locale={es}
                    showOutsideDays={true}
                    fixedWeeks={true}
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}