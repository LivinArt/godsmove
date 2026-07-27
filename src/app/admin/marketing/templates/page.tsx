import { redirect } from 'next/navigation';

export default function LegacyTemplatesPage() {
  redirect('/admin/communication/templates');
}
