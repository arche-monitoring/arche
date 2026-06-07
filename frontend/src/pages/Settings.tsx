import { useState, useEffect } from "react"
import { useSettings, useUpdateSettings } from "@/hooks/use-monitors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Save } from "lucide-react"

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const [telegramToken, setTelegramToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")

  useEffect(() => {
    if (settings) {
      setTelegramToken(settings.telegram_bot_token || "")
      setTelegramChatId(settings.telegram_chat_id || "")
    }
  }, [settings])

  const handleSave = () => {
    updateSettings.mutate({
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure notifications and general options.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Telegram Notifications</CardTitle>
              <CardDescription>
                Get alerted when a monitor goes down or comes back up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chatId">Chat ID</Label>
                <Input
                  id="chatId"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001234567890"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                You can also set these via <code className="text-primary">TELEGRAM_BOT_TOKEN</code> and{" "}
                <code className="text-primary">TELEGRAM_CHAT_ID</code> environment variables.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
