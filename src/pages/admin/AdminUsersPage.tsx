import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "../../components/ui/AppDialog";
import { useAdministratorsQuery } from "../../features/admin/useAdministratorsQuery";
import { useAuth } from "../../features/auth/useAuth";
import {
  createAdministrator,
  deleteAdministrator,
  updateAdministrator,
} from "../../services/adminOperations";

export function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const users = useAdministratorsQuery();
  const canManage = users.data?.canManage ?? false;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    uid: string;
    email: string;
  } | null>(null);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["administrators"] });
  const create = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Please sign in to add a staff account.");
      return createAdministrator(user, form);
    },
    onSuccess: async () => {
      setForm({ displayName: "", email: "", password: "" });
      setShowForm(false);
      setError(null);
      await refresh();
    },
    onError: (value) =>
      setError(
        value instanceof Error ? value.message : "The staff account could not be added.",
      ),
  });
  const update = useMutation({
    mutationFn: (input: {
      uid: string;
      displayName: string;
      disabled: boolean;
    }) => {
      if (!user) throw new Error("Please sign in to update a staff account.");
      return updateAdministrator(user, input);
    },
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (uid: string) => {
      if (!user) throw new Error("Please sign in to remove a staff account.");
      return deleteAdministrator(user, uid);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await refresh();
    },
  });
  return (
    <section className="mt-6 sm:mt-10" aria-labelledby="users-title">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-primary">
            ACCESS MANAGEMENT
          </p>
          <h1
            id="users-title"
            className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
          >
            Staff access
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            {canManage ? "Add, pause, or remove staff access." : "View staff access. Only the designated account owner can make changes."}
          </p>
        </div>
        {canManage ? <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground min-[24rem]:w-auto"
        >
          <Plus className="size-4" />
          Add staff
        </button> : null}
      </div>
      {canManage && showForm ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="mt-6 grid gap-5 rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:mt-8 sm:p-6 md:grid-cols-3"
        >
          <label className="text-sm font-semibold">
            Full name
            <input
              required
              value={form.displayName}
              onChange={(event) =>
                setForm({ ...form, displayName: event.target.value })
              }
              className="mt-2 min-h-11 w-full border border-strong-border px-3"
            />
          </label>
          <label className="text-sm font-semibold">
            Email address
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="mt-2 min-h-11 w-full border border-strong-border px-3"
            />
          </label>
          <label className="text-sm font-semibold">
            Temporary password
            <input
              required
              minLength={12}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              className="mt-2 min-h-11 w-full border border-strong-border px-3"
            />
          </label>
          {error ? (
            <p className="text-sm text-danger md:col-span-3" role="alert">
              {error}
            </p>
          ) : null}
          <button
            disabled={create.isPending}
            className="min-h-11 bg-primary px-5 font-semibold text-primary-foreground md:w-fit"
          >
            {create.isPending ? "Creating..." : "Create account"}
          </button>
        </form>
      ) : null}
      {users.isPending ? (
        <p className="mt-10 flex items-center gap-2">
          <LoaderCircle className="size-5 animate-spin" />
          Loading staff...
        </p>
      ) : null}
      {users.isSuccess ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_10px_28px_rgba(20,83,45,0.05)] sm:mt-8">
          <ul className="divide-y divide-border md:hidden">
            {users.data.data.map((account) => (
              <li key={account.uid} className="p-4">
                <p className="font-semibold">
                  {account.displayName || "Unnamed staff member"}
                </p>
                <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {account.email}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold tracking-wide text-muted-foreground">
                      CREATED
                    </p>
                    <p className="mt-1">
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                      }).format(new Date(account.createdAt))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wide text-muted-foreground">
                      STATUS
                    </p>
                    <p className="mt-1">
                      {account.disabled ? "Access paused" : "Active"}
                    </p>
                  </div>
                </div>
                {canManage ? <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={account.uid === user?.uid}
                    onClick={() =>
                      update.mutate({
                        uid: account.uid,
                        displayName: account.displayName || account.email,
                        disabled: !account.disabled,
                      })
                    }
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-primary px-2 text-sm font-semibold text-primary disabled:opacity-40"
                  >
                    <ShieldCheck className="mr-1.5 size-4" />
                    {account.disabled ? "Restore" : "Pause"}
                  </button>
                  <button
                    type="button"
                    disabled={account.uid === user?.uid}
                    onClick={() =>
                      setDeleteTarget({
                        uid: account.uid,
                        email: account.email,
                      })
                    }
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-danger/35 px-2 text-sm font-semibold text-danger disabled:opacity-40"
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Delete
                  </button>
                </div> : null}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[44rem] text-left">
            <thead>
              <tr className="border-b border-strong-border text-xs tracking-wider text-muted-foreground">
                <th className="p-4">ADMINISTRATOR</th>
                <th className="p-4">CREATED</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.data.data.map((account) => (
                <tr key={account.uid}>
                  <td className="p-4">
                    <p className="font-semibold">
                      {account.displayName || "Unnamed staff member"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {account.email}
                    </p>
                  </td>
                  <td className="p-4 text-sm">
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                    }).format(new Date(account.createdAt))}
                  </td>
                  <td className="p-4 text-sm">
                    {account.disabled ? "Access paused" : "Active"}
                  </td>
                  <td className="p-4">
                    {canManage ? <div className="flex gap-4">
                      <button
                        disabled={account.uid === user?.uid}
                        onClick={() =>
                          update.mutate({
                            uid: account.uid,
                            displayName: account.displayName || account.email,
                            disabled: !account.disabled,
                          })
                        }
                        className="cursor-pointer text-sm font-semibold text-primary disabled:opacity-40"
                      >
                        <ShieldCheck className="mr-1 inline size-4" />
                        {account.disabled ? "Restore access" : "Pause access"}
                      </button>
                      <button
                        disabled={account.uid === user?.uid}
                        onClick={() =>
                          setDeleteTarget({
                            uid: account.uid,
                            email: account.email,
                          })
                        }
                        className="cursor-pointer text-sm font-semibold text-danger disabled:opacity-40"
                      >
                        <Trash2 className="mr-1 inline size-4" />
                        Delete
                      </button>
                    </div> : <span className="text-sm text-muted-foreground">Read only</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : null}
      {canManage && deleteTarget ? (
        <AppDialog
          title="Remove staff access"
          description={`Remove ${deleteTarget.email}?`}
          onClose={() => setDeleteTarget(null)}
        >
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              This removes sign-in access. Existing files stay.
            </p>
            {remove.isError ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {remove.error instanceof Error
                  ? remove.error.message
                  : "This staff account could not be removed."}
              </p>
            ) : null}
            <div className="mt-6 grid gap-3 min-[24rem]:flex min-[24rem]:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 cursor-pointer border border-strong-border px-5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleteTarget.uid)}
                className="min-h-11 cursor-pointer bg-danger px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {remove.isPending ? "Removing..." : "Remove access"}
              </button>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </section>
  );
}
