"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';
        let code = 'INTERNAL_ERROR';
        let details = null;
        if (exception instanceof common_1.HttpException) {
            const responseData = exception.getResponse();
            if (typeof responseData === 'string') {
                message = responseData;
            }
            else if (typeof responseData === 'object' && responseData !== null) {
                message = responseData.message || message;
                code = responseData.error || code;
                if (Array.isArray(responseData.message)) {
                    message = 'Validation failed';
                    details = responseData.message;
                }
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        this.logger.error(`[${request.method}] ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : '');
        response.status(status).json({
            success: false,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: {
                code,
                message,
                details,
            }
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map