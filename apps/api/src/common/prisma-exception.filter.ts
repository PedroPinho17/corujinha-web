import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@corujinha/database";
import type { Response } from "express";

/**
 * Map common Prisma errors to proper HTTP status codes (avoids 500 noise in Sentry).
 * P2025 = record not found (findUniqueOrThrow / update / delete)
 * P2002 = unique constraint
 * P2003 = FK constraint
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const map: Record<string, { status: number; message: string }> = {
      P2025: { status: HttpStatus.NOT_FOUND, message: "Registo não encontrado" },
      P2002: { status: HttpStatus.CONFLICT, message: "Já existe um registo com estes dados" },
      P2003: { status: HttpStatus.BAD_REQUEST, message: "Referência inválida" },
    };
    const mapped = map[exception.code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro interno",
    };
    res.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      code: exception.code,
    });
  }
}
