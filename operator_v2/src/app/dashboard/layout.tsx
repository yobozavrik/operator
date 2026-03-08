import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-brand-body)]">
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <Sidebar />
            </div>
            <main className="md:pl-64 flex-1 flex flex-col h-full relative">
                <Header />
                <div className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
