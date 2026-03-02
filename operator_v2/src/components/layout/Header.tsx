import { Button } from "@/components/ui/button"
import { Menu, Bell } from "lucide-react"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-brand-header)] border-b border-[#D9DEE4] h-[55px]">
            <div className="flex bg-[#EDEDED] h-full items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-black/5 text-[#5A738E] h-10 w-10">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <nav className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="hover:bg-black/5 text-[#5A738E] relative h-10 w-10">
                            <span className="sr-only">Notifications</span>
                            <Bell className="h-5 w-5" />
                            {/* Notification badge */}
                            <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-400 text-[9px] font-bold text-white z-10 border border-white">
                                6
                            </span>
                        </Button>
                        <Button variant="ghost" className="hover:bg-black/5 text-[#5A738E] h-10 px-3 flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-slate-300" />
                            <span className="text-[13px] font-medium hidden sm:inline-block">Владелец</span>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    )
}
