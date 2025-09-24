import { cn } from "@/lib/utils"

interface FolderCardProps {
  categoryName: string
  documentCount: number
  onClick: () => void
  className?: string
}

export function FolderCard({
  categoryName,
  documentCount,
  onClick,
  className,
}: FolderCardProps) {
  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <div className="group relative h-[4.5em] w-[5.5em] focus-within:[animation:wow_1s_forwards]">
        {/* Main folder body */}
        <div className="absolute bottom-0 h-[88%] w-full rounded-[3px] border-t-2 border-t-[#ce9e27] bg-gradient-to-t from-[#eebe2f] to-[#ffdf76]"></div>
        {/* Folder tab */}
        <div className="absolute top-[5%] h-[19%] w-[38%] rounded-b-[3px] rounded-tl-[3px] rounded-tr-[3px] bg-[#ce9e27] shadow-[0_1px_5px_-2px_rgba(0,0,0,0.5)]">
          {/* Triangle on tab */}
          <div className="absolute left-[88%] h-0 w-0 border-b-[0.3em] border-l-[7px] border-t-[0.3em] border-b-transparent border-l-[#ce9e27] border-t-transparent"></div>
        </div>
        {/* Blue file inside */}
        <div className="absolute bottom-0 left-[0.5em] h-[0.9em] w-[2.5em] rounded-t-[4px] bg-gradient-to-t from-[#1966da] to-[#6da5f9] shadow-[0_0_5px_rgba(0,0,0,0.4)]"></div>
        {/* Dark blue line on file */}
        <div className="absolute bottom-[0.3em] left-[1em] h-[0.18em] w-[1.5em] rounded-[1em] bg-[#144da3] shadow-[0_0_10px_rgba(0,0,0,0.1)]"></div>
      </div>

      <div className="text-center">
        <p className="font-semibold capitalize">{categoryName}</p>
        <p className="text-sm text-muted-foreground">
          {documentCount} {documentCount === 1 ? "Document" : "Documents"}
        </p>
      </div>
    </div>
  )
}
