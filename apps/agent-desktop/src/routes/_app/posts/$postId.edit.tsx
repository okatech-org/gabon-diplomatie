import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/posts/$postId/edit")({
  component: EditPostPage,
});

function EditPostPage() {
  const { postId } = Route.useParams();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Éditer publication
        </h1>
        <p className="text-sm text-muted-foreground">
          Publication : {postId}
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        Cette page sera bientôt disponible
      </div>
    </div>
  );
}
