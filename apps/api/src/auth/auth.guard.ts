import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type SessionUser } from "./auth";

export type { SessionUser };

/** Loads the session onto the request, or rejects with 401. */
async function requireSession(context: ExecutionContext): Promise<SessionUser> {
  const req = context.switchToHttp().getRequest();
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session?.user) {
    throw new UnauthorizedException();
  }
  req.user = session.user;
  req.session = session.session;
  return session.user as SessionUser;
}

/** Any signed-in user. */
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await requireSession(context);
    return true;
  }
}

abstract class RoleGuard implements CanActivate {
  protected abstract readonly roles: readonly string[];
  protected readonly forbiddenMessage?: string;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = await requireSession(context);
    if (!user.role || !this.roles.includes(user.role)) {
      throw new ForbiddenException(this.forbiddenMessage);
    }
    if (user.mustChangePassword) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "MUST_CHANGE_PASSWORD",
        message: "É necessário alterar a password antes de usar o backoffice.",
      });
    }
    return true;
  }
}

/** Backoffice content: ADMIN and EDITOR. */
@Injectable()
export class AdminGuard extends RoleGuard {
  protected readonly roles = ["ADMIN", "EDITOR"];
}

/** Sensitive operations (users, personal data): ADMIN only. */
@Injectable()
export class SuperAdminGuard extends RoleGuard {
  protected readonly roles = ["ADMIN"];
  protected override readonly forbiddenMessage = "Apenas administradores";
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
