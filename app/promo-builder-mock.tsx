import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Download, PlayCircle, Settings } from "lucide-react";

// Simple helpers
const numberOr = (v: string | number, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return isNaN(n) ? fallback : n;
};

const defaultRule = () => ({
  id: crypto.randomUUID(),
  field: "days_since_install",
  op: ">=",
  value: "7",
  value2: "",
});

const fields = [
  { key: "days_since_last_install", label: "Days Since Last Install", type: "number" },
  { key: "lifetime_installs", label: "Lifetime Installs", type: "number" },
  { key: "lifetime_rewards", label: "Lifetime Rewards", type: "number" },
  { key: "lifetime_reward_events", label: "Lifetime Reward Events", type: "number" },
  { key: "is_spender", label: "Is spender", type: "boolean" },
  { key: "lifetime_spend", label: "Total Spend", type: "number"},
  { key: "country", label: "Country", type: "string" },
];

const operatorsByType: Record<string, string[]> = {
  number: [">", ">=", "=", "<=", "<", "between"],
  string: ["=", "!="],
  boolean: ["=", "!="],
};

const findField = (key: string) => fields.find((f) => f.key === key)!;

export default function PromoBuilderMock() {
  const [promoName, setPromoName] = useState("August Super Weekend");
  const [promoType, setPromoType] = useState<"multiplier" | "fixed">("multiplier");
  const [multiplier, setMultiplier] = useState("2");
  const [fixedAmount, setFixedAmount] = useState("100"); // points
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [audType, setAudType] = useState<"static" | "dynamic">("dynamic");
  const [uidsText, setUidsText] = useState<string>("");
  const [rules, setRules] = useState<Array<ReturnType<typeof defaultRule>>>([defaultRule()]);
  const [ruleLogic, setRuleLogic] = useState<"ALL" | "ANY">("ALL");

  const [costMode, setCostMode] = useState<"publisher_absorbs" | "balance_to_margin">("publisher_absorbs");
  const [targetMargin, setTargetMargin] = useState("20");

  const [capsEnabled, setCapsEnabled] = useState(true);
  const [userCap, setUserCap] = useState("1000");
  const [budgetCap, setBudgetCap] = useState("100000");

  const [eligibilityEndpoint, setEligibilityEndpoint] = useState("https://api.publisher.com/promo/eligibility");
  const [webhookUrl, setWebhookUrl] = useState("https://api.publisher.com/promo/webhook");

  const [nonBoostedOnly, setNonBoostedOnly] = useState(true);

  const [testUid, setTestUid] = useState("user-123");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleAddRule = () => setRules((rs) => [...rs, defaultRule()]);
  const handleDelRule = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  const payload = useMemo(() => {
    const base: any = {
      name: promoName,
      schedule: { start: startDate || null, end: endDate || null },
      type: promoType,
      reward: promoType === "multiplier" ? { multiplier: Number(multiplier) } : { fixed_points: Number(fixedAmount) },
      audience: audType === "static"
        ? { type: "static", uids: uidsText.split(/\s|,|;|\n/).filter(Boolean).slice(0, 10000) }
        : { type: "dynamic", logic: ruleLogic, rules: rules.map(r => ({ field: r.field, op: r.op, value: r.value, value2: r.value2 })) },
      cost_handling: costMode === "publisher_absorbs" ? { mode: "publisher_absorbs" } : { mode: "balance_to_margin", target_margin_pct: numberOr(targetMargin, 0) },
      caps: capsEnabled ? { per_user_points: numberOr(userCap, 0), total_points: numberOr(budgetCap, 0) } : null,
      constraints: { non_boosted_milestones_only: !!nonBoostedOnly },
      integrations: {
        eligibility_api: { method: "POST", url: eligibilityEndpoint },
        event_webhook: { method: "POST", url: webhookUrl },
      },
    };
    return base;
  }, [promoName, startDate, endDate, promoType, multiplier, fixedAmount, audType, uidsText, rules, ruleLogic, costMode, targetMargin, capsEnabled, userCap, budgetCap, nonBoostedOnly, eligibilityEndpoint, webhookUrl]);

  const valid = useMemo(() => {
    if (!promoName.trim()) return false;
    if (promoType === "multiplier" && (!multiplier || numberOr(multiplier, 0) < 1 || !Number.isInteger(numberOr(multiplier, -1)))) return false;
    if (promoType === "fixed" && numberOr(fixedAmount, 0) <= 0) return false;
    if (audType === "dynamic" && rules.length === 0) return false;
    return true;
  }, [promoName, promoType, multiplier, fixedAmount, audType, rules]);

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${promoName.replace(/\s+/g, "-").toLowerCase()}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runEligibilityCheck = () => {
    // Offline mock. Real flow would POST to eligibility_api.
    const eligible = Math.random() > 0.3; // 70% eligible mock
    const reason = eligible ? "Eligible based on rules" : "Filtered by rules";
    setTestResult(`${testUid}: ${eligible ? "Eligible" : "Not eligible"} — ${reason}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Promo Campaign Builder</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadConfig}><Download className="h-4 w-4 mr-2" />Download JSON</Button>
          <Button disabled={!valid}><PlayCircle className="h-4 w-4 mr-2" />Create campaign</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Promo name</Label>
                  <Input value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder="Back to School Boost" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={promoType} onValueChange={(v: any) => setPromoType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiplier">Multiplier</SelectItem>
                      <SelectItem value="fixed">Fixed payout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <Separator />
              {promoType === "multiplier" ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Reward multiplier</Label>
                    <Input inputMode="numeric" value={multiplier} onChange={(e) => setMultiplier(e.target.value.replace(/[^0-9]/g, ""))} />
                    <p className="text-xs text-muted-foreground">Positive integer. Applies to non boosted milestones only.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Non boosted milestones only</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={nonBoostedOnly} onCheckedChange={setNonBoostedOnly} />
                      <span className="text-sm">Enforce</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fixed payout (points)</Label>
                    <Input inputMode="numeric" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={audType} onValueChange={(v: any) => setAudType(v)}>
                <TabsList>
                  <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
                  <TabsTrigger value="static">Static</TabsTrigger>
                </TabsList>
                <TabsContent value="dynamic" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label>Match users when</Label>
                    <Select value={ruleLogic} onValueChange={(v: any) => setRuleLogic(v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All rules match</SelectItem>
                        <SelectItem value="ANY">Any rule matches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rules.map((r, idx) => {
                    const f = findField(r.field);
                    const ops = operatorsByType[f.type];
                    return (
                      <div key={r.id} className="grid md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-3 space-y-1">
                          <Label>Field</Label>
                          <Select value={r.field} onValueChange={(v) => setRules((rs) => rs.map(x => x.id === r.id ? { ...x, field: v, op: operatorsByType[findField(v).type][0], value: "", value2: "" } : x))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label>Operator</Label>
                          <Select value={r.op} onValueChange={(v) => setRules((rs) => rs.map(x => x.id === r.id ? { ...x, op: v } : x))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ops.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <Label>Value</Label>
                          <Input value={r.value} onChange={(e) => setRules((rs) => rs.map(x => x.id === r.id ? { ...x, value: e.target.value } : x))} placeholder={f.type === "number" ? "e.g. 7" : "e.g. US"} />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <Label>And value</Label>
                          <Input disabled={r.op !== "between"} value={r.value2} onChange={(e) => setRules((rs) => rs.map(x => x.id === r.id ? { ...x, value2: e.target.value } : x))} placeholder={r.op === "between" ? "e.g. 14" : ""} />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleDelRule(r.id)} aria-label={`Delete rule ${idx+1}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <Button variant="secondary" onClick={handleAddRule}><Plus className="h-4 w-4 mr-2" />Add rule</Button>
                </TabsContent>

                <TabsContent value="static" className="space-y-3">
                  <Label>Paste UIDs (newline or comma separated)</Label>
                  <Textarea rows={6} value={uidsText} onChange={(e) => setUidsText(e.target.value)} placeholder="uid1, uid2, uid3" />
                  <p className="text-xs text-muted-foreground">In production you can upload a CSV. This mock supports paste for speed.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="absorbs" checked={costMode === "publisher_absorbs"} onCheckedChange={() => setCostMode("publisher_absorbs")} />
                  <Label htmlFor="absorbs">Publisher absorbs cost</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="margin" checked={costMode === "balance_to_margin"} onCheckedChange={() => setCostMode("balance_to_margin")} />
                  <Label htmlFor="margin">Auto balance to margin goal</Label>
                </div>
                {costMode === "balance_to_margin" && (
                  <div className="flex items-center gap-2">
                    <Label>Target margin %</Label>
                    <Input className="w-24" inputMode="numeric" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value.replace(/[^0-9.]/g, ""))} />
                  </div>
                )}
              </div>

              <Separator />
              <div className="flex items-center gap-3">
                <Switch checked={capsEnabled} onCheckedChange={setCapsEnabled} />
                <Label>Enable caps</Label>
              </div>
              {capsEnabled && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Per user cap (points)</Label>
                    <Input inputMode="numeric" value={userCap} onChange={(e) => setUserCap(e.target.value.replace(/[^0-9.]/g, ""))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total budget cap (points)</Label>
                    <Input inputMode="numeric" value={budgetCap} onChange={(e) => setBudgetCap(e.target.value.replace(/[^0-9.]/g, ""))} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Eligibility API URL</Label>
                <Input value={eligibilityEndpoint} onChange={(e) => setEligibilityEndpoint(e.target.value)} />
                <p className="text-xs text-muted-foreground">Your backend can call this to check if a user is eligible for a live promo.</p>
              </div>
              <div className="space-y-2">
                <Label>Event webhook URL</Label>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground">We POST award events so you can show creative or meter spend.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Quick test</Label>
                <div className="flex gap-2">
                  <Input className="flex-1" value={testUid} onChange={(e) => setTestUid(e.target.value)} placeholder="Enter UID" />
                  <Button variant="outline" onClick={runEligibilityCheck}><Settings className="h-4 w-4 mr-2"/>Run</Button>
                </div>
                {testResult && <p className="text-sm mt-2">{testResult}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{promoType === "multiplier" ? `x${multiplier || "?"}` : `${fixedAmount || "?"} pts`}</Badge>
                {audType === "dynamic" ? (
                  <Badge>Dynamic audience • {rules.length} rule{rules.length !== 1 ? "s" : ""}</Badge>
                ) : (
                  <Badge>Static audience • {uidsText.split(/\s|,|;|\n/).filter(Boolean).length} UIDs</Badge>
                )}
                <Badge variant="outline">{costMode === "publisher_absorbs" ? "Publisher absorbs" : `Margin target ${targetMargin}%`}</Badge>
                {capsEnabled && <Badge variant="secondary">Caps on</Badge>}
                {nonBoostedOnly && <Badge variant="default">Non boosted only</Badge>}
              </div>
              <div className="rounded-2xl border p-4 text-sm bg-muted/40">
                <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(payload, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
