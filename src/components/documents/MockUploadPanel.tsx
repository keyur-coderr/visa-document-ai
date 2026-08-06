"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/StatusChip";
import type { UploadSessionState } from "@/lib/mock/documents";

export interface UploadResult {
  fileName: string;
  sizeKb: number;
  state: UploadSessionState;
}

export interface MockUploadPanelProps {
  caseId: string | null;
  onUploadComplete?: (results: UploadResult[]) => void;
}

interface LocalUploadItem {
  id: string;
  fileName: string;
  sizeKb: number;
  progressPercent: number;
  state: UploadSessionState;
}

const acceptedTypes = ".pdf,.jpg,.jpeg,.png";

const statePresentation: Record<UploadSessionState, { label: string; tone: "neutral" | "info" | "success" | "danger" }> = {
  queued: { label: "Queued", tone: "neutral" },
  uploading: { label: "Uploading", tone: "info" },
  success: { label: "Success", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

function fileAccepted(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".pdf") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png");
}

export function MockUploadPanel({ caseId, onUploadComplete }: MockUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<LocalUploadItem[]>([]);

  const canShowCaseHint = useMemo(() => Boolean(caseId), [caseId]);

  function startMockUpload(fileName: string, sizeKb: number, shouldFail: boolean) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const initial: LocalUploadItem = {
      id,
      fileName,
      sizeKb,
      progressPercent: 0,
      state: "queued",
    };

    setUploads((existing) => [initial, ...existing]);

    let progress = 0;
    const timer = setInterval(() => {
      progress += 20;
      setUploads((existing) =>
        existing.map((item) =>
          item.id === id
            ? {
                ...item,
                state: progress >= 100 ? (shouldFail ? "failed" : "success") : "uploading",
                progressPercent: Math.min(progress, 100),
              }
            : item,
        ),
      );

      if (progress >= 100) {
        clearInterval(timer);
        onUploadComplete?.([
          {
            fileName,
            sizeKb,
            state: shouldFail ? "failed" : "success",
          },
        ]);
      }
    }, 250);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const files = Array.from(fileList);
    files.forEach((file, index) => {
      const accepted = fileAccepted(file.name);
      if (!accepted) {
        startMockUpload(file.name, Math.max(Math.round(file.size / 1024), 1), true);
        return;
      }

      const shouldFail = file.name.toLowerCase().includes("fail") || index % 5 === 4;
      startMockUpload(file.name, Math.max(Math.round(file.size / 1024), 1), shouldFail);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock Upload</CardTitle>
        <CardDescription>
          Drag and drop or choose files. Accepted types: PDF, JPG, PNG. Files stay in local mock state only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={
            isDragging
              ? "rounded-xl border-2 border-dashed border-brand-500 bg-brand-50 p-6 text-center dark:bg-brand-900/20"
              : "rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700"
          }
        >
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Drop files here to simulate upload</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Multi-file upload supported</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Choose Files
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const sampleResults: UploadResult[] = [
                  { fileName: "mobile_capture.jpg", sizeKb: 640, state: "success" },
                  { fileName: "scan_fail.png", sizeKb: 1120, state: "failed" },
                ];
                sampleResults.forEach((item, index) => {
                  startMockUpload(item.fileName, item.sizeKb, item.state === "failed" || index === 1);
                });
              }}
            >
              Run Demo Upload
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          {canShowCaseHint ? "Uploads are currently scoped to this case." : "Uploads can be linked to any case from the global workspace."}
        </div>

        {uploads.length > 0 ? (
          <ul className="space-y-2">
            {uploads.map((upload) => {
              const state = statePresentation[upload.state];
              return (
                <li key={upload.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm dark:border-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200">{upload.fileName}</p>
                    <StatusChip label={state.label} tone={state.tone} />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{upload.sizeKb} KB</p>
                  <div className="mt-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className={upload.state === "failed" ? "h-2 rounded-full bg-danger-500" : "h-2 rounded-full bg-brand-600"}
                      style={{ width: `${upload.progressPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
