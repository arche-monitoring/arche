import { useState, useEffect } from "react"
import { useSettings, useUpdateSettings, useRefreshAllFavicons } from "@/hooks/use-monitors"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, RefreshCw, Key } from "lucide-react"

export default function Settings() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const refreshFavicons = useRefreshAllFavicons()
  const { changeCredentials, user } = useAuth()

  const [telegramToken, setTelegramToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("")
  const [retentionDays, setRetentionDays] = useState("365")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [credError, setCredError] = useState("")
  const [credSuccess, setCredSuccess] = useState(false)
  const [credSubmitting, setCredSubmitting] = useState(false)

  useEffect(() => {
    if (settings) {
      setTelegramToken(settings.telegram_bot_token || "")
      setTelegramChatId(settings.telegram_chat_id || "")
      setDiscordWebhookUrl(settings.discord_webhook_url || "")
      setRetentionDays(settings.retention_days || "365")
    }
  }, [settings])

  useEffect(() => {
    if (user) setNewUsername(user)
  }, [user])

  const handleSave = () => {
    updateSettings.mutate({
      telegram_bot_token: telegramToken,
      telegram_chat_id: telegramChatId,
      discord_webhook_url: discordWebhookUrl,
      retention_days: retentionDays,
    })
  }

  async function handleChangeCredentials(e: React.FormEvent) {
    e.preventDefault()
    setCredError("")
    setCredSuccess(false)
    setCredSubmitting(true)
    try {
      if (newPassword !== confirmNewPassword) {
        setCredError("Passwords do not match")
        setCredSubmitting(false)
        return
      }
      if (newPassword.length < 6) {
        setCredError("Password must be at least 6 characters")
        setCredSubmitting(false)
        return
      }
      await changeCredentials(currentPassword, newUsername, newPassword)
      setCredSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (err) {
      setCredError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setCredSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure notifications and general options.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refreshFavicons.mutate()} disabled={refreshFavicons.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshFavicons.isPending ? "animate-spin" : ""}`} />
            {refreshFavicons.isPending ? "Refreshing..." : "Refresh Favicons"}
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-6">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discord Notifications</CardTitle>
                <CardDescription>
                  Get alerted when a monitor goes down or comes back up.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>
                  Automatically delete check history older than this many days.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="retentionDays">Retention (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min={1}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Old checks are pruned every 10 minutes. Defaults to 365 days (1 year).
                </div>
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Credentials
              </CardTitle>
              <CardDescription>
                Change your username and password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangeCredentials} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newUsername">New Username</Label>
                  <Input
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {credError && <p className="text-sm text-destructive">{credError}</p>}
                {credSuccess && <p className="text-sm text-emerald-500">Credentials updated successfully.</p>}
                <Button type="submit" disabled={credSubmitting}>
                  {credSubmitting ? "Updating..." : "Update Credentials"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  )
}
