import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-white/50 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/55">
                <h1 className="mb-3 text-2xl font-semibold">Settings</h1>
                <SettingsTabs />
            </div>
            {children}
        </div>
    );
}