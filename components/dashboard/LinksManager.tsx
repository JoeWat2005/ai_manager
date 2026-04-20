"use client";

import { useState } from "react";
import { AccentColorSelector } from "@/components/dashboard/AccentColorSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type LinkItem = {
  id: string;
  label: string;
  url: string;
  platform:
    | "custom"
    | "website"
    | "linkedin"
    | "instagram"
    | "facebook"
    | "x"
    | "youtube"
    | "tiktok"
    | "whatsapp";
  visible: boolean;
  sortOrder: number;
};

type LinkProfile = {
  id: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string;
  buttonStyle: string;
  showBranding: boolean;
  items: LinkItem[];
};

type Props = {
  initialProfile: LinkProfile;
};

const PLATFORM_OPTIONS: Array<LinkItem["platform"]> = [
  "custom",
  "website",
  "linkedin",
  "instagram",
  "facebook",
  "x",
  "youtube",
  "tiktok",
  "whatsapp",
];

export function LinksManager({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    label: "",
    url: "",
    platform: "custom" as LinkItem["platform"],
  });

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProfile",
          title: profile.title,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          accentColor: profile.accentColor,
          buttonStyle: profile.buttonStyle,
          showBranding: profile.showBranding,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        profile?: LinkProfile;
      };

      if (!response.ok || !payload.ok || !payload.profile) {
        throw new Error(payload.error ?? "Unable to save links profile");
      }

      setProfile(payload.profile);
      setMessage("Links profile saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function createItem(event: React.FormEvent) {
    event.preventDefault();

    if (!newItem.label.trim() || !newItem.url.trim()) {
      setError("Link label and URL are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createItem",
          label: newItem.label,
          url: newItem.url,
          platform: newItem.platform,
          visible: true,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        item?: LinkItem;
      };

      if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error ?? "Unable to add link item");
      }

      setProfile((current) => ({
        ...current,
        items: [...current.items, payload.item!].sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      setNewItem({ label: "", url: "", platform: "custom" });
      setMessage("Link item added.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchItem(itemId: string, updates: Partial<LinkItem>) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/links/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        item?: LinkItem;
      };

      if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error ?? "Unable to update link item");
      }

      setProfile((current) => ({
        ...current,
        items: current.items
          .map((item) => (item.id === itemId ? payload.item! : item))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      setMessage("Link item updated.");
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(itemId: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/links/${itemId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to delete link item");
      }

      setProfile((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
      }));
      setMessage("Link item deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Links profile</CardTitle>
          <CardDescription>Control your public title, bio, and visual treatment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={saveProfile}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="links-title">Profile title</Label>
                <Input
                  id="links-title"
                  value={profile.title}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="links-bio">Bio</Label>
                <Textarea
                  id="links-bio"
                  value={profile.bio ?? ""}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, bio: event.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <AccentColorSelector
                  label="Accent color"
                  description="Pick the accent used across your public links page."
                  value={profile.accentColor}
                  onValueChange={(value) =>
                    setProfile((current) => ({ ...current, accentColor: value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Button style</Label>
                <Select
                  value={profile.buttonStyle}
                  onValueChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      buttonStyle: value ?? current.buttonStyle,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 sm:col-span-2">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="links-showBranding">Show Deskcaptain branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep a subtle Deskcaptain attribution on your links page.
                  </p>
                </div>
                <Switch
                  id="links-showBranding"
                  checked={profile.showBranding}
                  onCheckedChange={(checked) =>
                    setProfile((current) => ({ ...current, showBranding: checked }))
                  }
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving..." : "Save links profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add link item</CardTitle>
          <CardDescription>Create new destinations for socials, booking, or campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={createItem}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-link-label">Label</Label>
              <Input
                id="new-link-label"
                value={newItem.label}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, label: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Platform</Label>
              <Select
                value={newItem.platform}
                onValueChange={(value) =>
                  setNewItem((current) => ({
                    ...current,
                    platform: value as LinkItem["platform"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PLATFORM_OPTIONS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="new-link-url">URL</Label>
              <Input
                id="new-link-url"
                value={newItem.url}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, url: event.target.value }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" disabled={saving}>
                {saving ? "Adding..." : "Add link"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current links</CardTitle>
          <CardDescription>Adjust labels, order, visibility, and destinations inline.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.label}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          items: current.items.map((candidate) =>
                            candidate.id === item.id
                              ? { ...candidate, label: event.target.value }
                              : candidate
                          ),
                        }))
                      }
                      onBlur={() => patchItem(item.id, { label: item.label })}
                    />
                  </TableCell>
                  <TableCell className="min-w-64">
                    <Input
                      value={item.url}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          items: current.items.map((candidate) =>
                            candidate.id === item.id
                              ? { ...candidate, url: event.target.value }
                              : candidate
                          ),
                        }))
                      }
                      onBlur={() => patchItem(item.id, { url: item.url })}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.platform}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.visible}
                      onCheckedChange={(checked) => patchItem(item.id, { visible: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      value={item.sortOrder}
                      onChange={(event) =>
                        patchItem(item.id, { sortOrder: Number(event.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteItem(item.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {profile.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No links added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {(message || error) && (
            <p className={`mt-4 text-sm font-medium ${error ? "text-destructive" : "text-primary"}`}>
              {error ?? message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
