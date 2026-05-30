import { PublicNav } from '@/components/layout/PublicNav'
import { Footer } from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
