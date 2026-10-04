import type { AccountId, AutomationId, CommentId, InstagramUserId, JobId, MediaId } from "./ids";

/**
 * Job Status Discriminator
 */
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobBase {
  id: JobId;
  accountId: AccountId;
  commentId: CommentId;
  commenterUserId: InstagramUserId;
  commenterUsername: string;
  commentText: string;
  postId: MediaId;
  matchedAutomationId?: AutomationId;
  createdAt: number;
  updatedAt: number;
}

/**
 * Discriminated Union across Job Lifecycle states
 */
export type PendingJob = JobBase & {
  status: "pending";
  sendAt: number; // Unix timestamp with 30-90s human anti-spam jitter
  retryCount: number;
  publicReplyId?: string; // Set once the public reply has been dispatched
  parentJobId?: string; // Set when this job is a follow-up DM
  isFollowUp: boolean;
};

export type ProcessingJob = JobBase & {
  status: "processing";
  lockedAt: number;
  retryCount: number;
};

export type CompletedJob = JobBase & {
  status: "completed";
  completedAt: number;
  dispatchedDmId?: string;
  dispatchedReplyId?: string;
};

export type FailedJob = JobBase & {
  status: "failed";
  failedAt: number;
  errorMessage: string;
  retryCount: number;
};

export type AutomationJob =
  | PendingJob
  | ProcessingJob
  | CompletedJob
  | FailedJob;
