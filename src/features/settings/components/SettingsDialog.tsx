import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "../../../shared/i18n";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { listThemeDefinitions } from "../model/themes";
import { Palette, Terminal, Layout, Shield, RotateCcw } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controller: WorkspaceController;
  onTrustedHostsClick: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  controller,
  onTrustedHostsClick,
}: SettingsDialogProps) {
  const { state } = controller;
  const settings = state.settings;
  const themes = listThemeDefinitions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {t("toolbar.settings")}
          </DialogTitle>
          <DialogDescription>
            自定义 TermoraX 的外观和行为
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="flex-1 flex flex-col min-h-0 mt-4">
          <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span>外观</span>
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-2">
              <Terminal className="h-4 w-4" />
              <span>终端</span>
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2">
              <Layout className="h-4 w-4" />
              <span>工作区</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Shield className="h-4 w-4" />
              <span>高级</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4" orientation="vertical">
            <div className="pr-4">
            {/* 外观设置 */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">主题风格</CardTitle>
                  <CardDescription>
                    选择适合你的工作台主题配色
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => void controller.updateTheme(theme.id)}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          settings.terminal.theme === theme.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div
                          className="w-full h-12 rounded-md shadow-sm"
                          style={{
                            background: theme.variables["--app-background"] as string,
                          }}
                        />
                        <span className="text-xs font-medium truncate w-full text-center">
                          {t(theme.labelKey)}
                        </span>
                        {settings.terminal.theme === theme.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 终端设置 */}
            <TabsContent value="terminal" className="space-y-4 mt-0">
              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">字体设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>字体大小: {settings.terminal.fontSize}px</Label>
                    <Slider
                      value={[settings.terminal.fontSize] as number[]}
                      onValueChange={(value) => {
                        const arr = value as number[];
                        controller.saveSettings({
                          ...settings,
                          terminal: { ...settings.terminal, fontSize: arr[0] },
                        });
                      }}
                      min={10}
                      max={24}
                      step={1}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>行高: {settings.terminal.lineHeight.toFixed(1)}</Label>
                    <Slider
                      value={[settings.terminal.lineHeight] as number[]}
                      onValueChange={(value) => {
                        const arr = value as number[];
                        controller.saveSettings({
                          ...settings,
                          terminal: { ...settings.terminal, lineHeight: arr[0] },
                        });
                      }}
                      min={1}
                      max={2.5}
                      step={0.1}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">光标样式</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                    value={settings.terminal.cursorStyle}
                    onValueChange={(value) =>
                      controller.saveSettings({
                        ...settings,
                        terminal: { ...settings.terminal, cursorStyle: value as "block" | "line" },
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">块状 (Block)</SelectItem>
                      <SelectItem value="line">下划线 (Line)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">选择行为</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>选中时复制</Label>
                      <p className="text-xs text-muted-foreground">
                        选中文本时自动复制到剪贴板
                      </p>
                    </div>
                    <Switch
                      checked={settings.terminal.copyOnSelect}
                      onCheckedChange={(checked) =>
                        controller.saveSettings({
                          ...settings,
                          terminal: { ...settings.terminal, copyOnSelect: checked },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 工作区设置 */}
            <TabsContent value="workspace" className="space-y-4 mt-0">
              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">面板设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>左侧边栏</Label>
                      <p className="text-xs text-muted-foreground">
                        显示连接列表侧边栏
                      </p>
                    </div>
                    <Switch
                      checked={settings.workspace.leftPaneVisible}
                      onCheckedChange={() => void controller.toggleLeftPane()}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>底部面板</Label>
                      <p className="text-xs text-muted-foreground">
                        显示文件、片段等工具面板
                      </p>
                    </div>
                    <Switch
                      checked={settings.workspace.bottomPaneVisible}
                      onCheckedChange={() => void controller.toggleBottomPanel()}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>默认底部面板</Label>
                    <Select
                      value={settings.workspace.bottomPane}
                      onValueChange={(value) =>
                        controller.selectBottomPanel(value as "files" | "snippets" | "history" | "logs")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="files">{t("workspace.action.files")}</SelectItem>
                        <SelectItem value="snippets">{t("workspace.action.snippets")}</SelectItem>
                        <SelectItem value="history">{t("workspace.action.history")}</SelectItem>
                        <SelectItem value="logs">{t("workspace.action.logs")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 高级设置 */}
            <TabsContent value="advanced" className="space-y-4 mt-0">
              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">安全</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={onTrustedHostsClick}
                    variant="secondary"
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t("trustedHosts.title")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-app-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">重置</CardTitle>
                  <CardDescription>
                    将所有设置恢复为默认值
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => void controller.resetSettings()}
                    variant="destructive"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {t("workspace.action.resetSettings")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
