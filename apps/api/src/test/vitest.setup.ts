import { vi } from "vitest";

/** Avoid @InjectRepository resolving entity tokens from the database barrel in unit tests. */
vi.mock("@nestjs/typeorm", () => ({
  InjectRepository: () => () => {},
  TypeOrmModule: {
    forRoot: () => ({ module: class TypeOrmRoot {}, providers: [], exports: [] }),
    forFeature: () => ({ module: class TypeOrmFeature {}, providers: [], exports: [] }),
  },
}));
