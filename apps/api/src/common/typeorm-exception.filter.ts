import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { EntityNotFoundError, QueryFailedError } from "typeorm";

/**
 * Map common TypeORM / Postgres errors to HTTP status codes (avoids 500 noise in Sentry).
 * EntityNotFoundError = record not found (findOneByOrFail / update path)
 * 23505 = unique_violation
 * 23503 = foreign_key_violation
 */
@Catch(EntityNotFoundError, QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError | QueryFailedError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof EntityNotFoundError) {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Registo não encontrado",
        code: "ENTITY_NOT_FOUND",
      });
      return;
    }

    const driverCode = (exception as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
    const map: Record<string, { status: number; message: string }> = {
      "23505": { status: HttpStatus.CONFLICT, message: "Já existe um registo com estes dados" },
      "23503": { status: HttpStatus.BAD_REQUEST, message: "Referência inválida" },
    };
    const mapped = (driverCode && map[driverCode]) || {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Erro interno",
    };
    res.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      code: driverCode ?? "QUERY_FAILED",
    });
  }
}
