"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

// Debounced search input. Uncontrolled internally so keystrokes never
// wait on the parent's re-render; onValueChange fires after the pause.
export function SearchBar({
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState(
    value ?? defaultValue,
  );

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onValueChange(internalValue);
    }, debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalValue, debounceMs]);

  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
