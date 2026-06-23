export class WorkerEntrypoint<TEnv = unknown> {
  protected readonly ctx: ExecutionContext;
  protected readonly env: TEnv;

  constructor(ctx: ExecutionContext, env: TEnv) {
    this.ctx = ctx;
    this.env = env;
  }
}
