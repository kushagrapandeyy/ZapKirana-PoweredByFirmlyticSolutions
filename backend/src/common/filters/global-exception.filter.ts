import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Determine status
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine error message
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = null;

    if (exception instanceof HttpException) {
      const responseData = exception.getResponse() as any;
      if (typeof responseData === 'string') {
        message = responseData;
      } else if (typeof responseData === 'object' && responseData !== null) {
        message = responseData.message || message;
        code = responseData.error || code;
        // Collect class-validator errors if present
        if (Array.isArray(responseData.message)) {
          message = 'Validation failed';
          details = responseData.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`[${request.method}] ${request.url} - ${status} - ${message}`, exception instanceof Error ? exception.stack : '');

    // Standardized response with i18n considerations
    // The message is ALWAYS in English for backend logging and debugging.
    // The frontend should ideally use the 'code' to translate, but we also provide a localizedMessage field
    // that can be populated by a translation service later.
    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: {
        code,
        message, // Always English
        details,
        // localizedMessage: this.i18nService.translate(code, request.headers['accept-language']) 
      }
    });
  }
}
