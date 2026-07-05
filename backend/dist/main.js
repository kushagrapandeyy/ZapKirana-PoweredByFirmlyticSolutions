"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const Sentry = __importStar(require("@sentry/nestjs"));
const profiling_node_1 = require("@sentry/profiling-node");
const helmet_1 = __importDefault(require("helmet"));
const common_1 = require("@nestjs/common");
async function bootstrap() {
    if (!process.env.JWT_SECRET) {
        throw new Error('FATAL: JWT_SECRET env var is not set. Refusing to start.');
    }
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            integrations: [
                (0, profiling_node_1.nodeProfilingIntegration)(),
            ],
            tracesSampleRate: 0.1,
            profilesSampleRate: 0.1,
        });
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['https://consumer.zapkirana.app', 'https://vendor.zapkirana.app', 'https://admin.zapkirana.app']
            : '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    if (process.env.SENTRY_DSN) {
        Sentry.setupExpressErrorHandler(app);
    }
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map