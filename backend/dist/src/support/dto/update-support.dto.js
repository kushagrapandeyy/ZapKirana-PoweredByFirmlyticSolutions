"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSupportDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_support_dto_1 = require("./create-support.dto");
class UpdateSupportDto extends (0, mapped_types_1.PartialType)(create_support_dto_1.CreateSupportDto) {
}
exports.UpdateSupportDto = UpdateSupportDto;
//# sourceMappingURL=update-support.dto.js.map