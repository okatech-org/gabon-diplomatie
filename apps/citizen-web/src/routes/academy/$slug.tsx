import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/academy/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/academy/$slug"!</div>
}
