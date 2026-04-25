import Link from 'next/link'
import NewExhibitionForm from '@/components/NewExhibitionForm'

export default function NewPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/"
        className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
      >
        ← All exhibitions
      </Link>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-6 mb-12 pb-6 border-b border-black">
        Add new exhibition
      </h1>
      <NewExhibitionForm />
    </div>
  )
}
