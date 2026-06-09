export type ApiCommandError = {
  ok: false;
  message: string;
  status: number;
};

export type ApiCommandSuccess<TData extends object> = {
  ok: true;
  data: TData;
};

export type ApiCommandResult<TData extends object> = ApiCommandSuccess<TData> | ApiCommandError;

export function commandError(message: string, status: number): ApiCommandError {
  return { ok: false, message, status };
}

export function commandOk<TData extends object>(data: TData): ApiCommandSuccess<TData> {
  return { ok: true, data };
}
