import { redirect } from 'next/navigation'

// Portfolio sub-routes exist solely to give each sample portfolio its own OG
// share card (see [portfolio]/opengraph-image.tsx). The HTML page itself is the
// same canonical /how-it-works, scrolled to the matching anchor.
export default function PortfolioPermalink({ params }: { params: { portfolio: string } }) {
  const allowed = new Set(['conservative', 'growth', 'concentrated'])
  if (!allowed.has(params.portfolio)) redirect('/how-it-works')
  redirect(`/how-it-works#portfolio-${params.portfolio}`)
}
