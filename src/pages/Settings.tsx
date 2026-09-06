import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  User,
  KeyRound,
  Bell,
  Shield,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/state";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Settings() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [redeemKey, setRedeemKey] = useState("");
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const license = useQuery(api.licenses.myLicense);
  const needsBootstrap = useQuery(api.licenses.needsBootstrap);
  const allLicenses = useQuery(
    api.licenses.listLicenses,
    user?.role === "admin" ? {} : "skip"
  );
  const redeemLicense = useMutation(api.licenses.redeemLicense);
  const issueLicense = useMutation(api.licenses.issueLicense);
  const revokeLicense = useMutation(api.licenses.revokeLicense);
  const makeFirstAdmin = useMutation(api.licenses.makeFirstAdmin);

  if (isLoading) {
    return <LoadingState message="Loading settings…" />;
  }

  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleRedeem = async () => {
    if (!redeemKey.trim()) {
      toast.error("Enter your license key.");
      return;
    }
    try {
      await redeemLicense({ licenseKey: redeemKey });
      toast.success("Lifetime license activated!");
      setRedeemKey("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Redemption failed.");
    }
  };

  const handleIssue = async () => {
    try {
      const result = await issueLicense({});
      setIssuedKey(result.licenseKey);
      toast.success("License key issued — copy it now.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Issuing failed.");
    }
  };

  const handleRevoke = async (licenseKey: string) => {
    try {
      await revokeLicense({ licenseKey });
      toast.success("License revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revocation failed.");
    }
  };

  const handleBootstrap = async () => {
    try {
      await makeFirstAdmin({});
      toast.success("You are now admin. Reload to manage licenses.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bootstrap failed.");
    }
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  return (
    <AppShell user={user ?? undefined} onSignOut={handleSignOut}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Settings"
          description="Manage your account, license, and preferences"
        />
      </motion.div>
      <div className="mt-6">

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="license">
                <KeyRound className="h-4 w-4 mr-2" />
                License
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* License Tab — one-time lifetime access, no subscriptions */}
            <TabsContent value="license">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>License</CardTitle>
                  <CardDescription>One payment, lifetime software access. Infrastructure costs stay yours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {license ? (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">Lifetime license active</span>
                      </div>
                      <p className="text-sm text-green-800">
                        Key <code>{license.licenseKey}</code> · since{" "}
                        {new Date(license.issuedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-green-800 mt-1">
                        Unlimited automations. Your backend, AI, and Meta usage are billed by those providers, not us.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg bg-secondary/50">
                        <p className="font-semibold mb-1">Evaluation mode</p>
                        <p className="text-sm text-muted-foreground">
                          1 active flow · modest central limits. Redeem a lifetime license for unlimited automations.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license-key">Redeem license key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="license-key"
                            placeholder="CFAI-XXXX-XXXX-XXXX"
                            value={redeemKey}
                            onChange={(e) => setRedeemKey(e.target.value)}
                            autoComplete="off"
                          />
                          <Button onClick={handleRedeem}>Redeem</Button>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/pricing")}>
                        Get a lifetime license — $10 one-time
                      </Button>
                    </>
                  )}

                  {needsBootstrap && (
                    <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                      <p className="font-medium mb-2">No admin yet</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Claim admin once to issue license keys.
                      </p>
                      <Button variant="outline" onClick={handleBootstrap}>Make me admin</Button>
                    </div>
                  )}

                  {user?.role === "admin" && (
                    <div className="p-4 rounded-lg border space-y-3">
                      <p className="font-medium">Admin — issue keys</p>
                      <Button variant="outline" onClick={handleIssue}>Issue new key</Button>
                      {issuedKey && (
                        <p className="text-sm">
                          New key: <code className="font-bold">{issuedKey}</code> (copy now — shown once)
                        </p>
                      )}
                      <div className="space-y-1">
                        {allLicenses?.map((l) => (
                          <div key={l._id} className="flex items-center justify-between text-sm py-1 border-t">
                            <span>
                              <code>{l.licenseKey}</code>{" "}
                              <span className="text-muted-foreground">· {l.status}</span>
                            </span>
                            {l.status === "active" && (
                              <Button variant="ghost" size="sm" onClick={() => handleRevoke(l.licenseKey)}>
                                Revoke
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what updates you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Flow Execution Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when flows execute</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Reports</p>
                      <p className="text-sm text-muted-foreground">Receive daily analytics summaries</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium mb-2">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium mb-2">Active Sessions</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage devices where you're logged in
                    </p>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppShell>
  );
}