import { SetMetadata } from '@nestjs/common';

export const REQUIRES_HUMAN_APPROVAL_KEY = 'requiresHumanApproval';

/**
 * @HumanApprovalRequired()
 *
 * Explicit marker that this endpoint or business logic requires human intervention.
 * Used for actions like:
 * - New kirana store approval
 * - Large inventory adjustments
 * - Pending product approval
 * - Refund approval
 *
 * This makes it unambiguous in the backend codebase where human oversight
 * is strictly enforced, preventing automated corruption of core truth data.
 */
export const HumanApprovalRequired = (reason: string) => 
  SetMetadata(REQUIRES_HUMAN_APPROVAL_KEY, { required: true, reason });
