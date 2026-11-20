/*
 * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RiAddLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiArchiveLine,
  RiDownloadLine,
  RiArrowGoBackLine,
} from "@remixicon/react";
import t from "@/app/lib/i18n";
import {
  getBackups,
  createBackup,
  deleteBackup,
  restoreBackup,
} from "@/app/actions/handson/control/rpanel/backups/manage-backup";
import { getClientWebsites } from "@/app/actions/handson/control/rpanel/websites/get-client-websites";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";

interface Backup {
  name: string;
  website: string;
  backup_type: string;
  file_size_mb: number;
  status: string;
  creation: string;
}

function BackupsContent() {
  const searchParams = useSearchParams();
  const websiteFilter = searchParams.get("website") || "";

  const [backups, setBackups] = useState<Backup[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("Full");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [backupsRes, websitesReply] = await Promise.all([
        getBackups(),
        getClientWebsites(),
      ]);
      // getClientWebsites() wraps the rpanel reply in { message }.
      const websitesRes: any = websitesReply?.message;

      if (backupsRes?.success) {
        setBackups(backupsRes.backups || []);
      }
      if (websitesRes?.success) {
        setWebsites(websitesRes.websites || []);
        if (websitesRes.websites?.length > 0) {
          if (websiteFilter) {
            const matchingSite = websitesRes.websites.find(
              (s: any) =>
                s.name === websiteFilter || s.domain === websiteFilter,
            );
            if (matchingSite) {
              setSelectedWebsite(matchingSite.name);
            } else {
              setSelectedWebsite(websitesRes.websites[0].name);
            }
          } else {
            setSelectedWebsite(websitesRes.websites[0].name);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Filter backups based on URL param or selected website (optional UX choice, sticking to URL param filtering logic if present)
  const filteredBackups = websiteFilter
    ? backups.filter(
        (b) =>
          b.website === websiteFilter ||
          websites.find((w) => w.name === websiteFilter)?.domain === b.website,
      )
    : backups;

  async function handleCreateBackup() {
    if (!selectedWebsite) {
      toast({
        title: "Error",
        description: "Please select a website",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createBackup(selectedWebsite, selectedType);
      if (result?.success) {
        toast({ title: "Success", description: "Backup started successfully" });
        setDialogOpen(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to create backup",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteBackup(name: string) {
    if (!confirm("Are you sure you want to delete this backup?")) return;

    try {
      const result = await deleteBackup(name);
      if (result?.success) {
        toast({ title: "Success", description: "Backup deleted" });
        setBackups(backups.filter((b) => b.name !== name));
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to delete backup",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete backup",
        variant: "destructive",
      });
    }
  }

  async function handleRestoreBackup(name: string) {
    if (
      !confirm(
        "Are you sure you want to restore this backup? This will overwrite current data!",
      )
    )
      return;

    try {
      const result = await restoreBackup(name);
      if (result?.success) {
        toast({ title: "Success", description: "Restore process started" });
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to restore backup",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      });
    }
  }

  if (isLoading)
    return <div className="p-8 text-center">{t("hosting.loading_backups")}</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("hosting.backups")}</h1>
          <p className="text-muted-foreground">
            {t("hosting.manage_your_website_backups_and_restoration_poin")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <RiAddLine className="mr-2 h-4 w-4" />
              {t("hosting.create_backup")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("hosting.create_new_backup")}</DialogTitle>
              <DialogDescription>
                {t("hosting.select_a_website_and_backup_type_to_create_a_new")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("hosting.website")}</Label>
                <Select
                  value={selectedWebsite}
                  onValueChange={setSelectedWebsite}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("app.control.rpanel.backups.ph_website")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {websites.map((site) => (
                      <SelectItem key={site.name} value={site.name}>
                        {site.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("hosting.backup_type")}</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("app.control.rpanel.backups.ph_type")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">
                      {t("hosting.full_backup_files_db")}
                    </SelectItem>
                    <SelectItem value="Files">{t("hosting.files_only")}</SelectItem>
                    <SelectItem value="Database">{t("hosting.database_only")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("hosting.cancel")}
              </Button>
              <Button onClick={handleCreateBackup} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Backup"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("hosting.backup_history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("hosting.website")}</TableHead>
                <TableHead>{t("hosting.type")}</TableHead>
                <TableHead>{t("hosting.size")}</TableHead>
                <TableHead>{t("hosting.created")}</TableHead>
                <TableHead>{t("hosting.status")}</TableHead>
                <TableHead className="text-right">{t("hosting.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBackups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t("hosting.no_backups_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBackups.map((backup) => (
                  <TableRow key={backup.name}>
                    <TableCell className="font-medium">
                      {backup.website}
                    </TableCell>
                    <TableCell>{backup.backup_type}</TableCell>
                    <TableCell>
                      {backup.file_size_mb ? `${backup.file_size_mb} MB` : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(backup.creation).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          backup.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : backup.status === "Failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {backup.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {backup.status === "Completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreBackup(backup.name)}
                          title={t("hosting.restore")}
                        >
                          <RiArrowGoBackLine className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteBackup(backup.name)}
                        title={t("hosting.delete")}
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BackupsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">{t("hosting.loading")}</div>}>
      <BackupsContent />
    </Suspense>
  );
}
