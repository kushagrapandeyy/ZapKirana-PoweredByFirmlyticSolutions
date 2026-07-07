"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumanApprovalRequired = exports.REQUIRES_HUMAN_APPROVAL_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRES_HUMAN_APPROVAL_KEY = 'requiresHumanApproval';
const HumanApprovalRequired = (reason) => (0, common_1.SetMetadata)(exports.REQUIRES_HUMAN_APPROVAL_KEY, { required: true, reason });
exports.HumanApprovalRequired = HumanApprovalRequired;
//# sourceMappingURL=human-approval.decorator.js.map