"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Folder,
  Star,
  Search,
  Check,
  X,
} from "lucide-react";
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: string;
}

const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({
  children,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState<number | "auto">("auto");

  React.useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height;
        setHeight(observedHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, damping: 0.2, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};

interface SnippetFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  groupOptions: string[];
}

export function SnippetFilters({
  query,
  onQueryChange,
  selectedGroup,
  onGroupChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  groupOptions,
}: SnippetFiltersProps) {
  const [groupOpen, setGroupOpen] = React.useState(false);
  const [commandInput, setCommandInput] = React.useState("");

  const hasFilters = query || selectedGroup !== "all" || favoritesOnly;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[120px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索名称、命令、标签或说明"
          className={cn(
            "w-full h-7 pl-7 pr-7 text-xs rounded-md border bg-background",
            "border-app-border bg-black/20 text-app-text",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring"
          )}
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Group Filter Dropdown */}
      <Popover
        open={groupOpen}
        onOpenChange={(open) => {
          setGroupOpen(open);
          if (!open) {
            setTimeout(() => setCommandInput(""), 200);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-6 text-xs gap-1.5 px-2",
              selectedGroup !== "all" && "bg-accent text-accent-foreground"
            )}
          >
            <Folder className="h-3.5 w-3.5" />
            {selectedGroup === "all" ? "全部分组" : selectedGroup}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <AnimateChangeInHeight>
            <Command>
              <CommandInput
                placeholder="搜索分组..."
                className="h-9"
                value={commandInput}
                onValueChange={setCommandInput}
              />
              <CommandList>
                <CommandEmpty>未找到分组</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    className="flex items-center gap-2 cursor-pointer"
                    onSelect={() => {
                      onGroupChange("all");
                      setGroupOpen(false);
                      setCommandInput("");
                    }}
                  >
                    <Checkbox checked={selectedGroup === "all"} />
                    <span className="flex-1">全部分组</span>
                    {selectedGroup === "all" && <Check className="h-3.5 w-3.5" />}
                  </CommandItem>
                  {groupOptions.map((group) => (
                    <CommandItem
                      key={group}
                      className="flex items-center gap-2 cursor-pointer"
                      onSelect={() => {
                        onGroupChange(group);
                        setGroupOpen(false);
                        setCommandInput("");
                      }}
                    >
                      <Checkbox checked={selectedGroup === group} />
                      <span className="flex-1">{group}</span>
                      {selectedGroup === group && <Check className="h-3.5 w-3.5" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </AnimateChangeInHeight>
        </PopoverContent>
      </Popover>

      {/* Favorites Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        className={cn(
          "h-6 text-xs gap-1.5 px-2 transition-colors",
          favoritesOnly && "bg-yellow-500/20 text-yellow-600 border-yellow-500/50 hover:bg-yellow-500/30"
        )}
      >
        <Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-current")} />
        仅收藏
      </Button>

      {/* Clear All Button */}
      {hasFilters && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onQueryChange("");
                onGroupChange("all");
                onFavoritesOnlyChange(false);
              }}
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              清除
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
