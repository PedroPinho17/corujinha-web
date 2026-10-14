import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  createParamDecorator,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type SessionUser } from "./auth";

export type { SessionUser };

const ADMIN_ROLES = new Set(["ADMIN", "EDITOR"]);

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      throw new UnauthorizedException();
    }
    req.user = session.user;
    req.session = session.session;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      throw new UnauthorizedException();
    }
    const user = session.user as SessionUser;
    const role = user.role;
    if (!role || !ADMIN_ROLES.has(role)) {
      throw new ForbiddenException();
    }
    if (user.mustChangePassword) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "MUST_CHANGE_PASSWORD",
        message: "É necessário alterar a password antes de usar o backoffice.",
      });
    }
    req.user = session.user;
    req.session = session.session;
    return true;
  }
}

/** Only ADMIN can manage users */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      throw new UnauthorizedException();
    }
    const user = session.user as SessionUser;
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("Apenas administradores");
    }
    if (user.mustChangePassword) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "MUST_CHANGE_PASSWORD",
        message: "É necessário alterar a password antes de usar o backoffice.",
      });
    }
    req.user = session.user;
    req.session = session.session;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
