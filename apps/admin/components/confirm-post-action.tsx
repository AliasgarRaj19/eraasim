"use client";

import { useState } from "react";

type ConfirmPostActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  postId: string;
  fieldName?: string;
  label: string;
  confirmation: string;
  destructive?: boolean;
};

export function ConfirmPostAction({ action, postId, fieldName = "postId", label, confirmation, destructive }: ConfirmPostActionProps) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return <button className={destructive ? "post-action destructive-action" : "post-action"} type="button" onClick={() => setConfirming(true)}>{label}</button>;
  }

  return (
    <form className={destructive ? "post-confirmation destructive-confirmation" : "post-confirmation"} action={action}>
      <input type="hidden" name={fieldName} value={postId} />
      <p><strong>{destructive ? "This cannot be undone." : "Confirm this action."}</strong> {confirmation}</p>
      <div>
        <button className="post-action" type="button" onClick={() => setConfirming(false)}>Cancel</button>
        <button className={destructive ? "post-action destructive-action" : "post-action"} type="submit">Confirm {label}</button>
      </div>
    </form>
  );
}
