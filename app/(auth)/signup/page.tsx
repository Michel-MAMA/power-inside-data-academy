import { redirect } from 'next/navigation';

/** /signup → alias historique de /register */
export default function SignupPage() {
  redirect('/register');
}
