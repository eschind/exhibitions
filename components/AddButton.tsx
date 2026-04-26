import Link from 'next/link'

export default function AddButton() {
  return (
    <Link
      href="/new"
      className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
    >
      Add
    </Link>
  )
}
