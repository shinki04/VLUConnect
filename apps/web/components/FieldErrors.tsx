// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FieldErrors = ({ field }: { field: any }) => {
  const errors = (field.state.meta.errors ?? []) as { message: string }[];

  if (errors.length === 0) return null;

  return (
    <div className="text-red-500 text-sm mt-1">
      {errors.map((err) => (
        <div key={err.message}>{err.message}</div>
      ))}
    </div>
  );
};
