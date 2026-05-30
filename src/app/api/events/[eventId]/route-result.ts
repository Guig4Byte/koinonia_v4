export type ApiCommandError = {
  ok: false;
  message: string;
  status: number;
};

export type ApiCommandSuccess<T extends object> = {
  ok: true;
  data: T;
};

export type ApiCommandResult<T extends object> = ApiCommandSuccess<T> | ApiCommandError;

export function commandError(message: string, status: number): ApiCommandError {
  return { ok: false, message, status };
}

export function commandOk<T extends object>(data: T): ApiCommandSuccess<T> {
  return { ok: true, data };
}
