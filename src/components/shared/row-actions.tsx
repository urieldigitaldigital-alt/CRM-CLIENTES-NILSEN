"use client";

import type { ReactElement, ReactNode } from "react";
import { MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDialog } from "@/components/forms/form-dialog";
import { DeleteButton } from "@/components/forms/delete-button";

export function RowActions({
  editTitle,
  editForm,
  deleteAction,
  deleteConfirm,
  deleteSuccess,
  extra,
}: {
  editTitle: string;
  editForm: ReactElement<{ onSuccess?: () => void }>;
  deleteAction: () => Promise<void>;
  deleteConfirm: string;
  deleteSuccess: string;
  extra?: ReactNode;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {extra}
          <FormDialog
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
            }
            title={editTitle}
          >
            {editForm}
          </FormDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 data-[highlighted]:bg-danger-soft">
            <DeleteButton
              className="w-full px-2 py-1.5"
              action={deleteAction}
              confirmMessage={deleteConfirm}
              successMessage={deleteSuccess}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
