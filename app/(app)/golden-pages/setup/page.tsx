import { redirect } from 'next/navigation'

// Listing setup and editing share one editor. The signup trigger already creates
// the golden_pages_profiles row, so "setup" is just the editor in its initial state.
export default function Page() {
  redirect('/golden-pages/edit')
}
