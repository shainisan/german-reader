import UrlInput from '@/components/UrlInput';

export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">German Reader</h1>
          <p className="text-muted text-base">
            Paste a German article URL to read it bilingually with side-by-side translations.
          </p>
        </div>
        <UrlInput />
      </div>
    </main>
  );
}
