"use client";

import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import type { MotTest } from "@/types";
import { cn } from "@/lib/utils";

interface MotHistoryListProps {
  tests: MotTest[];
  limit?: number;
}

export function MotHistoryList({ tests, limit = 8 }: MotHistoryListProps) {
  const shown = tests.slice(0, limit);

  if (shown.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        No MOT tests on record yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {shown.map((test) => {
        const passed = test.testResult === "PASSED";
        const comments = test.rfrAndComments || test.defects || [];
        return (
          <div
            key={test.testId || test.completedDate}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-4 text-white shadow-md transition-transform hover:scale-[1.01]",
              passed
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
            )}
          >
            <div className="rounded-full bg-white/20 p-2">
              {passed ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold">{test.testResult}</span>
                <span className="text-sm text-white/90">
                  {formatDate(test.completedDate)}
                </span>
              </div>
              {test.odometerValue > 0 && (
                <p className="text-sm font-medium text-white/85">
                  {test.odometerValue.toLocaleString()} {test.odometerUnit}
                </p>
              )}
            </div>
            {comments.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 bg-white/20 text-white hover:bg-white/30"
                  >
                    {comments.length} item{comments.length !== 1 ? "s" : ""}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>MOT — {formatDate(test.completedDate)}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[400px] space-y-2 overflow-y-auto">
                    {comments.map((comment, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg border p-3 text-sm",
                          comment.type === "ADVISORY"
                            ? "border-amber-200 bg-amber-50"
                            : comment.type === "FAIL" ||
                                comment.type === "MAJOR" ||
                                comment.type === "DANGEROUS"
                              ? "border-red-200 bg-red-50"
                              : "bg-muted"
                        )}
                      >
                        <Badge variant="outline" className="mb-1">
                          {comment.type}
                        </Badge>
                        <p>{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <ChevronRight className="h-5 w-5 shrink-0 opacity-60" />
          </div>
        );
      })}
    </div>
  );
}
