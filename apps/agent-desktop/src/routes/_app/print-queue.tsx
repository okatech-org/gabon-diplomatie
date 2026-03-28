import { createFileRoute } from "@tanstack/react-router";
import { PrintQueuePage } from "@/features/print/print-queue-page";

export const Route = createFileRoute("/_app/print-queue")({
  component: PrintQueuePage,
});
