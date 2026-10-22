import { notFound } from 'next/navigation'
import { getSessionDetailData } from '@/lib/data/history'
import { SessionDetailView } from '@/components/history/SessionDetailView'

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { sessionId } = await params
  const data = await getSessionDetailData(sessionId)

  if (!data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 pt-4 sm:pt-6">
      <SessionDetailView data={data} />
    </div>
  )
}
