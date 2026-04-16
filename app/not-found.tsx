import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-8xl font-bold text-accent/20">404</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-text-tertiary mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link href="/queue" className="btn-secondary">
            Go to Queue
          </Link>
        </div>
      </div>
    </div>
  );
}