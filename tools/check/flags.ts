// The flags of `bun check`, as a pure function of the arguments.
//   --only=a,b   run these steps only
//   --skip=a,b   run everything but these
//   --fresh      ignore every cache and rebuild them (turbo --force; testmon's data deleted)

export type Flags = { ok: true; only: string[] | null; skip: string[]; fresh: boolean };
export type FlagsError = { ok: false; message: string };

function listOf(flag: string, argv: string[]): string[] | null {
  const found = argv.find((argument) => argument.startsWith(`--${flag}=`));
  return found ? found.slice(flag.length + 3).split(",").filter(Boolean) : null;
}

export function parseFlags(argv: string[], stepIds: string[]): Flags | FlagsError {
  const steps = `Steps: ${stepIds.join(", ")}.`;
  const unknownFlag = argv.find((argument) => !/^--(only|skip)=/.test(argument) && argument !== "--fresh");
  if (unknownFlag) {
    return { ok: false, message: `Unknown flag: ${unknownFlag}. Flags: --only=<steps>, --skip=<steps>, --fresh. ${steps}` };
  }
  const only = listOf("only", argv);
  const skip = listOf("skip", argv) ?? [];
  const unknownSteps = [...(only ?? []), ...skip].filter((id) => !stepIds.includes(id));
  if (unknownSteps.length > 0) return { ok: false, message: `Unknown step: ${unknownSteps.join(", ")}. ${steps}` };
  return { ok: true, only, skip, fresh: argv.includes("--fresh") };
}
