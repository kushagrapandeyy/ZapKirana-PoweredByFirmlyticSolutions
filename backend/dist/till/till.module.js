"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TillModule = void 0;
const common_1 = require("@nestjs/common");
const till_service_1 = require("./till.service");
const till_controller_1 = require("./till.controller");
const prisma_service_1 = require("../prisma.service");
let TillModule = class TillModule {
};
exports.TillModule = TillModule;
exports.TillModule = TillModule = __decorate([
    (0, common_1.Module)({
        providers: [till_service_1.TillService, prisma_service_1.PrismaService],
        controllers: [till_controller_1.TillController],
        exports: [till_service_1.TillService],
    })
], TillModule);
//# sourceMappingURL=till.module.js.map